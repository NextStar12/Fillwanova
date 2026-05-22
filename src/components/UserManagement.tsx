/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, Plus, Edit2, Trash2, Check, X, CheckSquare, Square, Search, UserCheck } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  logActivity: (action: string, targetId: string, details: string) => void;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'view_all_tickets', label: 'Lihat Semua Tiket Kerusakan' },
  { id: 'create_tickets', label: 'Buat Tiket Baru (Pelapor)' },
  { id: 'assign_tickets', label: 'Tunjuk Pelaksana / Delegasi (Dispatcher)' },
  { id: 'update_assigned_tickets', label: 'Update Pekerjaan & Notes' },
  { id: 'approve_documents', label: 'Approve & Reject Dokumen' },
  { id: 'schedule_pm', label: 'Atur Jadwal Preventive Maintenance' },
  { id: 'manage_visits', label: 'Kelola Data Kunjungan Lapangan / Checklist' },
  { id: 'view_analytics', label: 'Lihat Dashboard Analytics' },
  { id: 'view_audit_logs', label: 'Akses Audit Log Sistem' },
  { id: 'manage_users', label: 'Manajemen RBAC & Kelola User' },
  { id: 'broadcast_chat', label: 'Broadcast Chat Pesan (Manajer)' }
];

export const AVAILABLE_BRANCHES = [
  'Cabang Sudirman',
  'Cabang Thamrin',
  'Cabang Kuningan',
  'Cabang Dago',
  'Cabang Kelapa Gading',
  'Cabang Depok',
  'Cabang BSD'
];

export const AVAILABLE_REGIONS = [
  'Regional DKI Jakarta',
  'Regional Jawa Barat',
  'Regional Jawa Tengah',
  'Regional Jawa Timur',
  'Regional Sumatera'
];

