import React from 'react';
import { Transaction, BusinessSettings } from '../../types';

interface PrintableReportProps {
  transactions: Transaction[];
  settings: BusinessSettings;
  reportDate: string;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ transactions, settings, reportDate }) => {
  const filtered = transactions.filter(t => t.timestamp.startsWith(reportDate));

  const totalTickets = filtered
    .filter(t => t.type === 'entry_ticket' && t.status === 'success')
    .reduce((sum, t) => sum + (t.quantity || 1), 0);

  const totalRevenue = filtered
    .filter(t => t.status === 'success' && t.type !== 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = filtered
    .filter(t => t.type === 'refund' || t.status === 'cancelled')
    .reduce((sum, t) => sum + t.amount, 0);

  const netRevenue = totalRevenue - totalRefunds;

  return (
    <div id="printable-report" className="hidden p-8 max-w-4xl mx-auto bg-white text-slate-900 font-sans">
      
      {/* Letterhead */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider">{settings.businessName}</h1>
          <p className="text-xs text-slate-600 mt-0.5">{settings.address}</p>
          <p className="text-xs text-slate-600">Kontak: {settings.contactPhone} • Jam Operasional: {settings.openHours}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase bg-slate-100 px-3 py-1 rounded border border-slate-300">
            Laporan Penjualan Harian
          </span>
          <p className="text-xs text-slate-600 mt-2 font-mono">Tanggal: {reportDate}</p>
        </div>
      </div>

      {/* Summary KPI Boxes */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-center">
        <div className="p-3 border border-slate-300 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Tiket Terjual</span>
          <span className="text-xl font-bold">{totalTickets} Tiket</span>
        </div>
        <div className="p-3 border border-slate-300 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Penjualan</span>
          <span className="text-xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</span>
        </div>
        <div className="p-3 border border-slate-300 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Pengembalian</span>
          <span className="text-xl font-bold text-rose-600">Rp {totalRefunds.toLocaleString('id-ID')}</span>
        </div>
        <div className="p-3 border border-slate-300 rounded-lg bg-slate-50">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Pendapatan Bersih</span>
          <span className="text-xl font-bold text-emerald-700">Rp {netRevenue.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Transactions Table */}
      <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
        <thead>
          <tr className="bg-slate-100 text-slate-800">
            <th className="border border-slate-300 p-2">No</th>
            <th className="border border-slate-300 p-2">Kode</th>
            <th className="border border-slate-300 p-2">Waktu</th>
            <th className="border border-slate-300 p-2">Nama Pelanggan</th>
            <th className="border border-slate-300 p-2">Keterangan</th>
            <th className="border border-slate-300 p-2 text-center">Qty</th>
            <th className="border border-slate-300 p-2 text-right">Nominal</th>
            <th className="border border-slate-300 p-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-slate-400">
                Tidak ada transaksi tercatat pada tanggal ini.
              </td>
            </tr>
          ) : (
            filtered.map((t, idx) => (
              <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                <td className="border border-slate-300 p-2 font-mono">{t.code}</td>
                <td className="border border-slate-300 p-2 font-mono">
                  {new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="border border-slate-300 p-2 font-medium">{t.userName}</td>
                <td className="border border-slate-300 p-2">{t.title}</td>
                <td className="border border-slate-300 p-2 text-center">{t.quantity || 1}</td>
                <td className="border border-slate-300 p-2 text-right font-medium">
                  {t.type === 'refund' ? '-' : ''}Rp {t.amount.toLocaleString('id-ID')}
                </td>
                <td className="border border-slate-300 p-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'success' ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {t.status === 'success' ? 'OK' : 'VOID'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Signature area */}
      <div className="flex justify-between items-end pt-8 text-xs">
        <div>
          <p className="text-slate-500 font-mono text-[10px]">Dicetak oleh Sistem Samarai Park</p>
          <p className="text-slate-500 font-mono text-[10px]">{new Date().toLocaleString('id-ID')}</p>
        </div>
        <div className="text-center w-48">
          <p className="text-slate-600 mb-14">Manajer Operasional,</p>
          <p className="font-bold underline">Super Admin SAMARAI</p>
          <p className="text-[10px] text-slate-500 font-mono">ID: ADM-SAMARAI-01</p>
        </div>
      </div>

    </div>
  );
};
