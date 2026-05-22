/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole, Ticket, TicketPriority, TicketStatus, PMSchedule, PMFrequency, VisitChecklist, AuditLog, SystemNotification } from './types';

export const mockUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Dewa Bagus (Super Admin)',
    email: 'dewa.bagus@maintix.co.id',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    avatar: '⚡',
    permissions: ['all'],
    branches: ['Cabang Sudirman', 'Cabang Thamrin', 'Cabang Kuningan', 'Cabang Dago'],
    regions: ['Regional DKI Jakarta', 'Regional Jawa Barat']
  },
  {
    id: 'usr-2',
    name: 'Budi Hartono (Admin)',
    email: 'budi.maintenance@maintix.co.id',
    role: UserRole.ADMIN,
    isActive: true,
    avatar: '💼',
    permissions: ['manage_users', 'manage_tickets', 'schedule_pm', 'view_analytics', 'view_audit_logs'],
    branches: ['Cabang Sudirman', 'Cabang Thamrin'],
    regions: ['Regional DKI Jakarta']
  },
  {
    id: 'usr-3',
    name: 'Siti Rahma (GA)',
    email: 'siti.ga@maintix.co.id',
    role: UserRole.GA,
    isActive: true,
    avatar: '🏢',
    permissions: ['create_tickets', 'view_own_tickets', 'camera_only_upload', 'manage_visits'],
    branches: ['Cabang Sudirman', 'Cabang Kuningan']
  },
  {
    id: 'usr-4',
    name: 'Heri Prasetyo (Region SPV)',
    email: 'heri.spv@maintix.co.id',
    role: UserRole.REGION_SPV,
    isActive: true,
    avatar: '🔎',
    permissions: ['approve_documents', 'view_analytics', 'view_all_tickets', 'assign_tickets'],
    regions: ['Regional DKI Jakarta', 'Regional Jawa Barat'],
    branches: ['Cabang Sudirman', 'Cabang Thamrin', 'Cabang Dago']
  },
  {
    id: 'usr-5',
    name: 'Bambang Wijaya (Manajer)',
    email: 'bambang.mgr@maintix.co.id',
    role: UserRole.MANAJER,
    isActive: true,
    avatar: '👔',
    permissions: ['view_analytics', 'view_all_tickets', 'broadcast_chat'],
    regions: ['Regional DKI Jakarta', 'Regional Jawa Barat'],
    branches: ['Cabang Sudirman', 'Cabang Thamrin', 'Cabang Kuningan', 'Cabang Dago']
  },
  {
    id: 'usr-6',
    name: 'Taufik Hidayat (Leader Cabang)',
    email: 'taufik.leader@maintix.co.id',
    role: UserRole.LEADER_CABANG,
    isActive: true,
    avatar: '👑',
    permissions: ['create_tickets', 'assign_tickets', 'track_progress'],
    branches: ['Cabang Sudirman']
  }
];

