/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Ticket,
  TicketPriority,
  TicketStatus,
  PMSchedule,
  VisitChecklist,
  AuditLog,
  SystemNotification
} from './types';
import {
  mockUsers,
  mockTickets,
  mockPMSchedules,
  mockVisitChecklists,
  mockAuditLogs,
  mockNotifications
} from './mockData';
import {
  ShieldAlert,
  Sliders,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
  Inbox,
  Clock,
  Plus,
  Eye,
  LogOut,
  Bell,
  CheckCircle,
  Menu,
  X,
  Search,
  Users,
  Layout,
  Smartphone,
  Monitor,
  Camera,
  Play,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Activity
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';
import DashboardAnalytics from './components/DashboardAnalytics';
import UserManagement from './components/UserManagement';
import AuditLogs from './components/AuditLogs';
import PreventiveMaintenance from './components/PreventiveMaintenance';
import ChecklistVisits from './components/ChecklistVisits';
import TicketDetailModal from './components/TicketDetailModal';
import CameraCapture from './components/CameraCapture';
import { exportToExcelCompatibleCsv } from './utils';

export default function App() {
  // Load State from LocalStorage or Fallback
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('maintix_users');
    return saved ? JSON.parse(saved) : mockUsers;
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('maintix_tickets');
    return saved ? JSON.parse(saved) : mockTickets;
  });

  const [schedules, setSchedules] = useState<PMSchedule[]>(() => {
    const saved = localStorage.getItem('maintix_schedules');
    return saved ? JSON.parse(saved) : mockPMSchedules;
  });

  const [visits, setVisits] = useState<VisitChecklist[]>(() => {
    const saved = localStorage.getItem('maintix_visits');
    return saved ? JSON.parse(saved) : mockVisitChecklists;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('maintix_audit_logs');
    return saved ? JSON.parse(saved) : mockAuditLogs;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('maintix_notifications');
    return saved ? JSON.parse(saved) : mockNotifications;
  });

  // Current Logged-in Simulator Role (For easy RBAC evaluation)
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('maintix_curr_user_id');
    return saved || 'usr-1'; // Default: Super Admin Dewa
  });

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || mockUsers[0];

  // Simulator Screen Layout View Mode: Desktop / Mobile Device wrapper
  const [viewDeviceMode, setViewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  // Navigation Screen Controls
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'tickets' | 'preventive' | 'visits' | 'rbac' | 'audit'>('dashboard');

  // Ticket form drawer or modal
  const [isReportingTicket, setIsReportingTicket] = useState(false);
  const [activeTicketDetailId, setActiveTicketDetailId] = useState<string | null>(null);

  // Forms states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('AC');
  const [newPriority, setNewPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [newLocation, setNewLocation] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isPhotoCameraActive, setIsPhotoCameraActive] = useState(false);

  // Filter Active Tickets pool
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>('ALL');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<string>('ALL');

  // Synchronize tickets with Firebase Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tickets'), async (snapshot) => {
      const ticketsFromDb: Ticket[] = [];
      snapshot.forEach((snapDoc) => {
        ticketsFromDb.push(snapDoc.data() as Ticket);
      });
      
      if (ticketsFromDb.length === 0) {
        // If empty, seed mock data
        console.log("Seeding mock tickets to Firestore...");
        for (const t of mockTickets) {
          try {
            await setDoc(doc(db, 'tickets', t.id), t);
          } catch (err) {
            console.error("Failed seeding ticket:", t.id, err);
          }
        }
      } else {
        // Sort by createdAt descending
        ticketsFromDb.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTickets(ticketsFromDb);
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
      handleFirestoreError(error, OperationType.LIST, 'tickets');
    });
    return () => unsubscribe();
  }, []);

  // Multi-user push-toast feed simulations
  const [latestToast, setLatestToast] = useState<SystemNotification | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Mobile sidebar states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Save changes to localStorage on any state modification
  useEffect(() => {
    localStorage.setItem('maintix_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('maintix_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('maintix_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('maintix_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('maintix_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('maintix_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('maintix_curr_user_id', currentUserId);
  }, [currentUserId]);

  // Utility to create a structured logging mechanism
  const logActivity = (action: string, targetId: string | undefined, details: string) => {
    const freshLog: AuditLog = {
      id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      targetId,
      details
    };
    setAuditLogs(prev => [freshLog, ...prev]);
  };

  // Utility to send an operational in-app instant system notification feed
  const triggerNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const raw: SystemNotification = {
      id: `NTF-${Math.floor(10000 + Math.random() * 90000)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      type
    };
    setNotifications(prev => [raw, ...prev]);
    setLatestToast(raw);
    // Dismiss toast after 4.5 seconds
    setTimeout(() => {
      setLatestToast(null);
    }, 4500);
  };

  // Actions implementations
  const handleAddNewTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newLocation) {
      alert('Tolong lengkapi nama keluhan, deskripsi serta koordinat lokasi gedungnya.');
      return;
    }

    // Role GA specific validation check - must upload photo using camera
    if (currentUser.role === UserRole.GA && !newPhotoUrl) {
      alert('Ketentuan GA: Harap sertakan unggahan foto bukti kerusakan fisik langsung dari jepretan kamera sebelum mengirim tiket.');
      return;
    }

    const nextId = `TCK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newTicketObj: Ticket = {
      id: nextId,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      priority: newPriority,
      status: TicketStatus.SUBMITTED,
      location: newLocation,
      reportedBy: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      checklist: generateChecklistForCategory(newCategory),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photoUrl: newPhotoUrl || undefined
    };

    setDoc(doc(db, 'tickets', nextId), newTicketObj)
      .then(() => {
        logActivity('CREATE_TICKET', nextId, `Membuat laporan tiket keluhan baru: ${newTitle} (${newCategory})`);
      })
      .catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'tickets/' + nextId);
      });
    
    // Broadcast notifications
    triggerNotification(
      'Tiket Laporan Baru Terbit',
      `GA ${currentUser.name} telah meluncurkan tiket ${nextId} untuk bagian ${newCategory} di ${newLocation}.`,
      'info'
    );

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewCategory('AC');
    setNewPriority(TicketPriority.MEDIUM);
    setNewLocation('');
    setNewPhotoUrl('');
    setIsReportingTicket(false);
  };

  const generateChecklistForCategory = (cat: string) => {
    const items = [];
    if (cat === 'AC') {
      items.push({ id: '1', task: 'Uji suhu hembusan indoor s/d 18 derajat celcius', isDone: false });
      items.push({ id: '2', task: 'Periksa blower fan unit kondensor outdoor', isDone: false });
      items.push({ id: '3', task: 'Periksa sisa tekanan gas refrigerant freon', isDone: false });
    } else if (cat === 'Electrical') {
      items.push({ id: '1', task: 'Ukur impedansi tahanan isolasi ground', isDone: false });
      items.push({ id: '2', task: 'Uji panas MCB menggunakan Thermograph', isDone: false });
      items.push({ id: '3', task: 'Kencangkan terminal input MCB panel', isDone: false });
    } else if (cat === 'Plumbing') {
      items.push({ id: '1', task: 'Copot dan bersihkan siphon pembuangan', isDone: false });
      items.push({ id: '2', task: 'Uji kekuatan bilasan air flush gravitasi', isDone: false });
    } else {
      items.push({ id: '1', task: 'Inspeksi kondisi fisik terluar unit', isDone: false });
      items.push({ id: '2', task: 'Pemberian pelumasan part gerak hidrolik', isDone: false });
    }
    return items;
  };

  const handleUpdateChecklist = (ticketId: string, itemId: string, isDone: boolean) => {
    const t = tickets.find(x => x.id === ticketId);
    if (t) {
      const item = t.checklist.find(c => c.id === itemId);
      if (item) {
        logActivity('UPDATE_CHECKLIST', ticketId, `Mengubah status tugas "${item.task}" menjadi ${isDone ? 'Selesai' : 'Belum Selesai'}`);
      }
      const updatedTicket: Ticket = {
        ...t,
        checklist: t.checklist.map(c => c.id === itemId ? { ...c, isDone } : c),
        updatedAt: new Date().toISOString()
      };
      setDoc(doc(db, 'tickets', ticketId), updatedTicket)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'tickets/' + ticketId));
    }
  };

  const handleUpdateTicketStatus = (
    ticketId: string,
    status: TicketStatus,
    notes?: string,
    photo?: string,
    signature?: string
  ) => {
    const t = tickets.find(x => x.id === ticketId);
    if (t) {
      logActivity('UPDATE_STATUS', ticketId, `Mengubah status kemajuan tiket menjadi: ${status}`);
      const updatedTicket: Ticket = {
        ...t,
        status,
        workNotes: notes !== undefined ? notes : t.workNotes,
        photoUrl: photo !== undefined ? photo : t.photoUrl,
        technicianSignature: signature !== undefined ? signature : t.technicianSignature,
        updatedAt: new Date().toISOString()
      };
      setDoc(doc(db, 'tickets', ticketId), updatedTicket)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'tickets/' + ticketId));
    }

    if (status === TicketStatus.PENDING_APPROVAL) {
      triggerNotification(
        'Pemberitahuan Persetujuan',
        `Teknisi telah merestorasi tiket ${ticketId} dan memohon verifikasi persetujuan (approval) Supervisor.`,
        'warning'
      );
    }
  };

  const handleApproveTicket = (ticketId: string, notes: string, signature: string) => {
    const t = tickets.find(x => x.id === ticketId);
    if (t) {
      logActivity('APPROVE_REPORT', ticketId, `Supervisor menyetujui Service Report penanganan.`);
      const updatedTicket: Ticket = {
        ...t,
        status: TicketStatus.COMPLETED,
        supervisorSignature: signature,
        approvalDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setDoc(doc(db, 'tickets', ticketId), updatedTicket)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'tickets/' + ticketId));
    }

    triggerNotification(
      'Service Report Disetujui (Approved)',
      `Supervisor ${currentUser.name} memberikan tanda tangannya pada Service Report penutupan tiket ${ticketId}.`,
      'success'
    );
  };

  const handleRejectTicket = (ticketId: string, reason: string) => {
    const t = tickets.find(x => x.id === ticketId);
    if (t) {
      logActivity('REJECT_REPORT', ticketId, `Supervisor menolak Service Report. Alasan: ${reason}`);
      const updatedTicket: Ticket = {
        ...t,
        status: TicketStatus.REJECTED,
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      };
      setDoc(doc(db, 'tickets', ticketId), updatedTicket)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'tickets/' + ticketId));
    }

    triggerNotification(
      'Service Report Ditolak (Rejected)',
      `Pemberitahuan: Supervisor menolak klaim penyelesaian pada tiket ${ticketId}. Penjelasan: "${reason}"`,
      'error'
    );
  };

  const handleAssignTicket = (ticketId: string, techId: string) => {
    const tech = users.find(u => u.id === techId);
    if (!tech) return;

    const t = tickets.find(x => x.id === ticketId);
    if (t) {
      logActivity('ASSIGN_TICKET', ticketId, `Menunjuk teknisi ${tech.name} sebagai PJ.`);
      const updatedTicket: Ticket = {
        ...t,
        assignedTo: { id: tech.id, name: tech.name },
        status: TicketStatus.IN_PROGRESS,
        updatedAt: new Date().toISOString()
      };
      setDoc(doc(db, 'tickets', ticketId), updatedTicket)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'tickets/' + ticketId));
    }

    triggerNotification(
      'Teknisi Ditunjuk',
      `Tiket ${ticketId} dialihkan kepada penanganan ${tech.name}. Status meluncur ke "In Progress".`,
      'info'
    );
  };

  // Add Preventive Maintenance Schedule
  const handleAddPMSchedule = (sched: Omit<PMSchedule, 'id'>) => {
    const newId = `PM-${Math.floor(100 + Math.random() * 900)}`;
    const newSchedule: PMSchedule = {
      ...sched,
      id: newId
    };
    setSchedules(prev => [newSchedule, ...prev]);
    logActivity('CREATE_PM_SCHEDULE', newId, `Membuat jadwal preventive maintenance baru: ${sched.assetName}`);
    triggerNotification('Jadwal PM Terbentuk', `Aset ${sched.assetName} berhasil didaftarkan untuk pemeliharaan rutin ${sched.frequency}.`, 'success');
  };

  // Automatically trigger actionable corrective ticket directly from preventive maintenance
  const handleTriggerPMTicket = (schedule: PMSchedule) => {
    const nextTicketId = `TCK-${new Date().getFullYear()}-PM-${Math.floor(10 + Math.random() * 90)}`;
    const pmTicket: Ticket = {
      id: nextTicketId,
      title: `[PREVENTIF] ${schedule.assetName}`,
      description: `Pemeliharaan preventif periodik fungsional berbasis frekuensi ${schedule.frequency}. Lakukan langkah-langkah uji standar.`,
      category: schedule.category,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.SUBMITTED,
      location: 'Ruang Utility Utama / Sesuai Aset',
      reportedBy: { id: 'usr-1', name: 'Sistem Terjadwal PM', role: 'System Engine' },
      assignedTo: schedule.assignedTechnician,
      checklist: schedule.tasks.map((task, index) => ({
        id: String(index + 1),
        task,
        isDone: false
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDoc(doc(db, 'tickets', nextTicketId), pmTicket)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, 'tickets/' + nextTicketId));
    
    // Update schedule date tracking
    setSchedules(prev => prev.map(s => {
      if (s.id === schedule.id) {
        // Calculate next date rough estimate
        const nextDate = new Date();
        if (s.frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (s.frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else nextDate.setMonth(nextDate.getMonth() + 3);

        return {
          ...s,
          lastMaintenance: new Date().toISOString().split('T')[0],
          nextScheduledDate: nextDate.toISOString().split('T')[0],
          status: 'Active'
        };
      }
      return s;
    }));

    logActivity('TRIGGER_PM_TICKET', nextTicketId, `Menerbitkan tiket corrective hasil breakdown terjadwal ${schedule.id}`);
  };

  // Add Facility Visit Checklist
  const handleAddVisitLog = (vis: Omit<VisitChecklist, 'id'>) => {
    const newId = `VIS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newVisit: VisitChecklist = {
      ...vis,
      id: newId
    };
    setVisits(prev => [newVisit, ...prev]);
    logActivity('CREATE_VISIT_CHECKLIST', newId, `Menyerahkan laporan kunjungan lapangan checklist di ${vis.location}`);
    triggerNotification('Checklist Kunjungan Disubmit', `Inspektur menyerahkan laporan checklist kunjungan lapangan ${newId} untuk direview.`, 'warning');
  };

  const handleApproveVisitLog = (visitId: string, notes: string, signature: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id === visitId) {
        logActivity('APPROVE_VISIT', visitId, `Menandatangani tanda setuju laporan kunjungan lapangan.`);
        return {
          ...v,
          status: 'Approved',
          supervisorNotes: notes,
          supervisorSignature: signature
        };
      }
      return v;
    }));

    triggerNotification('Visit Checklist Disetujui', `Supervisor ${currentUser.name} memverifikasi rekapitulasi data kunjungan lapangan ${visitId}.`, 'success');
  };

  const handleRejectVisitLog = (visitId: string, notes: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id === visitId) {
        logActivity('REJECT_VISIT', visitId, `Menolak laporan kunjungan lapangan. Alasan: ${notes}`);
        return {
          ...v,
          status: 'Rejected',
          supervisorNotes: notes
        };
      }
      return v;
    }));

    triggerNotification('Visit Checklist Ditolak', `Pemberitahuan: supervisor mengembalikan rekap visit ${visitId}. Pesan: "${notes}"`, 'error');
  };

  // ADD USER CRUD (for Super Admin / Dewa)
  const handleAddUser = (user: Omit<User, 'id'>) => {
    const nextId = `usr-${users.length + 1}`;
    const newUser: User = { ...user, id: nextId };
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    logActivity('CLEAR_AUDIT_LOGS', 'all', 'Super Admin mendelete seluruh berkas logs.');
  };

  // Excel Spreadsheet exporters
  const handleExportAllTickets = () => {
    const spreadsheetData = tickets.map(t => ({
      'ID Tiket': t.id,
      'Judul Keluhan': t.title,
      'Kategori Bagian': t.category,
      'Prioritas': t.priority,
      'Status': t.status,
      'Lokasi Gedung': t.location,
      'Pelapor': t.reportedBy.name,
      'Teknisi Penanggungjawab': t.assignedTo?.name || 'Belum Ditunjuk',
      'Tanggal Dibuat': new Date(t.createdAt).toLocaleString('id-ID'),
      'Notes Hasil Lapangan': t.workNotes || '',
      'Tanggal Verifikasi': t.approvalDate ? new Date(t.approvalDate).toLocaleString('id-ID') : '-'
    }));
    exportToExcelCompatibleCsv(spreadsheetData, `MaintiX_Dokumen_Tiket_${new Date().toISOString().split('T')[0]}`);
  };

  // Filter computation for display
  const activeTicketInModal = activeTicketDetailId ? tickets.find(t => t.id === activeTicketDetailId) : null;

  const filteredTicketsList = tickets.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.location.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.reportedBy.name.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      (t.assignedTo?.name || '').toLowerCase().includes(ticketSearch.toLowerCase());

    const matchesStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
    const matchesPriority = ticketPriorityFilter === 'ALL' || t.priority === ticketPriorityFilter;
    const matchesCategory = ticketCategoryFilter === 'ALL' || t.category === ticketCategoryFilter;

    // RBAC Filter: If user role is GA/Region-SPV, they see relevant tickets.
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col font-sans transition-all text-slate-800 ${
      viewDeviceMode === 'mobile' ? 'items-center py-6 bg-slate-900 overflow-y-auto' : ''
    }`}>

      {/* Floating Simulation Switchers Bar */}
      <div className={`w-full bg-slate-900 border-b border-slate-800 p-2.5 px-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between z-40 text-xs text-white`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="font-mono font-bold tracking-wider text-slate-300 mr-2 uppercase">Panel Kontrol RBAC & Layout Simulator:</span>
          
          {/* Switch current user actor dynamically to see different viewpoints */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded border border-slate-700">
            <span className="text-[10px] text-zinc-400 font-bold px-1 uppercase shrink-0">Aktor Saat Ini:</span>
            <select
              value={currentUserId}
              onChange={e => {
                setCurrentUserId(e.target.value);
                const chosen = users.find(u => u.id === e.target.value);
                if (chosen) {
                  triggerNotification('Simulator Berganti Peran', `Layar Anda beralih ke perspektif ${chosen.name} (${chosen.role})`, 'info');
                }
              }}
              className="bg-slate-950 text-indigo-300 font-bold px-1.5 py-0.5 rounded focus:outline-none text-[11px]"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} [{u.role}]</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout visual simulator toggles */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded">
            <button
              onClick={() => setViewDeviceMode('desktop')}
              className={`p-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                viewDeviceMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Simulasi Tampilan Desktop Standar"
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop View
            </button>
            <button
              onClick={() => setViewDeviceMode('mobile')}
              className={`p-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                viewDeviceMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Simulasi Tampilan Handphone Responsif"
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile Cover
            </button>
          </div>
        </div>
      </div>

      {/* Frame Wrapper based on layout device choice */}
      <div className={`w-full flex-1 flex flex-col transition-all duration-300 ${
        viewDeviceMode === 'mobile'
          ? 'max-w-[400px] h-[820px] rounded-[44px] border-[14px] border-slate-950 bg-white shadow-2xl relative overflow-hidden my-4'
          : 'max-w-7xl mx-auto'
      }`}>

        {/* Global Nav Header */}
        <header className="bg-indigo-950 text-white p-3.5 px-5 flex items-center justify-between border-b border-indigo-900 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div>
              <h1 className="font-bold text-sm tracking-tight">MaintiX System</h1>
              <p className="text-[9px] text-indigo-300 tracking-widest font-mono">FACILITY OPERATION ENGINE</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Display Badge notification trigger */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-1.5 bg-indigo-900/40 border border-indigo-800 hover:bg-indigo-900 text-indigo-200 hover:text-white rounded-full transition-all cursor-pointer"
                title="Pemberitahuan Sistem"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
              </button>

              {/* In-app notification panel drop-down */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2.5 w-[280px] bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[360px]">
                  <div className="bg-indigo-900 text-white p-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">Antrian Notifikasi</span>
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                        setIsNotificationOpen(false);
                      }}
                      className="text-xxs font-semibold text-indigo-200 hover:text-white underline cursor-pointer"
                    >
                      Tandai Dibaca
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-3 text-xxs transition-colors ${notif.isRead ? 'bg-white' : 'bg-blue-50/40'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 tracking-tight">{notif.title}</span>
                          <span className="text-gray-400 tracking-widest font-mono text-[9px]">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-650 leading-relaxed font-medium">{notif.message}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="text-center py-10 text-gray-400 italic">Antrian pemberitahuan kosong.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current user mini identity indicator */}
            <div className="hidden sm:flex items-center gap-2 border-l border-indigo-900 pl-4 text-left">
              <span className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center border border-indigo-800 text-xs text-white">
                {currentUser.avatar || '⚡'}
              </span>
              <div>
                <div className="text-xs font-bold leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-indigo-300 font-medium tracking-tight mt-0.5">{currentUser.role}</div>
              </div>
            </div>

            {/* Mobile layout sidebar burger menu */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="sm:hidden p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-indigo-100" />
            </button>
          </div>
        </header>

        {/* Unified Mobile Drawer Nav / Sidebar Fallback for simulated layouts */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
            <div className="w-64 bg-indigo-950 text-white h-full p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-sm tracking-tight">MENU NAVIGATION</h3>
                  <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5 text-xs font-semibold">
                  {/* List of screens */}
                  {[
                    { id: 'dashboard', label: 'Monitor Analytics', icon: TrendingUp },
                    { id: 'tickets', label: 'Daftar Tiket', icon: Inbox },
                    { id: 'preventive', label: 'Preventive PM', icon: CalendarCheck },
                    { id: 'visits', label: 'Checklist Lapangan', icon: ClipboardCheck },
                    { id: 'rbac', label: 'Manajemen RBAC', icon: Users },
                    { id: 'audit', label: 'Logs Audit System', icon: ShieldAlert },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveScreen(item.id as any);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg transition-colors ${
                          activeScreen === item.id ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom login profile switch identifier */}
              <div className="border-t border-indigo-900 pt-4 flex gap-2">
                <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">{currentUser.avatar || '⚡'}</span>
                <div>
                  <div className="text-xs font-bold">{currentUser.name}</div>
                  <span className="text-[10px] text-gray-400 font-medium">{currentUser.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Main Layout Stage Grid */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Desktop Left navigation Sidebar panel */}
          <aside className="hidden sm:flex w-60 bg-indigo-950 border-r border-indigo-900 flex-col p-4 justify-between shrink-0 select-none">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-indigo-400 block tracking-widest uppercase ml-2">Monitor Utama</span>
                <nav className="space-y-1 text-xs font-semibold text-indigo-150">
                  <button
                    onClick={() => setActiveScreen('dashboard')}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      activeScreen === 'dashboard' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
                    Dashboard Analytics
                  </button>

                  <button
                    onClick={() => setActiveScreen('tickets')}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      activeScreen === 'tickets' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Inbox className="w-4 h-4 text-indigo-400 shrink-0" />
                    Daftar Tiket Maintenance
                  </button>

                  <button
                    onClick={() => setActiveScreen('preventive')}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      activeScreen === 'preventive' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    Preventive Maintenance
                  </button>

                  <button
                    onClick={() => setActiveScreen('visits')}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      activeScreen === 'visits' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ClipboardCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    kunjungan / Checklist
                  </button>
                </nav>
              </div>

              {/* Management system tools section */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-indigo-400 block tracking-widest uppercase ml-2">Administrasi RBAC</span>
                <nav className="space-y-1 text-xs font-semibold text-indigo-150">
                  <button
                    onClick={() => setActiveScreen('rbac')}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      activeScreen === 'rbac' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                    Manajemen User & Hak
                  </button>

                  <button
                    onClick={() => setActiveScreen('audit')}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      activeScreen === 'audit' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
                    Timeline Audit Logs
                  </button>
                </nav>
              </div>
            </div>

            {/* Logo bottom footer developer identifier */}
            <div className="border-t border-indigo-900 pt-4.5 text-xxs text-indigo-300 font-mono tracking-tight text-center">
              MaintiX Engine 2026 • v1.1
            </div>
          </aside>

          {/* Active Screen Stage container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 flex flex-col space-y-6">
            
            {/* Displaying Screen Panels Dynamically */}
            {activeScreen === 'dashboard' && (
              <DashboardAnalytics
                tickets={tickets}
                schedules={schedules}
                users={users}
                onExportExcel={handleExportAllTickets}
              />
            )}

            {activeScreen === 'tickets' && (
              <div id="tickets-management-pane" className="space-y-5">
                {/* Banner inside Ticket screen */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                      <Inbox className="w-5 h-5 text-indigo-600" />
                      Daftar Masuk Tiket Troubleshooting
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Pelacakan real-time progress pekerjaan, delegasi teknisi pelaksana, serta approval service report digital.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Excel export */}
                    <button
                      onClick={handleExportAllTickets}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 bg-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer w-full sm:w-auto justify-center"
                      title="Ekspor seluruh database tiket ke format Excel CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                      Export Excel
                    </button>

                    <button
                      onClick={() => setIsReportingTicket(!isReportingTicket)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer w-full sm:w-auto justify-center active:scale-97"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Laporkan Tiket Baru
                    </button>
                  </div>
                </div>

                {/* Submitting Ticket Form Accordion */}
                {isReportingTicket && (
                  <form onSubmit={handleAddNewTicketSubmit} className="bg-white p-5 rounded-xl border border-indigo-100 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-bold text-xs text-indigo-900 uppercase border-b border-indigo-55 pb-1">Detail Malfungsi Gedung</h3>
                      
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Nama Keluhan Kerusakan</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: AC Netes Air Deras di Meja Rapat Utama"
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-950 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Kategori Bagian</label>
                          <select
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-full text-xs px-1.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
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
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Urgensi Prioritas</label>
                          <select
                            value={newPriority}
                            onChange={e => setNewPriority(e.target.value as TicketPriority)}
                            className="w-full text-xs px-1.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-bold text-red-700"
                          >
                            {Object.values(TicketPriority).map(p => (
                              <option key={p} value={p}>{p} Priority</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Lokasi Gedung / Lantai / Ruangan</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Gedung B Lt 2 ruang rapat GA"
                          value={newLocation}
                          onChange={e => setNewLocation(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-xs text-indigo-900 uppercase border-b border-indigo-55 pb-1">Media Lampiran & Bukti</h3>
                        
                        <div className="mt-2 text-xxs text-gray-500">
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Kronologi Kerusakan</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Ceritakan dengan jelas bagaimana kronologi kerusakan dialami, agar tim teknisi mengetahui perkakas apa yang perlu disiapkan..."
                            value={newDesc}
                            onChange={e => setNewDesc(e.target.value)}
                            className="w-full text-xs p-2.5 border border-gray-250 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900 font-medium bg-gray-50/20"
                          />
                        </div>

                        {/* Interactive Photo capture rules */}
                        <div className="mt-3">
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Foto Temuan Malfungsi</label>
                          {newPhotoUrl ? (
                            <div className="relative w-36 h-24 border rounded overflow-hidden shadow-inner">
                              <img src={newPhotoUrl} alt="pre" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => setNewPhotoUrl('')}
                                className="absolute top-1 right-1 p-0.5 bg-black/60 rounded text-white text-[9px] font-bold"
                              >
                                Hapus
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* If GA, standard browse file is completely hidden and disabled. Standard GA can only snap photo using device camera feed directly. This implements specific role logic request constraint exactly! */}
                              {currentUser.role === UserRole.GA ? (
                                <button
                                  type="button"
                                  onClick={() => setIsPhotoCameraActive(true)}
                                  className="inline-flex items-center gap-1 px-3 py-1.8 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 font-bold text-xs transition-all cursor-pointer"
                                >
                                  <Camera className="w-4 h-4 text-emerald-600" />
                                  Jepret Bukti via Kamera
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setIsPhotoCameraActive(true)}
                                    className="inline-flex items-center gap-1 px-3 py-1.8 bg-blue-50 text-blue-800 rounded border border-blue-200 font-bold text-xs hover:bg-blue-100 cursor-pointer"
                                  >
                                    <Camera className="w-4 h-4" />
                                    Jepret Kamera
                                  </button>
                                  <label className="inline-flex items-center gap-1 px-3 py-1.8 bg-gray-50 text-gray-600 rounded border border-gray-200 font-bold text-xs cursor-pointer hover:bg-gray-100">
                                    Pilih File
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = () => setNewPhotoUrl(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                </>
                              )}
                              {currentUser.role === UserRole.GA && (
                                <span className="text-[10px] italic text-red-500 font-semibold leading-tight">
                                  *Peran GA: Mode upload hanya mengizinkan input Kamera langsung. File Explorer dikunci.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReportingTicket(false);
                            setNewPhotoUrl('');
                          }}
                          className="px-3.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg active:scale-97 cursor-pointer"
                        >
                          Submit Tiket Baru
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Filters Row */}
                <div className="bg-white p-3 px-4.5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari Tiket, lokasi, pelapor..."
                      value={ticketSearch}
                      onChange={e => setTicketSearch(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-1.8 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <select
                      value={ticketCategoryFilter}
                      onChange={e => setTicketCategoryFilter(e.target.value)}
                      className="bg-indigo-50/50 border-2 border-slate-900 rounded-none px-3 py-1.5 focus:outline-none font-black text-slate-900 uppercase text-[10px]"
                    >
                      <option value="ALL">SEMUA KATEGORI</option>
                      {['AC', 'Electrical', 'Plumbing', 'IT Network', 'Civil / Build', 'Cleanliness'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <select
                      value={ticketStatusFilter}
                      onChange={e => setTicketStatusFilter(e.target.value)}
                      className="bg-indigo-50/50 border-2 border-slate-900 rounded-none px-3 py-1.5 focus:outline-none font-black text-slate-900 uppercase text-[10px]"
                    >
                      <option value="ALL">SEMUA STATUS</option>
                      {Object.values(TicketStatus).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>

                    <select
                      value={ticketPriorityFilter}
                      onChange={e => setTicketPriorityFilter(e.target.value)}
                      className="bg-indigo-50/50 border-2 border-slate-900 rounded-none px-3 py-1.5 focus:outline-none font-black text-slate-900 uppercase text-[10px]"
                    >
                      <option value="ALL">SEMUA URGENSI</option>
                      {Object.values(TicketPriority).map(p => (
                        <option key={p} value={p}>{p} PRIORITAS</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Tickets List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTicketsList.map(t => {
                    const progress = t.checklist.length
                      ? Math.round((t.checklist.filter(c => c.isDone).length / t.checklist.length) * 100)
                      : 0;

                    const isUrgent = t.priority === 'High' || t.priority === 'Emergency';
                    const isCompleted = t.status === 'Completed';

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveTicketDetailId(t.id);
                          logActivity('VIEW_TICKET_DETAIL', t.id, `Membuka modul laporan detail kemajuan tiket.`);
                        }}
                        className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                          isUrgent ? 'border-amber-200 hover:border-amber-450' : 'border-gray-200 hover:border-indigo-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.5 rounded">
                              {t.id}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              t.status === 'Submitted' ? 'bg-blue-105 text-blue-700 font-bold border border-blue-200 bg-blue-50' :
                              t.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                              t.status === 'Pending Approval' ? 'bg-purple-100 text-purple-800 animate-pulse' :
                              t.status === 'Completed' ? 'bg-green-105 text-green-800 font-bold bg-green-50' :
                              'bg-zinc-100 text-zinc-700'
                            }`}>
                              {t.status}
                            </span>
                          </div>

                          <h3 className="font-bold text-xs text-gray-900 tracking-tight leading-relaxed mb-1 line-clamp-1">
                            {t.title}
                          </h3>
                          <p className="text-xxs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                            {t.description}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-medium mb-3 border-t border-gray-50 pt-2.5">
                            <div>Lokasi: <span className="text-gray-700 font-semibold">{t.location}</span></div>
                            <div>Urgensi: <span className={`font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>{t.priority}</span></div>
                          </div>
                        </div>

                        <div>
                          {/* Progress steps value bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                              <span>Instruksi Selesai:</span>
                              <span className="font-bold text-gray-800">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-150 h-1.2 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xxs text-gray-400">
                            <span>PJ: <strong className="text-gray-750 font-bold">{t.assignedTo?.name || 'Menunggu Delegasi'}</strong></span>
                            <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredTicketsList.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-405">
                      <Inbox className="w-12 h-12 mx-auto mb-2 opacity-30 text-gray-500" />
                      <p className="text-xs">Belum ada tiket terdaftar yang cocok dengan pencarian Anda.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeScreen === 'preventive' && (
              <PreventiveMaintenance
                schedules={schedules}
                users={users}
                currentUser={currentUser}
                onAddSchedule={handleAddPMSchedule}
                onTriggerPMTicket={handleTriggerPMTicket}
              />
            )}

            {activeScreen === 'visits' && (
              <ChecklistVisits
                visits={visits}
                currentUser={currentUser}
                onAddVisit={handleAddVisitLog}
                onApproveVisit={handleApproveVisitLog}
                onRejectVisit={handleRejectVisitLog}
              />
            )}

            {activeScreen === 'rbac' && (
              <UserManagement
                users={users}
                currentUser={currentUser}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                logActivity={logActivity}
              />
            )}

            {activeScreen === 'audit' && (
              <AuditLogs
                logs={auditLogs}
                currentUser={currentUser}
                onClearLogs={handleClearAuditLogs}
                onExportCsv={exportToExcelCompatibleCsv}
              />
            )}
          </main>
        </div>

        {/* Global Floating Toast Alert Simulation */}
        {latestToast && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white border border-indigo-150 shadow-2xl p-3.5 rounded-xl flex items-start gap-2.5 animate-bounce">
            <CheckCircle className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xxs">
              <div className="font-bold text-gray-900 tracking-tight">{latestToast.title}</div>
              <p className="text-gray-600 mt-0.5 leading-relaxed font-semibold">{latestToast.message}</p>
            </div>
            <button onClick={() => setLatestToast(null)} className="p-0.5 hover:bg-gray-100 rounded text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Ticket Details Core Fullscreen Modal */}
        {activeTicketInModal && (
          <TicketDetailModal
            ticket={activeTicketInModal}
            currentUser={currentUser}
            users={users}
            onClose={() => setActiveTicketDetailId(null)}
            onUpdateStatus={handleUpdateTicketStatus}
            onUpdateChecklist={handleUpdateChecklist}
            onApproveTicket={handleApproveTicket}
            onRejectTicket={handleRejectTicket}
            onAssignTicket={handleAssignTicket}
          />
        )}

        {/* Floating General Affairs / Camera Feed Trigger Standalone modal */}
        {isPhotoCameraActive && (
          <CameraCapture
            onCapture={(base64) => {
              setNewPhotoUrl(base64);
              setIsPhotoCameraActive(false);
            }}
            onClose={() => setIsPhotoCameraActive(false)}
          />
        )}

      </div>
    </div>
  );
}
