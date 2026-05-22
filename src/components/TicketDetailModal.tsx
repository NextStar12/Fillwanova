/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ticket, TicketStatus, User, UserRole } from '../types';
import { jsPDF } from 'jspdf';
import { X, Calendar, MapPin, Tag, Shield, CheckCircle2, AlertCircle, FileText, Download, Camera, CheckSquare2, Square, Save, PenTool, Check } from 'lucide-react';
import SignaturePad from './SignaturePad';
import CameraCapture from './CameraCapture';

interface TicketDetailModalProps {
  ticket: Ticket;
  currentUser: User;
  users: User[];
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus, notes?: string, photo?: string, signature?: string) => void;
  onUpdateChecklist: (ticketId: string, itemId: string, isDone: boolean) => void;
  onApproveTicket: (ticketId: string, notes: string, signature: string) => void;
  onRejectTicket: (ticketId: string, reason: string) => void;
  onAssignTicket: (ticketId: string, techId: string) => void;
}

export default function TicketDetailModal({
  ticket,
  currentUser,
  users,
  onClose,
  onUpdateStatus,
  onUpdateChecklist,
  onApproveTicket,
  onRejectTicket,
  onAssignTicket
}: TicketDetailModalProps) {
  const [workNotes, setWorkNotes] = useState(ticket.workNotes || '');
  const [photoUrl, setPhotoUrl] = useState(ticket.photoUrl || '');
  const [techSignature, setTechSignature] = useState(ticket.technicianSignature || '');
  
  // Modal states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState(ticket.assignedTo?.id || '');
  
  // Document action state
  const [documentAction, setDocumentAction] = useState<'NONE' | 'APPROVE' | 'REJECT'>('NONE');
  const [actionReason, setActionReason] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');

  // Role checking based on the 6 roles schema
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isSupervisor = currentUser.role === UserRole.REGION_SPV || isSuperAdmin || isAdmin;
  const isTechnician = currentUser.role === UserRole.GA;
  const isGA = currentUser.role === UserRole.GA;

  const isAssignedTech = ticket.assignedTo?.id === currentUser.id;
  const canAssign = isSuperAdmin || isAdmin || currentUser.role === UserRole.REGION_SPV;
  const canChecklist = isSuperAdmin || isAdmin || (currentUser.role === UserRole.GA && isAssignedTech);

  const technicians = users.filter(u => u.role === UserRole.GA);

  // Generate complete Service Report PDF using jsPDF
  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Styling parameters
      const leftMargin = 15;
      const rightMargin = 195;
      let yPos = 20;

      // Color Palette - Deep Indigo & Slate
      doc.setFillColor(30, 27, 75); // Dark Indigo
      doc.rect(0, 0, 210, 38, 'F');

      // Title & Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('MAINTIX MAINTENANCE SYSTEM', leftMargin, 16);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('SERVICE REPORT & PERSETUBUAN PEKERJAAN', leftMargin, 22);

      doc.setFontSize(8);
      doc.text(`WAKTU CETAK: ${new Date().toLocaleString('id-ID')}`, leftMargin, 28);
      doc.text(`REPORT BLOCK ID: SR-${ticket.id}`, rightMargin - 45, 16);

      yPos = 48;
      doc.setTextColor(30, 41, 59); // Slate

      // Section 1: Ticket Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. INFORMASI UMUM TIKET KERUSAKAN', leftMargin, yPos);
      doc.line(leftMargin, yPos + 1.5, rightMargin, yPos + 1.5);
      
      yPos += 8;
      // Grid labels & values
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('ID Tiket:', leftMargin, yPos);
      doc.text('Nama / Judul Lap:', 80, yPos);
      doc.text('Prioritas:', rightMargin - 40, yPos);

      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(ticket.id, leftMargin, yPos);
      doc.text(ticket.title, 80, yPos);
      doc.text(ticket.priority, rightMargin - 40, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Pemberi Laporan:', leftMargin, yPos);
      doc.text('Kategori Unit:', 80, yPos);
      doc.text('Lokasi Kejadian:', rightMargin - 60, yPos);

      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`${ticket.reportedBy.name} (${ticket.reportedBy.role})`, leftMargin, yPos);
      doc.text(ticket.category, 80, yPos);
      doc.text(ticket.location, rightMargin - 60, yPos);

      yPos += 10;
      // Description Section
      doc.setFont('helvetica', 'bold');
      doc.text('Deskripsi Masalah:', leftMargin, yPos);
      yPos += 4.5;
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(ticket.description, 180);
      doc.text(descLines, leftMargin, yPos);

      yPos += (descLines.length * 4) + 6;

      // Section 2: Checklist Pengecekan Lapangan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. DAFTAR TINDAKAN PERBAIKAN & CHECKLIST', leftMargin, yPos);
      doc.line(leftMargin, yPos + 1.5, rightMargin, yPos + 1.5);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Nomer', leftMargin, yPos);
      doc.text('Butir Pengecekan Mesin / Tindakan Mandiri', leftMargin + 15, yPos);
      doc.text('Status Selesai', rightMargin - 30, yPos);

      yPos += 3;
      ticket.checklist.forEach((item, idx) => {
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`${idx + 1}`, leftMargin + 2, yPos);
        doc.text(item.task, leftMargin + 15, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(item.isDone ? 'SELESAI (Done)' : 'BELUM', rightMargin - 30, yPos);
      });

      yPos += 10;

      // Section 3: Catatan Pekerjaan & Catatan Teknis
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('3. RINGKASAN REKAYASA & NOTES PEKERJAAN', leftMargin, yPos);
      doc.line(leftMargin, yPos + 1.5, rightMargin, yPos + 1.5);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Nama Teknisi PJ:', leftMargin, yPos);
      doc.text('Catatan Penanganan Lapangan:', 80, yPos);

      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(ticket.assignedTo?.name || 'Belum ditugaskan', leftMargin, yPos);
      const notesLines = doc.splitTextToSize(ticket.workNotes || 'Tidak ada catatan notes dilaporkan oleh teknisi.', 110);
      doc.text(notesLines, 80, yPos);

      yPos += Math.max(15, notesLines.length * 4) + 3;

      // Section 4: Signatures Area Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('4. PERSETUJUAN & NOTARIS DIGITAL', leftMargin, yPos);
      doc.line(leftMargin, yPos + 1.5, rightMargin, yPos + 1.5);

      yPos += 8;
      doc.setFontSize(9);
      
      // Draw signature frames
      // Left Frame: Technician
      doc.rect(leftMargin, yPos, 80, 42);
      doc.text('TANDA TANGAN PELAKSANA:', leftMargin + 4, yPos + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(ticket.assignedTo?.name || 'Pekerja Lapangan', leftMargin + 4, yPos + 38);

      // Right Frame: Approver
      doc.rect(rightMargin - 80, yPos, 80, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('APPROVAL SUPERVISOR / DEWA:', rightMargin - 76, yPos + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(ticket.supervisorSignature ? 'Disetujui Online' : 'Belum Disetujui', rightMargin - 76, yPos + 38);

      // Inject signatures if they exist dynamically
      if (ticket.technicianSignature && ticket.technicianSignature.startsWith('data:image')) {
        try {
          doc.addImage(ticket.technicianSignature, 'PNG', leftMargin + 10, yPos + 8, 60, 24);
        } catch (e) {
          console.error("Failed to inject tech signature to PDF image loader", e);
        }
      }

      if (ticket.supervisorSignature && ticket.supervisorSignature.startsWith('data:image')) {
        try {
          doc.addImage(ticket.supervisorSignature, 'PNG', rightMargin - 70, yPos + 8, 60, 24);
        } catch (e) {
          console.error("Failed to inject supervisor signature to PDF image loader", e);
        }
      }

      // Save Report file
      doc.save(`Service_Report_${ticket.id}.pdf`);
      alert('Pemberitahuan: Service Report PDF Berhasil Dibuat dan Diunduh!');
    } catch (err) {
      console.error(err);
      alert('Error saat mengekspor laporan pekerjaan PDF. Silakan coba lagi.');
    }
  };

  const handleStatusUpdateLocal = () => {
    // Determine target next state based on context
    // Technicians update to Pending Approval when they submit checklist + Signature
    if (isTechnician) {
      if (!workNotes) {
        alert('Tuliskan rincian hasil pekerjaan utama pada kolom Notes terlebih dahulu.');
        return;
      }
      if (!techSignature) {
        alert('Tolong berikan tanda tangan digital Anda untuk memverifikasi laporan.');
        return;
      }
      onUpdateStatus(ticket.id, TicketStatus.PENDING_APPROVAL, workNotes, photoUrl, techSignature);
      alert('Tiket berhasil diserahkan ke Supervisor untuk diverifikasi & disetujui (Status: Pending Approval).');
    } else {
      // Admins can change status freely for management
      onUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS, workNotes, photoUrl, techSignature);
    }
  };

  const handleDocumentActionConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (documentAction === 'APPROVE') {
      if (!supervisorSignature) {
        alert('Beri tanda tangan digital persetujuan Anda sebagai penjamin.');
        return;
      }
      onApproveTicket(ticket.id, actionReason, supervisorSignature);
      alert('Service report disetujui oleh Supervisor. Status tiket berubah menjadi Completed!');
    } else if (documentAction === 'REJECT') {
      if (!actionReason) {
        alert('Masukkan catatan alasan penolakan secara jelas.');
        return;
      }
      onRejectTicket(ticket.id, actionReason);
      alert('Kunjungan / Service report ditolak kembali ke Teknisi. Status tiket berubah menjadi Rejected.');
    }
    setDocumentAction('NONE');
    setActionReason('');
    setSupervisorSignature('');
  };

  const hasPhoto = !!ticket.photoUrl || !!photoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 overflow-y-auto">
      <div id="ticket-modal-card" className="w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] md:max-h-[95vh]">
        
        {/* Banner Header with high coloring based on priority */}
        <div className={`p-4 text-white flex items-center justify-between ${
          ticket.priority === 'Emergency' ? 'bg-red-700' :
          ticket.priority === 'High' ? 'bg-amber-600' :
          'bg-indigo-950'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-center bg-white/20 text-white font-bold text-xs px-2 py-0.5 rounded tracking-widest backdrop-blur-sm">
                {ticket.id}
              </span>
              <span className="text-[11px] font-bold tracking-wider uppercase bg-black/30 px-1.5 py-0.5 rounded text-yellow-300">
                {ticket.priority} Priority
              </span>
            </div>
            <h2 className="font-bold text-sm tracking-tight mt-1.5 line-clamp-1">{ticket.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Show PDF print action if it is Pending Approval or Completed */}
            {['Pending Approval', 'Completed'].includes(ticket.status) && (
              <button
                onClick={handleGeneratePDF}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg text-xxs shadow transition-colors cursor-pointer"
                title="Unduh Service Report PDF Resmi"
              >
                <Download className="w-3.5 h-3.5 text-indigo-700" />
                Service Report (.pdf)
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Left/Middle core information (2 Columns) */}
            <div className="md:col-span-2 space-y-4">
              
              {/* Problem Metadata panel */}
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-xs text-indigo-900 uppercase">1. Rincian Temuan Kerusakan</h3>
                
                <div className="grid grid-cols-2 gap-2 text-xxs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Kategori: <strong className="text-gray-900">{ticket.category}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Lokasi: <strong className="text-gray-900" title={ticket.location}>{ticket.location}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Submitted: <strong className="text-gray-900">{new Date(ticket.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Status: <strong className="text-gray-900">{ticket.status}</strong></span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">Deskripsi Laporan Kejadian:</span>
                  <p className="text-xs text-gray-800 leading-relaxed font-semibold mt-1 bg-white p-2.5 rounded border border-gray-200">
                    {ticket.description}
                  </p>
                </div>

                {/* Photo feedback preview if attached */}
                {ticket.photoUrl && (
                  <div className="border-t border-gray-100 pt-3">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wide mb-1.5">Foto Temuan Terlampir:</span>
                    <div className="w-full max-h-52 overflow-hidden bg-black rounded-lg border border-gray-250 flex items-center justify-center">
                      <img
                        src={ticket.photoUrl}
                        alt="Issue attachment"
                        className="max-h-48 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist panel instructions */}
              <div className="bg-white p-4.5 rounded-xl border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xs text-indigo-900 uppercase">2. Langkah Penanganan Malfungsi (Checklist)</h3>
                  <span className="text-[10px] text-gray-400 italic">Diperbarui oleh Teknisi Pelaksana</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {ticket.checklist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => canChecklist && onUpdateChecklist(ticket.id, item.id, !item.isDone)}
                      disabled={!canChecklist}
                      className={`w-full text-left flex items-start gap-2 p-2 border rounded-lg text-xxs transition-all ${
                        item.isDone
                          ? 'bg-green-50/50 border-green-200 text-green-800 font-medium'
                          : 'bg-white border-gray-150 text-gray-500 hover:border-indigo-200'
                      }`}
                    >
                      {item.isDone ? (
                        <CheckSquare2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-normal">{item.task}</span>
                    </button>
                  ))}
                  {ticket.checklist.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">Tidak ada list instruksi khusus.</p>
                  )}
                </div>
              </div>

              {/* Technician active updates panel */}
              {ticket.status === 'In Progress' && isAssignedTech && (
                <div className="bg-indigo-50 border border-indigo-100 p-4.5 rounded-xl space-y-4">
                  <h3 className="font-bold text-xs text-indigo-900 uppercase flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-indigo-600" />
                    Rincian Lapangan Teknisi (Update Pelayanan)
                  </h3>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Catatan Notes Teknisi (Tindakan Terkait)</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Contoh: Mengisi modul, mengganti pipa yang aus, pengetesan pressure gauge stabil..."
                      value={workNotes}
                      onChange={e => setWorkNotes(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white text-gray-950 font-semibold"
                    />
                  </div>

                  {/* Attachment Capture strictly enforcing GA limitations or allowing convenient uploads */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Unggah Foto / Snap via Kamera Lapangan</label>
                    {photoUrl ? (
                      <div className="relative w-40 h-28 bg-gray-100 border border-gray-200 rounded overflow-hidden">
                        <img src={photoUrl} alt="prev" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="absolute top-1 right-1 p-0.5 bg-black/60 rounded text-white text-xxs font-bold hover:bg-black"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {/* We provide Camera explicitly */}
                        <button
                          type="button"
                          onClick={() => setIsCameraActive(true)}
                          className="px-3.5 py-2 border border-dashed border-gray-300 rounded hover:border-indigo-500 text-xs font-semibold text-gray-500 flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-indigo-600" />
                          Gunakan Kamera
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <SignaturePad
                      id="technician-sig"
                      onSave={setTechSignature}
                      label="Bubuhkan Tanda Tangan Digital Teknisi"
                      initialValue={techSignature}
                    />
                  </div>

                  <button
                    onClick={handleStatusUpdateLocal}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs tracking-wide shadow-lg cursor-pointer transition-shadow"
                  >
                    Ajukan Persetujuan Service Report
                  </button>
                </div>
              )}
            </div>

            {/* Right details sidebar (1 Column) */}
            <div className="space-y-4">
              
              {/* Assign Technician Widget */}
              {canAssign && (ticket.status === 'Draft' || ticket.status === 'Submitted') && (
                <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl space-y-3">
                  <h3 className="font-bold text-xs text-indigo-900 uppercase">Tunjuk Penanggung Jawab</h3>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Pilih Teknisi Lapangan:</label>
                    <select
                      value={selectedTechId}
                      onChange={e => setSelectedTechId(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white mt-1"
                    >
                      <option value="">Pilih Teknisi...</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (!selectedTechId) {
                        alert('Harap pilih nama teknisi pelaksana.');
                        return;
                      }
                      onAssignTicket(ticket.id, selectedTechId);
                      alert('Berhasil! Teknisi berhasil ditunjuk untuk menangani keluhan.');
                    }}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xxs tracking-wider shadow"
                  >
                    Tugaskan Sekarang
                  </button>
                </div>
              )}

              {/* Status and Assignment States */}
              <div className="bg-white p-4.5 rounded-xl border border-gray-200 text-xxs space-y-3">
                <h3 className="font-bold text-xs text-indigo-900 uppercase border-b border-gray-100 pb-1.5 text-center">Detail Sistem</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Penanggung Jawab:</span>
                  <span className="font-bold text-gray-800">{ticket.assignedTo?.name || 'Belum ditunjuk'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Dilaporkan Oleh:</span>
                  <span className="font-bold text-gray-800">{ticket.reportedBy.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Review Terakhir:</span>
                  <span className="font-bold text-gray-650 font-mono">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Supervisor Document approval decision panel */}
              {ticket.status === 'Pending Approval' && isSupervisor && (
                <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-xl space-y-3">
                  <h3 className="font-bold text-xs text-amber-900 uppercase flex items-center gap-1">
                    <Shield className="w-4 h-4 text-amber-700" />
                    Otorisasi Approval Supervisor
                  </h3>

                  {documentAction === 'NONE' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDocumentAction('REJECT');
                          setActionReason('');
                        }}
                        className="flex-1 py-1 px-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded text-xxs transition-colors"
                      >
                        Tolak Laporan
                      </button>
                      <button
                        onClick={() => {
                          setDocumentAction('APPROVE');
                          setActionReason('');
                        }}
                        className="flex-1 py-1 px-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-xxs transition-colors shadow"
                      >
                        Setujui Laporan
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleDocumentActionConfirm} className="space-y-3 pt-2.5 border-t border-amber-100">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          {documentAction === 'APPROVE' ? 'Catatan Persetujuan (Opsional)' : 'Alasan Penolakan (Wajib Isian)'}
                        </label>
                        <input
                          type="text"
                          required={documentAction === 'REJECT'}
                          placeholder={documentAction === 'APPROVE' ? 'Contoh: Pekerjaan rapi dan unit stabil.' : 'Tuliskan bagian mana yang dinilai tidak selesai...'}
                          value={actionReason}
                          onChange={e => setActionReason(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 border border-amber-300 rounded bg-white text-gray-900 focus:outline-none"
                        />
                      </div>

                      {documentAction === 'APPROVE' && (
                        <SignaturePad
                          id={`ticket-spv-${ticket.id}`}
                          onSave={setSupervisorSignature}
                          label="Bubuhkan Tanda Tangan Digital Supervisor"
                          initialValue={supervisorSignature}
                        />
                      )}

                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDocumentAction('NONE')}
                          className="px-2.5 py-1 text-xxs text-gray-500 hover:bg-white rounded border border-gray-200"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className={`px-3.5 py-1 text-white font-bold text-xxs rounded ${
                            documentAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                          }`}
                        >
                          Konfirmasi {documentAction}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Show signature inside report details if completed */}
              {ticket.status === 'Completed' && (
                <div className="bg-green-50/50 border border-green-200 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] text-green-800 font-bold block uppercase tracking-wide">Persetujuan Terpaku:</span>
                  <div className="grid grid-cols-2 gap-2 text-center text-xxs">
                    <div className="bg-white p-1 rounded border border-green-150">
                      <span className="text-gray-400 block text-[9px]">Teknisi Jam</span>
                      <div className="my-1.5 flex justify-center">
                        <img src={ticket.technicianSignature || 'https://placehold.co/100x40/png'} alt="tech-sig" className="max-h-11 object-contain" />
                      </div>
                    </div>
                    <div className="bg-white p-1 rounded border border-green-150">
                      <span className="text-gray-400 block text-[9px]">Supervisor Jam</span>
                      <div className="my-1.5 flex justify-center">
                        <img src={ticket.supervisorSignature || 'https://placehold.co/100x40/png'} alt="spv-sig" className="max-h-11 object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reject Feedback banner */}
              {ticket.status === 'Rejected' && ticket.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xxs font-bold text-red-900 uppercase">Laporan Ditolak Supervisor:</h4>
                      <p className="text-xxs text-red-750 font-medium mt-1 leading-relaxed italic">
                        "{ticket.rejectionReason}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Camera capture screen iframe safe overlay */}
        {isCameraActive && (
          <CameraCapture
            onCapture={(base64) => {
              setPhotoUrl(base64);
              setIsCameraActive(false);
            }}
            onClose={() => setIsCameraActive(false)}
          />
        )}
      </div>
    </div>
  );
}