export const mockTickets: Ticket[] = [
  {
    id: 'TCK-2026-001',
    title: 'AC Gedung B Lantai 2 Kebocoran Freon',
    description: 'Unit indoor mengeluarkan hawa panas dan air menetes deras mengotori dokumen General Affair di bawahnya.',
    category: 'AC',
    priority: TicketPriority.HIGH,
    status: TicketStatus.IN_PROGRESS,
    location: 'Gedung B, Lantai 2, Ruang GA',
    reportedBy: { id: 'usr-3', name: 'Siti Rahma (GA)', role: 'General Affair' },
    assignedTo: { id: 'usr-5', name: 'Toni Wijaya (Teknisi AC)' },
    supervisorId: 'usr-4',
    createdAt: '2026-05-20T08:30:00Z',
    updatedAt: '2026-05-21T09:15:00Z',
    checklist: [
      { id: 'chk-1', task: 'Periksa kebocoran sambungan pipa tembaga', isDone: true },
      { id: 'chk-2', task: 'Uji tekanan sisa freon', isDone: true },
      { id: 'chk-3', task: 'Flushing jalur pipa pembuangan air kondensasi', isDone: false },
      { id: 'chk-4', task: 'Refill Freon R410A sesuai standar volume', isDone: false },
      { id: 'chk-5', task: 'Running test suhu terendah 18 derajat celcius', isDone: false }
    ],
    workNotes: 'Kebocoran ditemukan pada nepel indoor. Sudah dipotong dan dilakukan flaring ulang.'
  },
  {
    id: 'TCK-2026-002',
    title: 'Konsleting MCB Group 4 Panel Utama',
    description: 'MCB sering trip ketika Server Utama dan printer fungsional dinyalakan bersamaan. Diduga kelebihan beban fase R.',
    category: 'Electrical',
    priority: TicketPriority.EMERGENCY,
    status: TicketStatus.PENDING_APPROVAL,
    location: 'Gedung A, Ruang Server Lt 1',
    reportedBy: { id: 'usr-2', name: 'Budi Hartono (Admin)', role: 'Admin' },
    assignedTo: { id: 'usr-6', name: 'Rudi Arto (Teknisi Listrik)' },
    supervisorId: 'usr-4',
    createdAt: '2026-05-21T10:00:00Z',
    updatedAt: '2026-05-22T13:45:00Z',
    checklist: [
      { id: 'chk-1a', task: 'Ukur beban arus fase R, S, T menggunakan Tang Amper', isDone: true },
      { id: 'chk-2a', task: 'Ganti MCB rusak dengan kapasitas seimbang 20A', isDone: true },
      { id: 'chk-3a', task: 'Kencangkan semua baut terminal kabel tembaga', isDone: true },
      { id: 'chk-4a', task: 'Lakukan penyeimbangan beban fase antar group', isDone: true }
    ],
    workNotes: 'Mengganti MCB 16A Schneider dengan yang baru berkekuatan 20A. Arus terukur stabil pada 14.5 Amper pada beban maksimal. Laporan siap disetujui.',
    technicianSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 10 20 Q 30 10, 50 20 T 90 20" stroke="black" fill="none"/></svg>'
  },
  {
    id: 'TCK-2026-003',
    title: 'Toilet Gedung Utara Wastafel Mampet',
    description: 'Aliran air wastafel meluap tidak bisa mengalir ke saluran pembuangan, tercium bau kurang sedap.',
    category: 'Plumbing',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.SUBMITTED,
    location: 'Gedung Utara, Toilet Pria Lt Lobby',
    reportedBy: { id: 'usr-3', name: 'Siti Rahma (GA)', role: 'General Affair' },
    supervisorId: 'usr-4',
    createdAt: '2026-05-22T02:00:00Z',
    updatedAt: '2026-05-22T02:00:00Z',
    checklist: [
      { id: 'chk-1b', task: 'Copot sifon pembuangan bawah wastafel', isDone: false },
      { id: 'chk-2b', task: 'Bersihkan kotoran rambut/remidial lemak', isDone: false },
      { id: 'chk-3b', task: 'Pasang kembali & uji kebocoran seal karet', isDone: false }
    ],
    workNotes: ''
  },
  {
    id: 'TCK-2026-004',
    title: 'Kerusakan Engsel Pintu Kaca Lobby Utama',
    description: 'Pintu kaca sebelah kiri jika ditutup mengeluarkan suara decitan keras berpotensi lepas dan membahayakan pengunjung.',
    category: 'Civil',
    priority: TicketPriority.HIGH,
    status: TicketStatus.COMPLETED,
    location: 'Gedung Utama, Lobby Depan',
    reportedBy: { id: 'usr-3', name: 'Siti Rahma (GA)', role: 'General Affair' },
    assignedTo: { id: 'usr-6', name: 'Rudi Arto (Teknisi Listrik)' },
    supervisorId: 'usr-4',
    createdAt: '2026-05-18T09:00:00Z',
    updatedAt: '2026-05-19T16:00:00Z',
    checklist: [
      { id: 'chk-1c', task: 'Bongkar penutup engsel tanam (Floor Hinge)', isDone: true },
      { id: 'chk-2c', task: 'Tambahkan pelumas oli hidrolik khusus pintu kaca', isDone: true },
      { id: 'chk-3c', task: 'Kalibrasi posisi vertikal dan kecepatan swing pintu', isDone: true }
    ],
    workNotes: 'Sudah diolesi gemuk pelumas berkualitas tinggi dan sekrup disetel rata kembali. Kecepatan ayunan pintu diatur stabil aman.',
    technicianSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 5 35 C 40 5, 60 5, 95 35" stroke="black" fill="none"/></svg>',
    supervisorSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 10 10 Q 50 30, 90 10 M 30 10 L 60 30" stroke="blue" fill="none"/></svg>',
    approvalDate: '2026-05-19T16:30:00Z'
  }
];

export const mockPMSchedules: PMSchedule[] = [
  {
    id: 'PM-001',
    assetName: 'Chiller Daikin 150 PK Lantai Atas',
    category: 'AC',
    frequency: PMFrequency.MONTHLY,
    lastMaintenance: '2026-04-20',
    nextScheduledDate: '2026-05-25',
    assignedTechnician: { id: 'usr-5', name: 'Toni Wijaya (Teknisi AC)' },
    tasks: [
      'Bersihkan koil kondensor dengan air bertekanan tingi',
      'Ukur temperatur inlet dan outlet air evaporator',
      'Ukur electrical resistance motor compressor',
      'Uji kebocoran sambungan katup ekspansi'
    ],
    status: 'Active'
  },
  {
    id: 'PM-002',
    assetName: 'Genset Caterpillar 250 kVA Utama',
    category: 'Electrical',
    frequency: PMFrequency.MONTHLY,
    lastMaintenance: '2026-05-10',
    nextScheduledDate: '2026-06-10',
    assignedTechnician: { id: 'usr-6', name: 'Rudi Arto (Teknisi Listrik)' },
    tasks: [
      'Ganti filter solar dan periksa filter udara',
      'Uji ketegangan belt kipas radiator',
      'Ukur tegangan aki charger 24V',
      'Running manual test beban 15 menit tanpa load'
    ],
    status: 'Active'
  },
  {
    id: 'PM-003',
    assetName: 'Lift Elevator Pasien No. 2',
    category: 'Civil',
    frequency: PMFrequency.QUARTERLY,
    lastMaintenance: '2026-02-15',
    nextScheduledDate: '2026-05-15',
    assignedTechnician: { id: 'usr-6', name: 'Rudi Arto (Teknisi Listrik)' },
    tasks: [
      'Periksa ketebalan kampas rem motor traksi',
      'Uji sensor penutup pintu dan tombol overcapacity',
      'Kompresi oli gear box hidrolik elevator',
      'Periksa sensor mekanis penahan darurat lift'
    ],
    status: 'Overdue'
  }
];

