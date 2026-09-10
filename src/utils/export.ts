import { Transaction, BusinessSettings } from '../types';

/**
 * Exports transactions to Excel CSV format with Indonesian headers and summary
 */
export function exportToExcelCSV(transactions: Transaction[], settings: BusinessSettings, reportDate: string = new Date().toISOString().split('T')[0]) {
  const headers = [
    'No',
    'Kode Transaksi',
    'Waktu',
    'Nama Pelanggan',
    'No Member',
    'Tipe Transaksi',
    'Keterangan',
    'Jumlah Tiket',
    'Nominal (Rp)',
    'Metode Pembayaran',
    'Status',
    'Token Enkripsi Keamanan',
  ];

  const rows = transactions.map((t, index) => {
    const dateFormatted = new Date(t.timestamp).toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });

    const typeLabel =
      t.type === 'entry_ticket' ? 'Tiket Masuk' :
      t.type === 'top_up' ? 'Top Up Saldo' :
      t.type === 'course_fee' ? 'Biaya Kursus' : 'Pengembalian (Refund)';

    const statusLabel =
      t.status === 'success' ? 'Berhasil' :
      t.status === 'cancelled' ? 'Dibatalkan/Void' : 'Pending';

    return [
      index + 1,
      `"${t.code}"`,
      `"${dateFormatted}"`,
      `"${t.userName}"`,
      `"${t.memberNumber}"`,
      `"${typeLabel}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      t.quantity || 1,
      t.amount,
      `"${t.paymentMethod} ${t.channelName ? `(${t.channelName})` : ''}"`,
      `"${statusLabel}"`,
      `"${t.securityHash}"`,
    ];
  });

  // Calculate totals
  const totalRevenue = transactions
    .filter(t => t.status === 'success' && t.type !== 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTickets = transactions
    .filter(t => t.status === 'success' && t.type === 'entry_ticket')
    .reduce((sum, t) => sum + (t.quantity || 1), 0);

  const totalRefunded = transactions
    .filter(t => t.type === 'refund' || t.status === 'cancelled')
    .reduce((sum, t) => sum + t.amount, 0);

  const csvContent = [
    `LAPORAN TRANSAKSI & PENJUALAN TIKET - ${settings.businessName}`,
    `Tanggal Laporan: ${reportDate}`,
    `Dicetak Pada: ${new Date().toLocaleString('id-ID')}`,
    `Total Tiket Masuk Terjual: ${totalTickets} tiket`,
    `Total Penjualan Kotor: Rp ${totalRevenue.toLocaleString('id-ID')}`,
    `Total Pengembalian (Refund): Rp ${totalRefunded.toLocaleString('id-ID')}`,
    `Pendapatan Bersih: Rp ${(totalRevenue - totalRefunded).toLocaleString('id-ID')}`,
    '',
    headers.join(','),
    ...rows.map(e => e.join(',')),
  ].join('\r\n');

  // Add UTF-8 BOM so Excel opens accents and symbols properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Penjualan_${settings.businessName.replace(/\s+/g, '_')}_${reportDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers standard print dialog for PDF saving
 */
export function printReportAsPDF() {
  window.print();
}
