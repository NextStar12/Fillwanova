/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLog, UserRole, User } from '../types';
import { ShieldAlert, Search, RefreshCw, Calendar, Download, Eye } from 'lucide-react';

interface AuditLogsProps {
  logs: AuditLog[];
  currentUser: User;
  onClearLogs?: () => void;
  onExportCsv: (data: any[], filename: string) => void;
}

export default function AuditLogs({ logs, currentUser, onClearLogs, onExportCsv }: AuditLogsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center text-red-800">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold">Akses Log Terbatas</h3>
        <p className="text-xs mt-1">Hanya Super Admin atau Admin yang berhak memantau sejarah jejak audit aktivitas sistem.</p>
      </div>
    );
  }

  // Extract unique actions
  const actionTypes = Array.from(new Set(logs.map(log => log.action)));

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || log.userRole === roleFilter;
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesRole && matchesAction;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleExport = () => {
    const csvData = filteredLogs.map(log => ({
      'ID Log': log.id,
      'Waktu (UTC)': new Date(log.timestamp).toLocaleString('id-ID'),
      'Nama Pengguna': log.userName,
      'Peran': log.userRole,
      'Aktivitas': log.action,
      'ID Target': log.targetId || '-',
      'Detail Deskripsi': log.details
    }));
    onExportCsv(csvData, `MaintiX_Log_Audit_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-slate-950 shrink-0" />
            Log Audit Keamanan
          </h2>
          <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-1">
            Mencatat setiap jejak transaksi, aktivitas persetujuan dokumen, dan perubahan RBAC pengguna secara kronologis.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isSuperAdmin && onClearLogs && (
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus seluruh log audit? Tindakan ini dicatat di log baru.')) {
                  onClearLogs();
                }
              }}
              className="px-4 py-2 border-2 border-red-500 hover:bg-red-50 text-red-650 rounded-none text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Kosongkan Logs
            </button>
          )}

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-none text-xs font-black uppercase tracking-widest shadow transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV Excel
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-5 rounded-none border-2 border-slate-900 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Kata Kunci Pencarian</label>
          <input
            type="text"
            placeholder="Cari logs atau nama user..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 border-2 border-slate-900 rounded-none bg-slate-50 focus:outline-none focus:bg-white text-slate-900 font-bold font-mono"
          />
        </div>

        <div>
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Filter Peran Pengguna</label>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full text-xs px-2 .py-2 border-2 border-slate-900 rounded-none bg-slate-50 focus:outline-none text-slate-900 font-extrabold uppercase"
            style={{ padding: '6px' }}
          >
            <option value="ALL">Semua Peran</option>
            {Object.values(UserRole).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Filter Tipe Aktivitas</label>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full text-xs px-2 .py-2 border-2 border-slate-900 rounded-none bg-slate-50 focus:outline-none text-slate-900 font-extrabold uppercase"
            style={{ padding: '6px' }}
          >
            <option value="ALL">Semua Aktivitas</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-none border-2 border-slate-900 overflow-hidden shadow flex flex-col">
        <div className="bg-slate-900 px-4 py-3 border-b-2 border-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-100 font-black uppercase tracking-wider">Menampilkan {filteredLogs.length} Entri Log Terdaftar</span>
          <span className="text-[10px] font-mono text-orange-400 font-black uppercase">Waktu Sinkron UTC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-900 uppercase tracking-wider text-[10px] border-b-2 border-slate-900 font-black">
                <th className="py-3 px-4">Waktu Kejadian</th>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Aksi Audit</th>
                <th className="py-3 px-4">Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 select-none">
              {filteredLogs.map(log => {
                const isSystemAction = log.action.includes('LOGIN') || log.action.includes('RBAC');
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-all">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap font-bold">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900 font-black text-[10px]">
                      {log.id}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 uppercase">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 border border-slate-900 bg-slate-100 text-slate-900 text-[9px] font-black uppercase">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 border text-[9px] font-mono font-black uppercase ${
                        log.action.startsWith('APPROVE') ? 'bg-emerald-100 text-emerald-805 border-emerald-500' :
                        log.action.startsWith('REJECT') ? 'bg-red-100 text-red-805 border-red-500' :
                        log.action.startsWith('CREATE') ? 'bg-indigo-100 text-indigo-705 border-indigo-505' :
                        log.action.startsWith('DELETE') ? 'bg-pink-100 text-pink-705 border-pink-505' :
                        'bg-slate-100 text-slate-800 border-slate-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-700 max-w-sm truncate md:max-w-md">
                      {log.details}
                      {log.targetId && (
                        <span className="inline-block ml-1.5 text-[10px] font-mono text-slate-950 font-black bg-slate-100 border border-slate-300 px-1 py-0.2">
                          Target: {log.targetId}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-black uppercase">
                    Tidak ditemukan ada log audit yang cocok dengan filter parameter Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