export const mockVisitChecklists: VisitChecklist[] = [
  {
    id: 'VIS-2026-001',
    visitDate: '2026-05-22',
    location: 'Ruang Utility & Ruang Genset',
    inspector: { id: 'usr-3', name: 'Siti Rahma (GA)' },
    items: [
      { id: 'it-1', itemName: 'Genset Utama Caterpillar', status: 'Normal', remarks: 'Aki charger menyala 24.2V, bahan bakar solar 82%' },
      { id: 'it-2', itemName: 'Wastafel Lobby', status: 'Normal', remarks: 'Wastafel kering bersih, flush deras aman' },
      { id: 'it-3', itemName: 'Panel Listrik Lt 1', status: 'Abnormal', remarks: 'Salah satu lampu indikator phase R padam, MCB hangat' },
      { id: 'it-4', itemName: 'Pompa Booster Air Atas', status: 'Normal', remarks: 'Tekanan stabil 2.4 bar, tidak ada rembesan air' }
    ],
    notes: 'Kunjungan rutin checklist mingguan General Affair. Telah mencatat panel fase R yang rada hangat kemungkinan perlu pemantauan teknisi listrik.',
    signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 10 10 C 35 30, 80 5, 90 25" stroke="black" fill="none"/></svg>',
    status: 'Submitted'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-22T08:30:00Z',
    userId: 'usr-1',
    userName: 'Dewa Bagus (Super Admin)',
    userRole: UserRole.SUPER_ADMIN,
    action: 'LOGIN',
    details: 'Super Admin login ke dalam sistem MaintiX via Google Chrome.'
  },
  {
    id: 'log-2',
    timestamp: '2026-05-22T08:45:00Z',
    userId: 'usr-3',
    userName: 'Siti Rahma (GA)',
    userRole: UserRole.GA,
    action: 'CREATE_TICKET',
    targetId: 'TCK-2026-003',
    details: 'Membuat laporan tiket malfungsi wastafel toilet pria Gedung Utara.'
  },
  {
    id: 'log-3',
    timestamp: '2026-05-22T10:15:00Z',
    userId: 'usr-2',
    userName: 'Budi Hartono (Admin)',
    userRole: UserRole.ADMIN,
    action: 'ASSIGN_TICKET',
    targetId: 'TCK-2026-001',
    details: 'Menugaskan teknisi Toni Wijaya ke tiket keluhan freon AC Gedung B.'
  },
  {
    id: 'log-4',
    timestamp: '2026-05-22T14:20:00Z',
    userId: 'usr-5',
    userName: 'Toni Wijaya (Teknisi AC)',
    userRole: UserRole.GA,
    action: 'UPDATE_CHECKLIST',
    targetId: 'TCK-2026-001',
    details: 'Menandai 2 item checklist "Periksa kebocoran" dan "Uji tekanan" selesai pada AC Lantai 2.'
  },
  {
    id: 'log-5',
    timestamp: '2026-05-22T16:00:00Z',
    userId: 'usr-4',
    userName: 'Heri Prasetyo (Supervisor)',
    userRole: UserRole.REGION_SPV,
    action: 'APPROVE_DOCUMENT',
    targetId: 'TCK-2026-004',
    details: 'Menyetujui Service Report dan menandatangani digital penutupan tiket lobby pintu kaca.'
  }
];

export const mockNotifications: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Tiket Baru Masuk',
    message: 'General Affair (Siti) telah melaporkan tiket baru: "Toilet Gedung Utara Wastafel Mampet"',
    timestamp: '2026-05-22T02:00:00Z',
    isRead: false,
    type: 'info'
  },
  {
    id: 'notif-2',
    title: 'Persetujuan Service Report',
    message: 'Teknisi Rudi Arto meminta persetujuan atas Laporan Pekerjaan MCB Group 4 Panel Utama.',
    timestamp: '2026-05-22T13:45:00Z',
    isRead: false,
    type: 'warning'
  },
  {
    id: 'notif-3',
    title: 'Dokumen Disetujui',
    message: 'Supervisor Heri Prasetyo menyetujui Laporan Perbaikan Engsel Pintu Kaca Lobby.',
    timestamp: '2026-05-19T16:30:00Z',
    isRead: true,
    type: 'success'
  }
];
