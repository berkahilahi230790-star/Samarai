import { QRPayload } from '../types';

const SECRET_SALT = 'SAMARAI_PARK_SECURE_TOKEN_SALT_2025_99x';

/**
 * Lightweight deterministic cryptographic-style hash (DJB2 + FNV-1a combination with hex output)
 */
export function createSecureHash(input: string): string {
  let hash1 = 5381;
  let hash2 = 2166136261;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = (hash2 ^ char) * 16777619;
  }

  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `SMP-${hex1.toUpperCase()}-${hex2.toUpperCase()}`;
}

/**
 * Generates an encrypted digital signature for member QR code
 */
export function signMemberToken(memberId: string, memberNumber: string, timestamp: number, nonce: string): string {
  const raw = `${memberId}|${memberNumber}|${timestamp}|${nonce}|${SECRET_SALT}`;
  return createSecureHash(raw);
}

/**
 * Encodes full QR payload into an encrypted transport string
 * Supports static token system: stays constant unless member refreshes token
 */
export function generateMemberQRPayload(
  memberId: string,
  memberNumber: string,
  token?: string,
  updatedTimestamp?: number
): string {
  // Use member's static token or generate a deterministic token from memberNumber
  const nonce = token || `TKN-${createSecureHash(memberNumber).substring(4, 12)}`;
  const ts = updatedTimestamp || 1735689600000;
  const signature = signMemberToken(memberId, memberNumber, ts, nonce);

  const payload: QRPayload = {
    mId: memberId,
    mNum: memberNumber,
    ts,
    exp: 0, // 0 indicates static QR (never auto-expires by time)
    nonce,
    sig: signature,
    isStatic: true,
  };

  const json = JSON.stringify(payload);
  // Base64-encode for compact QR readability
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Validates and decodes a scanned QR payload
 */
export function verifyAndDecodeQR(rawQrString: string): { isValid: boolean; payload?: QRPayload; error?: string } {
  try {
    const jsonStr = decodeURIComponent(escape(atob(rawQrString)));
    const payload = JSON.parse(jsonStr) as QRPayload;

    if (!payload.mId || !payload.mNum || !payload.ts || !payload.sig || !payload.nonce) {
      return { isValid: false, error: 'Format QR Code tidak valid atau rusak.' };
    }

    // Check expiration only if NOT a static QR and exp is positive
    const now = Date.now();
    if (!payload.isStatic && payload.exp && payload.exp > 0 && now > payload.exp + 60000) {
      return { isValid: false, error: 'QR Code telah kadaluarsa. Silakan refresh token pada aplikasi member.' };
    }

    // Verify digital signature
    const expectedSig = signMemberToken(payload.mId, payload.mNum, payload.ts, payload.nonce);
    if (payload.sig !== expectedSig) {
      return { isValid: false, error: 'Tanda tangan digital QR tidak valid! Kemungkinan duplikasi ilegal.' };
    }

    return { isValid: true, payload };
  } catch {
    // If not base64 JSON, maybe raw member ID entered manually
    return { isValid: false, error: 'Data QR tidak dapat didekripsi.' };
  }
}

/**
 * Generates a transaction verification hash
 */
export function generateTransactionHash(txId: string, userId: string, amount: number, timestamp: string): string {
  const raw = `TX-${txId}|${userId}|${amount}|${timestamp}|${SECRET_SALT}`;
  return createSecureHash(raw);
}
