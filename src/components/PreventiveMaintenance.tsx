/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PMSchedule, PMFrequency, User, UserRole } from '../types';
import { CalendarCheck, Plus, Sparkles, UserCheck, CheckCircle2, Clock, HelpCircle } from 'lucide-react';

interface PreventiveMaintenanceProps {
  schedules: PMSchedule[];
  users: User[];
  currentUser: User;
  onAddSchedule: (schedule: Omit<PMSchedule, 'id'>) => void;
  onTriggerPMTicket: (schedule: PMSchedule) => void;
}

export default function PreventiveMaintenance({ schedules, users, currentUser, onAddSchedule, onTriggerPMTicket }: PreventiveMaintenanceProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('AC');
  const [frequency, setFrequency] = useState<PMFrequency>(PMFrequency.MONTHLY);
  const [nextDate, setNextDate] = useState('');
  const [techId, setTechId] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);

  // Authorization check - Super Admin, Admin, and Region (SPV) can manage schedules
  const canManage = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGION_SPV].includes(currentUser.role);
  const technicians = users.filter(u => u.role === UserRole.GA);

  const handleAddTask = () => {
    if (taskInput.trim()) {
      setTasks([...tasks, taskInput.trim()]);
      setTaskInput('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !nextDate || !techId || tasks.length === 0) {
      alert('Harap lengkapi semua isian form, termasuk menugaskan minimal 1 tugas pencegahan (preventive task).');
      return;
    }

    const assignedTech = users.find(u => u.id === techId);
    if (!assignedTech) return;

    onAddSchedule({
      assetName,
      category,
      frequency,
      nextScheduledDate: nextDate,
      assignedTechnician: { id: assignedTech.id, name: assignedTech.name },
      tasks,
      status: 'Active'
    });

    // Reset values
    setAssetName('');
    setCategory('AC');
    setFrequency(PMFrequency.MONTHLY);
    setNextDate('');
    setTechId('');
    setTasks([]);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-slate-950 shrink-0" />
            Preventive Maintenance
          </h2>
          <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-1">
            Daftar pemeliharaan aset terjadwal untuk mencegah kerusakan mendadak pada fasilitas operasional perusahaan.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {isAdding ? 'Sembunyikan Form' : 'Jadwalkan PM Baru'}
          </button>
        )}
      </div>

      {isAdding && canManage && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-none border-2 border-slate-900 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase border-b-2 border-slate-900 pb-1.5 tracking-wider">Rincian Aset & Frekuensi</h3>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nama Mesin atau Aset Utama</label>
              <input
                type="text"
                required
                placeholder="Contoh: AC VRV LG Outdoor Lantai Atap"
                value={assetName}
                onChange={e => setAssetName(e.target.value)}
                className="w-full text-xs px-3 py-2 border-2 border-slate-900 rounded-none focus:outline-none focus:bg-slate-50 text-slate-900 font-extrabold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Kategori Bagian</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs px-2 py-2 border-2 border-slate-900 rounded-none focus:outline-none bg-white font-extrabold"
                >
                  <option value="AC">AC & Tata Udara</option>
                  <option value="Electrical">Sistem Kelistrikan</option>
                  <option value="Plumbing">Sistem Sanitasi / Plumbing</option>
                  <option value="IT">Infrastruktur IT / Server</option>
                  <option value="Civil">Struktur Sipil / Sipil Gedung</option>
                  <option value="Cleanliness">Kebersihan Fasilitas</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Rangkaian Frekuensi</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as PMFrequency)}
                  className="w-full text-xs px-2 py-2 border-2 border-slate-900 rounded-none focus:outline-none bg-white font-black text-slate-900 uppercase"
                >
                  {Object.values(PMFrequency).map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tanggal Kunjungan Pertama</label>
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={e => setNextDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border-2 border-slate-900 rounded-none focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tunjuk Teknisi Pelaksana</label>
                <select
                  required
                  value={techId}
                  onChange={e => setTechId(e.target.value)}
                  className="w-full text-xs px-2 py-2 border-2 border-slate-900 rounded-none focus:outline-none bg-white font-bold"
                >
                  <option value="">Pilih Teknisi...</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-xs text-slate-900 uppercase border-b-2 border-slate-900 pb-1.5 tracking-wider">Butir Tugas Preventif (Checklist Tugas)</h3>
              
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Ketik rincian tugas pengecekan rutin..."
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                  className="flex-1 text-xs px-3 py-2 border-2 border-slate-900 rounded-none focus:outline-none text-slate-905 font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-850 rounded-none text-xs font-black uppercase tracking-wider transition-all"
                >
                  Tambah
                </button>
              </div>

              {/* Added tasks list */}
              <div className="mt-2.5 space-y-1 max-h-36 overflow-y-auto">
                {tasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between text-xxs bg-slate-50 border border-slate-200 p-2 font-bold text-slate-800">
                    <span className="truncate">{index + 1}. {task}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(index)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-1 rounded font-black text-xxs uppercase"
                    >
                      Batal
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-5 text-slate-400 italic text-xs font-black uppercase">
                    Belum ada tugas preventif ditambahkan. Minimal buat 1 tugas pengecekan.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-none font-bold uppercase transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-none font-black uppercase tracking-widest shadow cursor-pointer"
              >
                Simpan & Aktifkan Jadwal
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Grid of Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map(sched => {
          const isOverdue = sched.status === 'Overdue';
          return (
            <div key={sched.id} className={`bg-white rounded-none border-2 border-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              isOverdue ? 'border-red-500 bg-red-50/10' : 'border-slate-900'
            }`}>
              <div>
                {/* Badge status */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase border border-slate-900 ${
                    sched.category === 'AC' ? 'bg-slate-900 text-white' :
                    sched.category === 'Electrical' ? 'bg-yellow-405 text-slate-950 font-black' :
                    sched.category === 'Plumbing' ? 'bg-teal-405 text-slate-950 font-black' :
                    'bg-white text-slate-900 border border-slate-900'
                  }`}>
                    {sched.category} • {sched.frequency}
                  </span>

                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase border px-2 py-0.5 ${
                    isOverdue ? 'bg-red-100 text-red-800 border-red-500' : 'bg-green-100 text-green-800 border-green-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-red-600' : 'bg-green-600'}`} />
                    {sched.status}
                  </span>
                </div>

                <h3 className="font-black text-base text-slate-900 tracking-tight mb-2 uppercase">{sched.assetName}</h3>
                
                {/* Schedule times */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 text-xxs mb-3.5 border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-black uppercase tracking-wider text-[9px]">Terakhir Servis</span>
                    <span className="text-slate-900 font-extrabold">{sched.lastMaintenance || 'Belum Pernah'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-black uppercase tracking-wider text-[9px]">Selanjutnya</span>
                    <span className={`font-extrabold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                      {sched.nextScheduledDate}
                    </span>
                  </div>
                </div>

                {/* Assigned Technicial */}
                <div className="flex items-center gap-2 text-xxs mb-4 font-bold">
                  <span className="text-slate-400 font-black uppercase tracking-wider text-[9px]">Teknisi PJ:</span>
                  <span className="font-black text-slate-900 flex items-center gap-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-905" />
                    {sched.assignedTechnician.name}
                  </span>
                </div>

                {/* Checklist tasks preview */}
                <div className="space-y-1.5 border-t border-slate-200 pt-3">
                  <span className="text-[9px] text-slate-400 font-black block uppercase tracking-widest">Langkah Pemeliharaan:</span>
                  {sched.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xxs text-slate-800 leading-relaxed font-bold">
                      <span className="w-1.5 h-1.5 border border-slate-900 bg-slate-900 shrink-0 mt-1" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger Direct corrective ticket action */}
              <div className="mt-4.5 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono font-black tracking-tight">ID: {sched.id}</span>
                
                <button
                  onClick={() => {
                    onTriggerPMTicket(sched);
                    alert(`Tiket Preventive Maintenance untuk '${sched.assetName}' berhasil digenerate di status Submitted!`);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-805 text-white rounded-none border border-slate-950 font-black text-xxs uppercase tracking-wider cursor-pointer transition-colors"
                  title="Generate maintenance ticket instantly now"
                >
                  <Sparkles className="w-3 h-3 text-yellow-350" />
                  Generate Tiket
                </button>
              </div>
            </div>
          );
        })}

        {schedules.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 border border-dashed border-slate-300">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-500" />
            <p className="text-xs font-black uppercase">Belum ada penjadwalan preventive maintenance yang diterbitkan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
