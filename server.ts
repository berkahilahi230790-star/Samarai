import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WebhookNotification {
  id: string;
  memberId?: string;
  memberNumber?: string;
  amount: number;
  channelName: string;
  referenceId: string;
  transactionStatus: 'PAID' | 'SETTLED' | 'SUCCESS';
  timestamp: string;
  rawPayload?: any;
}

// In-memory queue of recent QRIS webhook payments
let recentWebhookPayments: WebhookNotification[] = [];
// Connected SSE clients for instant live push
const sseClients = new Set<express.Response>();

export function broadcastPayment(payment: WebhookNotification) {
  recentWebhookPayments.unshift(payment);
  if (recentWebhookPayments.length > 50) {
    recentWebhookPayments.pop();
  }

  const dataString = `data: ${JSON.stringify(payment)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(dataString);
    } catch {
      sseClients.delete(res);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  /**
  /**
   * QRIS & NotivGo Webhook Endpoint
   * Accepts callbacks from:
   * 1. NotivGo (notivgo.com - Android Push Notification Forwarder for BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay)
   * 2. Payment Gateways (Midtrans, Xendit, Doku, Tripay, QRIS MPM/CPM)
   * URLs: POST /api/webhook/notivgo, /api/notivgo/webhook, /api/webhook/qris
   */
  app.post(
    [
      '/api/webhook/notivgo',
      '/api/notivgo/webhook',
      '/api/webhook/qris',
      '/api/webhooks/qris',
      '/api/payment/qris/webhook',
    ],
    (req, res) => {
      try {
        const body = req.body || {};
        const isNotivgoEndpoint = req.path.includes('notivgo') || Boolean(body.app || body.nominal || body.sender || body.keterangan);

        // Helper to parse currency string (e.g. "Rp 50.000", "50.000", "Rp50,000.00")
        const parseCurrencyAmount = (val: any): number => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          const cleaned = String(val).replace(/[^0-9]/g, '');
          return cleaned ? parseInt(cleaned, 10) : 0;
        };

        // Extract amount from standard fields or NotivGo fields (nominal, amount, kredit, gross_amount, etc.)
        let amount = Number(
          body.amount ??
          body.nominal ??
          body.gross_amount ??
          body.total_amount ??
          body.paid_amount ??
          body.kredit ??
          body.value ??
          0
        );

        // If amount is 0, try parsing text from content/message (e.g. NotivGo notification body "Masuk Rp 50.000 dari...")
        if (amount <= 0 && (body.content || body.message || body.title)) {
          const text = `${body.title || ''} ${body.content || ''} ${body.message || ''}`;
          const match = text.match(/Rp\s*([0-9.,]+)/i) || text.match(/(?:sebesar|masuk|terima|rp)\s*([0-9.,]+)/i);
          if (match && match[1]) {
            amount = parseCurrencyAmount(match[1]);
          }
        }

        // Member identifiers
        let memberId =
          body.memberId ??
          body.userId ??
          body.custom_field1 ??
          body.customer_id ??
          '';

        let memberNumber =
          body.memberNumber ??
          body.member_number ??
          body.custom_field2 ??
          '';

        // Extract memberNumber from note/keterangan/content/message if present (e.g., "SMP20250811" or "SMP-2025-0811")
        const searchableText = `${body.note || ''} ${body.keterangan || ''} ${body.content || ''} ${body.message || ''} ${body.title || ''} ${body.description || ''}`;
        if (!memberNumber) {
          const smpMatch = searchableText.match(/SMP-?\d+/i);
          if (smpMatch) {
            memberNumber = smpMatch[0].toUpperCase();
          }
        }

        const senderName =
          body.sender ??
          body.payer ??
          body.pengirim ??
          body.customer_name ??
          body.nama ??
          '';

        // Determine channel / bank
        const appSource = body.app || body.bank || body.package_name || body.channel || body.provider || '';
        let channelName = body.channelName;
        if (!channelName) {
          if (isNotivgoEndpoint || appSource) {
            channelName = appSource ? `NotivGo (${appSource})` : 'NotivGo (QRIS Android)';
          } else {
            channelName = body.payment_type ?? body.payment_method ?? body.issuer ?? 'QRIS Instant Settlement';
          }
        }

        const referenceId =
          body.referenceId ??
          body.order_id ??
          body.external_id ??
          body.transaction_id ??
          body.id ??
          `${isNotivgoEndpoint ? 'NOTIVGO' : 'QRIS'}-${Date.now()}`;

        // Validate status
        const incomingStatus = (
          body.status ??
          body.transaction_status ??
          body.type ?? // in NotivGo, type may be 'credit' or 'in'
          'PAID'
        ).toString().toUpperCase();

        const isSuccessful =
          incomingStatus === 'PAID' ||
          incomingStatus === 'SETTLEMENT' ||
          incomingStatus === 'SUCCESS' ||
          incomingStatus === 'COMPLETED' ||
          incomingStatus === 'CAPTURED' ||
          incomingStatus === 'CREDIT' ||
          incomingStatus === 'CR' ||
          incomingStatus === 'IN' ||
          incomingStatus === 'MASUK' ||
          incomingStatus === 'OK' ||
          isNotivgoEndpoint; // NotivGo only fires webhooks on incoming credit events

        if (!isSuccessful) {
          return res.status(200).json({
            status: 'acknowledged',
            message: `Ignored status ${incomingStatus} (non-settlement)`,
          });
        }

        if (amount <= 0) {
          return res.status(400).json({
            error: 'Invalid amount',
            message: 'Nominal pembayaran tidak ditemukan atau 0',
          });
        }

        const notification: WebhookNotification & { sender?: string } = {
          id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          memberId: memberId || undefined,
          memberNumber: memberNumber || undefined,
          amount,
          channelName: channelName || 'QRIS',
          referenceId,
          transactionStatus: 'PAID',
          timestamp: new Date().toISOString(),
          rawPayload: body,
        };

        if (senderName) {
          (notification as any).sender = senderName;
        }

        broadcastPayment(notification);

        console.log(
          `[Webhook Received] ${channelName} | Rp ${amount.toLocaleString('id-ID')} | Member: ${
            memberId || memberNumber || senderName || 'Auto-Match'
          }`
        );

        return res.status(200).json({
          success: true,
          message: isNotivgoEndpoint
            ? 'Notifikasi NotivGo berhasil diterima dan koin ditambahkan ke saldo'
            : 'Webhook QRIS berhasil diterima dan diproses',
          notificationId: notification.id,
          amount,
          channel: channelName,
          matchedMember: memberNumber || memberId || senderName || 'Active Member',
        });
      } catch (err: any) {
        console.error('[Webhook Error]', err);
        return res.status(500).json({ error: 'Internal webhook error', details: err?.message });
      }
    }
  );

  /**
   * Realtime Server-Sent Events (SSE) Endpoint
   * Frontend connects here to receive instant QRIS push notifications without polling
   */
  app.get('/api/webhook/qris/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial ping
    res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  /**
   * Polling fallback endpoint for recent webhook transactions
   */
  app.get('/api/webhook/qris/recent', (req, res) => {
    const since = req.query.since ? Number(req.query.since) : 0;
    const filtered = since
      ? recentWebhookPayments.filter(p => new Date(p.timestamp).getTime() > since)
      : recentWebhookPayments;
    res.json({
      status: 'ok',
      payments: filtered,
    });
  });

  // Vite development middleware mounting (Full-Stack Vite Express architecture)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Samarai Server] Server listening on port ${PORT}`);
    console.log(`[Samarai Server] QRIS Webhook ready at: http://localhost:${PORT}/api/webhook/qris`);
  });
}

startServer();
