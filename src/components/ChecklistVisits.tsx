/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VisitChecklist, VisitChecklistItem, User, UserRole } from '../types';
import { BookOpen, Plus, ClipboardCheck, Sparkles, UserCheck, ShieldCheck, CheckSquare, XSquare, Eye, ChevronDown } from 'lucide-react';
import SignaturePad from './SignaturePad';

interface ChecklistVisitsProps {
  visits: VisitChecklist[];
  currentUser: User;
  onAddVisit: (visit: Omit<VisitChecklist, 'id'>) => void;
  onApproveVisit: (visitId: string, notes: string, signature: string) => void;
  onRejectVisit: (visitId: string, notes: string) => void;
}

// Default equipments checklist boilerplate template
const DEFAULT_VISIT_TEMPLATES = [
  'Genset Caterpillar Utama',
  'Unit Chiller Utama (Daikin)',
  'Main Breaker Panel Listrik Lt 1',
  'Pompa Booster Air Atas',
  'Sistem Fire Alarms & Smoke Detector Lobby',
  'Toilet Pria Lantai Utama (Keran & Drain)',
  'Sistem Lift Elevator Lift No 1'
];

export default function ChecklistVisits({ visits, currentUser, onAddVisit, onApproveVisit, onRejectVisit }: ChecklistVisitsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  
  // New Visit Form State
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [checklistItems, setChecklistItems] = useState<VisitChecklistItem[]>(
    DEFAULT_VISIT_TEMPLATES.map((item, idx) => ({
      id: `item-${idx}`,
      itemName: item,
      status: 'Normal',
      remarks: ''
    }))
  );

  // Approval Form State per item
  const [selectedVisitForAction, setSelectedVisitForAction] = useState<string | null>(null);
  const [spvActionType, setSpvActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [spvNotes, setSpvNotes] = useState('');
  const [spvSignature, setSpvSignature] = useState('');

  const canCreate = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGION_SPV, UserRole.GA].includes(currentUser.role);
  const isSupervisor = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGION_SPV].includes(currentUser.role);

  const handleStatusChange = (idx: number, status: 'Normal' | 'Abnormal' | 'Pending') => {
    const updated = [...checklistItems];
    updated[idx].status = status;
    setChecklistItems(updated);
  };

  const handleRemarksChange = (idx: number, remarks: string) => {
    const updated = [...checklistItems];
    updated[idx].remarks = remarks;
    setChecklistItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert('Tuliskan Lokasi Kunjungan Lapangan.');
      return;
    }
    if (!signatureData) {
      alert('Tolong cantumkan tanda tangan digital pelaksana sebelum submit.');
      return;
    }

    onAddVisit({
      visitDate: new Date().toISOString().split('T')[0],
      location,
      inspector: { id: currentUser.id, name: currentUser.name },
      items: checklistItems,
      notes,
      signature: signatureData,
      status: 'Submitted'
    });

    // Reset values
    setLocation('');
    setNotes('');
    setSignatureData('');
    setChecklistItems(
      DEFAULT_VISIT_TEMPLATES.map((item, idx) => ({
        id: `item-${idx}`,
        itemName: item,
        status: 'Normal',
        remarks: ''
      }))
    );
    setIsAdding(false);
  };

  const handleSupervisorSubmit = (e: React.FormEvent, visitId: string) => {
    e.preventDefault();
    if (spvActionType === 'APPROVE') {
      if (!spvSignature) {
        alert('Tolong cantumkan tanda tangan digital supervisor untuk menyetujui kunjungan visit.');
        return;
      }
      onApproveVisit(visitId, spvNotes, spvSignature);
    } else if (spvActionType === 'REJECT') {
      if (!spvNotes) {
        alert('Harap berikan catatan penolakan visit agar pelaksana tahu bagian yang salah.');
        return;
      }
      onRejectVisit(visitId, spvNotes);
    }
    // Clean up
    setSelectedVisitForAction(null);
    setSpvActionType(null);
    setSpvNotes('');
    setSpvSignature('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-slate-950 shrink-0" />
            Checklist Kunjungan
          </h2>
          <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-1">
            Laporan pengecekan berkala keseluruhan utilitas gedung, ditandatangani dan memerlukan verifikasi Supervisor.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {isAdding ? 'Sembunyikan Form' : 'Isi Form Kunjungan'}
          </button>
        )}
      </div>

      {isAdding && canCreate && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-none border-2 border-slate-900 shadow-md space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 pb-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Gedung / Lokasi Kunjungan Lapangan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Gedung Timur Lt 1 s/d Basements"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 border-2 border-slate-900 rounded-none focus:outline-none focus:bg-slate-50 text-slate-900 font-extrabold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tanggal Kunjungan & Jam Checklist</label>
              <input
                type="text"
                disabled
                value={`${new Date().toLocaleDateString('id-ID')} - Sesuai Waktu Server`}
                className="w-full text-xs px-3 py-2.5 border-2 border-slate-200 bg-slate-100 rounded-none text-slate-500 font-extrabold"
              />
            </div>
          </div>

          {/* Checklist items template */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest">Butir Pengecekan Mesin / Fasilitas:</h3>
              <span className="text-[10px] text-slate-500 font-black uppercase">Status Default: Normal</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {checklistItems.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-300 items-center">
                  <div className="md:col-span-4">
                    <span className="text-[11px] font-black text-slate-900 uppercase">{idx + 1}. {item.itemName}</span>
                  </div>
                  
                  {/* Status Options */}
                  <div className="md:col-span-3 flex gap-1.5">
                    {(['Normal', 'Abnormal', 'Pending'] as const).map(st => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => handleStatusChange(idx, st)}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-none transition-all flex-1 text-center cursor-pointer border ${
                          item.status === st
                            ? st === 'Normal' ? 'bg-emerald-500 text-white border-slate-950' : st === 'Abnormal' ? 'bg-red-650 text-white border-slate-950' : 'bg-orange-500 text-white border-slate-950'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Remarks input */}
                  <div className="md:col-span-5">
                    <input
                      type="text"
                      placeholder="Tuliskan temuan / parameter ukur (tegangan, getaran dll)..."
                      value={item.remarks}
                      onChange={e => handleRemarksChange(idx, e.target.value)}
                      className="w-full text-xxs px-2 py-1.5 border-2 border-slate-900 rounded-none bg-white focus:outline-none focus:bg-slate-50 text-slate-950 font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form signatures & notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t-2 border-slate-900 pt-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Catatan Tambahan Lapangan</label>
              <textarea
                rows={4}
                placeholder="Tulis keterangan tambahan mengenai kondisi keseluruhan lokasi yang dikunjungi..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-xs p-3 border-2 border-slate-900 rounded-none focus:outline-none focus:bg-slate-50 text-slate-900 leading-relaxed font-bold"
              />
            </div>

            <div>
              <SignaturePad
                id="visit-sig"
                onSave={setSignatureData}
                label="Tanda Tangan Pengawas/Pelapor Lapangan"
                initialValue={signatureData}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-150 rounded-none font-bold uppercase transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest shadow"
            >
              Kirim Checklist Kunjungan
            </button>
          </div>
        </form>
      )}

      {/* Submitted and historical checklists */}
      <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-sm flex flex-col">
        <div className="bg-slate-900 p-4 border-b-2 border-slate-900 flex items-center justify-between">
          <h3 className="font-black text-xs text-slate-100 uppercase tracking-widest">Histori Data Checklist & Kunjungan Lapangan</h3>
          <span className="text-[10px] text-orange-400 font-mono font-black uppercase">Real-time database</span>
        </div>

        <div className="divide-y divide-slate-200">
          {visits.map(visit => {
            const isTarget = activeDetailId === visit.id;
            const hasAbnormal = visit.items.some(it => it.status === 'Abnormal');
            return (
              <div key={visit.id} className="p-4 hover:bg-slate-50 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none border border-slate-950 bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                      V
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900 uppercase tracking-tight">{visit.location}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {visit.visitDate} • Oleh: <span className="font-extrabold text-slate-700">{visit.inspector.name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasAbnormal && (
                      <span className="text-[9px] font-black uppercase bg-red-100 text-red-650 border border-red-500 px-1.5 py-0.5 rounded-none tracking-wider">
                        ⚠️ TERDETEKSI ABNORMAL
                      </span>
                    )}

                    <span className={`inline-flex items-center text-[10px] font-black uppercase border px-2 py-0.5 ${
                      visit.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-500' :
                      visit.status === 'Rejected' ? 'bg-red-100 text-red-805 border-red-500' :
                      'bg-amber-100 text-amber-800 border-amber-500'
                    }`}>
                      {visit.status === 'Approved' ? 'Diverifikasi' : visit.status === 'Rejected' ? 'SLA Ditolak' : 'Menunggu Approval'}
                    </span>

                    <button
                      onClick={() => setActiveDetailId(isTarget ? null : visit.id)}
                      className="p-1 border border-slate-305 hover:bg-slate-100 text-slate-900 rounded-none transition-colors cursor-pointer"
                      title="Lihat Detail Temuan Mesin"
                    >
                      <ChevronDown className={`w-4 h-4 transform transition-transform ${isTarget ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isTarget && (
                  <div className="bg-slate-50 p-4 border border-slate-205 mt-2 space-y-4">
                    {/* Item parameters table */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Parameter Checklist Mesin:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {visit.items.map(it => (
                          <div key={it.id} className="bg-white p-2.5 border-2 border-slate-900 flex items-center justify-between text-xxs block">
                            <div>
                              <div className="font-black text-slate-900 uppercase tracking-tight">{it.itemName}</div>
                              <div className="text-slate-500 mt-0.5 tracking-tight font-extrabold">Remarks: {it.remarks || '-'}</div>
                            </div>
                            <span className={`font-black uppercase px-2 py-0.5 border text-[9px] ${
                              it.status === 'Normal' ? 'bg-emerald-100 text-emerald-805 border-emerald-400' :
                              it.status === 'Abnormal' ? 'bg-red-100 text-red-805 border-red-405 animate-pulse' :
                              'bg-amber-100 text-amber-805 border-amber-401'
                            }`}>
                              {it.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-3">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase">Catatan Kunjungan Lapangan:</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-bold bg-white p-3 border border-slate-200 mt-1">
                          {visit.notes || 'Tidak ada catatan tambahan.'}
                        </p>
                      </div>

                      {/* Signatures display */}
                      <div className="text-center bg-white p-2 border border-slate-250 flex flex-col justify-between h-28">
                        <span className="text-[9px] font-black text-slate-405 block uppercase tracking-wider">Paraf Inspektur Lapangan:</span>
                        <div className="flex-1 flex items-center justify-center p-1">
                          <img src={visit.signature || 'https://placehold.co/100x40/png'} alt="sig-inspector" className="max-h-16 object-contain" />
                        </div>
                        <span className="text-[9px] font-black text-slate-900 uppercase">{visit.inspector.name}</span>
                      </div>

                      <div className="text-center bg-white p-2 border border-slate-250 flex flex-col justify-between h-28">
                        <span className="text-[9px] font-black text-slate-405 block uppercase tracking-wider">Persetujuan Supervisor:</span>
                        {visit.status === 'Approved' ? (
                          <>
                            <div className="flex-1 flex items-center justify-center p-1">
                              <img src={visit.supervisorSignature || 'https://placehold.co/100x40/png'} alt="sig-spv" className="max-h-16 object-contain" />
                            </div>
                            <span className="text-[9px] font-black text-emerald-650 uppercase">Disetujui</span>
                          </>
                        ) : visit.status === 'Rejected' ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-1 text-red-650 font-black text-xxs">
                            <span>DITOLAK</span>
                            <span className="text-[9px] font-bold text-slate-500 mt-0.5 truncate max-w-[120px]" title={visit.supervisorNotes}>
                              "{visit.supervisorNotes}"
                            </span>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-black uppercase text-[10px] tracking-wider">
                            <span>Menunggu verifikasi</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Supervisor Approval Buttons Inside Details */}
                    {isSupervisor && visit.status === 'Submitted' && (
                      <div className="border border-slate-300 pt-3 flex flex-col gap-2 bg-slate-100 p-3">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-slate-900" />
                          <h6 className="text-[11px] font-black uppercase text-slate-900 tracking-wider">Tindakan Supervisor:</h6>
                        </div>

                        {selectedVisitForAction !== visit.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedVisitForAction(visit.id);
                                setSpvActionType('REJECT');
                              }}
                              className="px-3.5 py-1.5 bg-red-650 text-white font-black text-xxs uppercase tracking-wider cursor-pointer font-black hover:bg-red-700"
                            >
                              Tolak Checklist
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVisitForAction(visit.id);
                                setSpvActionType('APPROVE');
                              }}
                              className="px-3.5 py-1.5 bg-slate-900 text-white font-black text-xxs uppercase tracking-wider cursor-pointer hover:bg-slate-805"
                            >
                              Setujui & Tanda Tangan
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={(e) => handleSupervisorSubmit(e, visit.id)} className="space-y-3 pt-2 border-t border-slate-300">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Catatan Supervisor ({spvActionType})</label>
                              <input
                                type="text"
                                required={spvActionType === 'REJECT'}
                                placeholder={spvActionType === 'APPROVE' ? 'Contoh: Bagus, silakan dilanjutkan monitoring berkala.' : 'Tuliskan alasan penolakan checklist wajib...'}
                                value={spvNotes}
                                onChange={e => setSpvNotes(e.target.value)}
                                className="w-full text-xs px-3 py-2 border-2 border-slate-900 rounded-none bg-white focus:outline-none"
                              />
                            </div>

                            {spvActionType === 'APPROVE' && (
                              <SignaturePad
                                id={`visit-spv-${visit.id}`}
                                onSave={setSpvSignature}
                                label="Paraf Persetujuan Supervisor"
                                initialValue={spvSignature}
                              />
                            )}

                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVisitForAction(null);
                                  setSpvActionType(null);
                                  setSpvNotes('');
                                  setSpvSignature('');
                                }}
                                className="px-3 py-1.5 text-xxs text-slate-500 hover:bg-white rounded-none border border-slate-300 cursor-pointer font-bold uppercase"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                className={`px-4 py-1.5 text-white font-black text-xxs rounded-none uppercase tracking-widest cursor-pointer ${
                                  spvActionType === 'APPROVE' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-red-650 hover:bg-red-600'
                                }`}
                              >
                                Konfirmasi {spvActionType}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {visits.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30 text-gray-500" />
              <p className="text-xs font-black uppercase">Belum ada catatan checklist kunjungan lapangan yang diisikan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