export default function UserManagement({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser, logActivity }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.GA);
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Authorization Check - Only Super Admin & Admin can access this
  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center text-red-800">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold">Akses Ditolak</h3>
        <p className="text-xs mt-1">Hanya Super Admin ("Dewa") dan Admin yang memiliki otorisasi untuk mengakses Manajemen User dan RBAC.</p>
      </div>
    );
  }

  const openAddModal = () => {
    setSelectedUser(null);
    setFullName('');
    setEmail('');
    setRole(UserRole.GA);
    setIsActive(true);
    setPermissions(['view_all_tickets', 'create_tickets']);
    setSelectedBranches([]);
    setSelectedRegions([]);
    setIsEditing(true);
  };

  const openEditModal = (user: User) => {
    // If Admin attempts to edit Super Admin - reject
    if (user.role === UserRole.SUPER_ADMIN && !isSuperAdmin) {
      alert('Error: Admin biasa tidak diizinkan untuk mengedit Super Admin ("Dewa").');
      return;
    }

    setSelectedUser(user);
    setFullName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setIsActive(user.isActive);
    setPermissions(user.permissions);
    setSelectedBranches(user.branches || []);
    setSelectedRegions(user.regions || []);
    setIsEditing(true);
  };

  const togglePermission = (permId: string) => {
    if (permissions.includes(permId)) {
      setPermissions(permissions.filter(p => p !== permId));
    } else {
      setPermissions([...permissions, permId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      alert('Harap isi Nama Lengkap dan Email.');
      return;
    }

    if (selectedUser) {
      // Edit mode
      const updated: User = {
        ...selectedUser,
        name: fullName,
        email,
        role,
        isActive,
        permissions,
        branches: selectedBranches,
        regions: selectedRegions
      };
      onUpdateUser(updated);
      logActivity('UPDATE_USER', updated.id, `Memperbarui user: ${updated.name} (Role: ${updated.role})`);
    } else {
      // Add mode
      const newUser: Omit<User, 'id'> = {
        name: fullName,
        email,
        role,
        isActive,
        permissions,
        branches: selectedBranches,
        regions: selectedRegions,
        avatar: role === UserRole.SUPER_ADMIN ? '⚡' : role === UserRole.MANAJER ? '👔' : role === UserRole.ADMIN ? '💼' : role === UserRole.REGION_SPV ? '🔎' : role === UserRole.GA ? '🏢' : '👑'
      };
      onAddUser(newUser);
      logActivity('ADD_USER', 'new', `Membuat user baru: ${fullName} (Role: ${role})`);
    }

    setIsEditing(false);
  };

  const handleDelete = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('Anda tidak bisa menghapus diri sendiri!');
      return;
    }
    const target = users.find(u => u.id === userId);
    if (target?.role === UserRole.SUPER_ADMIN && !isSuperAdmin) {
      alert('Error: Admin biasa tidak diizinkan menghapus Super Admin ("Dewa").');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus user: ${userName}? Tindakan ini tidak dapat dibatalkan.`)) {
      onDeleteUser(userId);
      logActivity('DELETE_USER', userId, `Menghapus user: ${userName}`);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <Shield className="w-7 h-7 text-slate-950 shrink-0" />
            Manajemen User & RBAC
          </h2>
          <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-1">
            Kelola pengguna sistem, peran fungsional, dan matriks izin akses terintegrasi.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-none text-xs font-black uppercase tracking-widest shadow transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah User Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List Panel (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-none border-2 border-slate-900 shadow-md overflow-hidden flex flex-col">
          <div className="p-4 border-b-2 border-slate-900 flex items-center gap-2 relative bg-slate-50">
            <Search className="w-4 h-4 text-slate-800 absolute left-7 top-7" />
            <input
              type="text"
              placeholder="Cari user berdasarkan nama, email, atau peran..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border-2 border-slate-900 rounded-none bg-white focus:outline-none focus:bg-slate-50 text-slate-950 font-bold font-mono placeholder:font-normal"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-905 uppercase tracking-wider text-[10px] border-b-2 border-slate-900 font-black">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Peran Sistem</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Granular Izin</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredUsers.map(user => {
                  const isUserSuperAdmin = user.role === UserRole.SUPER_ADMIN;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-none border border-slate-950 bg-slate-900 text-white text-sm flex items-center justify-center">
                            {user.avatar || '👤'}
                          </span>
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-tight">
                              {user.name}
                              {isUserSuperAdmin && (
                                <span className="text-[9px] font-black bg-yellow-405 text-slate-950 border border-slate-950 px-1.5 py-0.5 rounded-none tracking-widest uppercase animate-pulse">
                                  Dewa Super
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono font-bold">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex px-2 py-0.5 border border-slate-900 text-[10px] uppercase font-black tracking-wider ${
                            user.role === UserRole.SUPER_ADMIN ? 'bg-amber-100 text-amber-900' :
                            user.role === UserRole.MANAJER ? 'bg-indigo-100 text-indigo-900' :
                            user.role === UserRole.ADMIN ? 'bg-slate-900 text-white' :
                            user.role === UserRole.REGION_SPV ? 'bg-purple-100 text-purple-900' :
                            user.role === UserRole.GA ? 'bg-emerald-100 text-emerald-900' :
                            'bg-zinc-100 text-zinc-950'
                          }`}>
                            {user.role}
                          </span>
                          
                          {/* Branches and Regions list display inside table */}
                          {user.role !== UserRole.SUPER_ADMIN && (
                            <div className="flex flex-col gap-0.5 text-[9px] font-mono font-bold leading-normal text-slate-505">
                              {user.branches && user.branches.length > 0 && (
                                <div className="text-slate-650">
                                  📌 Cabang ({user.branches.length}): {user.branches.join(', ')}
                                </div>
                              )}
                              {user.regions && user.regions.length > 0 && (
                                <div className="text-indigo-650">
                                  🚩 Wilayah ({user.regions.length}): {user.regions.join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border text-[10px] font-black uppercase ${
                          user.isActive ? 'bg-emerald-100 text-emerald-805 border-emerald-500' : 'bg-red-100 text-red-805 border-red-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 border border-slate-950 ${user.isActive ? 'bg-emerald-500' : 'bg-red-600'}`} />
                          {user.isActive ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isUserSuperAdmin ? (
                          <span className="text-[10px] italic font-black text-amber-600 uppercase tracking-wider">Akses Penuh ("Dewa")</span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-900 font-black bg-slate-100 border border-slate-300 px-2 py-0.5">
                            {user.permissions.length} Izin
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div id={`actions-user-${user.id}`} className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1 px-2 border-2 border-slate-900 hover:bg-slate-100 text-slate-900 text-xxs font-black uppercase cursor-pointer"
                            title="Edit User"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="p-1 px-2 bg-red-650 text-white border-2 border-red-700 hover:bg-red-750 text-xxs font-black uppercase cursor-pointer"
                            title="Hapus User"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit or Add User panel (1 Column) */}
        <div className="bg-white rounded-none border-2 border-slate-900 shadow-md p-5 h-fit">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2.5">
            <UserCheck className="w-4.5 h-4.5 text-slate-950 shrink-0" />
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest">
              {isEditing ? (selectedUser ? 'Edit User & RBAC' : 'Tambah Pengguna') : 'Otoritas Hak Akses'}
            </h3>
          </div>

          {!isEditing ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-500" />
              <p className="text-[11px] font-bold uppercase leading-relaxed">Silakan klik "Edit" atau "Tambah User Baru" untuk mengonfigurasi rincian otorisasi peran.</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border-2 border-slate-900 rounded-none focus:outline-none focus:bg-slate-50 font-bold text-slate-900"
                  placeholder="Contoh: Fillah Gymnastiar"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border-2 border-slate-900 rounded-none focus:outline-none focus:bg-slate-50 font-mono font-bold text-slate-800"
                  placeholder="nama@maintix.co.id"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Peran Aplikasi</label>
                  <select
                    value={role}
                    onChange={e => {
                      const selectedRole = e.target.value as UserRole;
                      setRole(selectedRole);
                      // Auto populate basic scopes
                      if (selectedRole === UserRole.SUPER_ADMIN) {
                        setPermissions(['all']);
                      } else if (selectedRole === UserRole.MANAJER) {
                        setPermissions(['view_analytics', 'view_all_tickets', 'broadcast_chat']);
                      } else if (selectedRole === UserRole.ADMIN) {
                        setPermissions(['manage_users', 'manage_tickets', 'schedule_pm', 'view_analytics', 'view_audit_logs', 'view_all_tickets', 'assign_tickets']);
                      } else if (selectedRole === UserRole.REGION_SPV) {
                        setPermissions(['approve_documents', 'view_analytics', 'view_all_tickets', 'assign_tickets', 'schedule_pm', 'manage_visits']);
                      } else if (selectedRole === UserRole.GA) {
                        setPermissions(['create_tickets', 'view_own_tickets', 'camera_only_upload', 'manage_visits', 'view_all_tickets', 'update_assigned_tickets']);
                      } else if (selectedRole === UserRole.LEADER_CABANG) {
                        setPermissions(['create_tickets', 'assign_tickets', 'track_progress', 'view_all_tickets']);
                      }
                    }}
                    className="w-full text-xs px-2 py-2 border-2 border-slate-900 rounded-none focus:outline-none bg-white font-extrabold text-slate-900 text-center uppercase"
                  >
                    <option value={UserRole.GA}>GA</option>
                    <option value={UserRole.REGION_SPV}>Region (SPV)</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.MANAJER}>Manajer</option>
                    <option value={UserRole.LEADER_CABANG}>Leader Cabang</option>
                    {isSuperAdmin && <option value={UserRole.SUPER_ADMIN}>Super Admin (Dewa)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Status Keaktifan</label>
                  <select
                    value={isActive ? 'Y' : 'N'}
                    onChange={e => setIsActive(e.target.value === 'Y')}
                    className="w-full text-xs px-2.5 py-2 border-2 border-slate-900 rounded-none focus:outline-none bg-white font-extrabold text-slate-900 text-center uppercase"
                  >
                    <option value="Y">Aktif</option>
                    <option value="N">Non-Aktif</option>
                  </select>
                </div>
              </div>

              {/* Multiple Branches Picker Panel */}
              {role !== UserRole.SUPER_ADMIN && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Tanggung Jawab Cabang</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border-2 border-slate-900 rounded-none p-2.5 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                    {AVAILABLE_BRANCHES.map(cb => {
                      const hasCb = selectedBranches.includes(cb);
                      return (
                        <button
                          type="button"
                          key={cb}
                          onClick={() => {
                            if (hasCb) {
                              setSelectedBranches(selectedBranches.filter(x => x !== cb));
                            } else {
                              setSelectedBranches([...selectedBranches, cb]);
                            }
                          }}
                          className="text-left flex items-center gap-1.5 py-0.5 text-xxs font-black text-slate-705 hover:text-slate-950 uppercase tracking-tight cursor-pointer"
                        >
                          {hasCb ? (
                            <CheckSquare className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{cb}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Multiple Regions Picker Panel */}
              {role !== UserRole.SUPER_ADMIN && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Tanggung Jawab Wilayah Regional</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border-2 border-slate-900 rounded-none p-2.5 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                    {AVAILABLE_REGIONS.map(rg => {
                      const hasRg = selectedRegions.includes(rg);
                      return (
                        <button
                          type="button"
                          key={rg}
                          onClick={() => {
                            if (hasRg) {
                              setSelectedRegions(selectedRegions.filter(x => x !== rg));
                            } else {
                              setSelectedRegions([...selectedRegions, rg]);
                            }
                          }}
                          className="text-left flex items-center gap-1.5 py-0.5 text-xxs font-black text-slate-705 hover:text-slate-950 uppercase tracking-tight cursor-pointer"
                        >
                          {hasRg ? (
                            <CheckSquare className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{rg}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Granular permissions checkbox list if not Super Admin */}
              {role !== UserRole.SUPER_ADMIN ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Granular Izin Akses (RBAC)</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto border-2 border-slate-900 rounded-none p-3 bg-slate-50">
                    {AVAILABLE_PERMISSIONS.map(p => {
                      const hasPerm = permissions.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => togglePermission(p.id)}
                          className="w-full text-left flex items-start gap-1.5 py-1 text-xxs font-black text-slate-700 hover:text-slate-950 transition-colors uppercase tracking-tight"
                        >
                          {hasPerm ? (
                            <CheckSquare className="w-3.5 h-3.5 text-slate-900 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className="leading-none">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 text-slate-900 border border-slate-900 text-xxs font-bold leading-relaxed uppercase">
                  💡 Super Admin merupakan kasta tertinggi sistem ("Dewa dari segala user") dan memiliki persetujuan akses penuh secara default ke seluruh module tanpa batas.
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs text-slate-505 hover:bg-slate-100 rounded-none font-bold uppercase transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-none font-black uppercase tracking-widest cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
