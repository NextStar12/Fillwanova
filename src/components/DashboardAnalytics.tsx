/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ticket, User, PMSchedule, UserRole } from '../types';
import { BarChart3, PieChart, Activity, TrendingUp, Clock, AlertTriangle, ShieldCheck, CheckCircle, Wrench, Download } from 'lucide-react';

interface DashboardAnalyticsProps {
  tickets: Ticket[];
  schedules: PMSchedule[];
  users: User[];
  onExportExcel: () => void;
}

export default function DashboardAnalytics({ tickets, schedules, users, onExportExcel }: DashboardAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'technician' | 'category'>('overview');

  // Compute stats
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(t => t.status === 'Completed').length;
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
  const submittedTickets = tickets.filter(t => t.status === 'Submitted').length;
  const pendingApprovalTickets = tickets.filter(t => t.status === 'Pending Approval').length;
  const rejectedTickets = tickets.filter(t => t.status === 'Rejected').length;

  const urgentTickets = tickets.filter(t => t.priority === 'High' || t.priority === 'Emergency').length;
  const urgentResolved = tickets.filter(
    t => (t.priority === 'High' || t.priority === 'Emergency') && t.status === 'Completed'
  ).length;

  const resolutionRate = totalTickets ? Math.round((completedTickets / totalTickets) * 100) : 0;

  // Simulate MTTR (Mean Time to Resolution)
  const mttr = "2.4 Jam";

  // Category counts
  const categoryCounts: Record<string, number> = {};
  tickets.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat],
    percentage: Math.round((categoryCounts[cat] / (totalTickets || 1)) * 100)
  })).sort((a, b) => b.count - a.count);

  // Technician performance
  const technicians = users.filter(u => u.role === UserRole.GA);
  const techStats = technicians.map(tech => {
    const assigned = tickets.filter(t => t.assignedTo?.id === tech.id);
    const completed = assigned.filter(t => t.status === 'Completed').length;
    const progress = assigned.filter(t => t.status === 'In Progress' || t.status === 'Pending Approval').length;
    const completionRate = assigned.length ? Math.round((completed / assigned.length) * 100) : 0;
    return {
      id: tech.id,
      name: tech.name,
      assigned: assigned.length,
      completed,
      progress,
      rate: completionRate
    };
  }).sort((a, b) => b.completed - a.completed);

  // Preventive maintenance status
  const pmActive = schedules.filter(s => s.status === 'Active').length;
  const pmOverdue = schedules.filter(s => s.status === 'Overdue').length;
  const totalPm = schedules.length;

  return (
    <div id="analytics-dashboard" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-slate-900 shrink-0" />
            Dashboard Analytics
          </h2>
          <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-1">
            Real-time pantauan kinerja tim, status tiket, pencapaian SLA, dan preventif maintenance.
          </p>
        </div>
        <button
          onClick={onExportExcel}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-md transition-colors w-full sm:w-auto justify-center cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export Excel (.xlsx)
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-l-8 border-blue-600 p-6 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">Total Tiket Masuk</div>
          <div className="text-5xl font-black tracking-tighter text-slate-900">{totalTickets}</div>
          <div className="text-xs text-blue-600 font-bold mt-2">Membantu {resolutionRate}% terselesaikan</div>
        </div>

        <div className="bg-white border-l-8 border-emerald-500 p-6 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">Kinerja Penyelesaian</div>
          <div className="text-5xl font-black tracking-tighter text-slate-900">{completedTickets}</div>
          <div className="text-xs text-emerald-600 font-bold mt-2">✏️ {completedTickets} tiket diverifikasi</div>
        </div>

        <div className="bg-white border-l-8 border-orange-500 p-6 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">SLA Respon (MTTR)</div>
          <div className="text-5xl font-black tracking-tighter text-slate-900">{mttr}</div>
          <div className="text-xs text-orange-600 font-bold mt-2">-2m improvement minggu ini</div>
        </div>

        <div className="bg-white border-l-8 border-slate-900 p-6 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">Preventive Task</div>
          <div className="text-5xl font-black tracking-tighter text-slate-900">{pmActive}/{totalPm}</div>
          <div className="text-xs text-red-600 font-bold mt-2">💡 {pmOverdue} Terlewat jadwal</div>
        </div>
      </div>

      {/* Detailed Status Breakdown */}
      <div className="bg-slate-900 text-white p-6 shadow-lg border-b-4 border-orange-500">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-orange-500" /> Aliran Status Tiket Aktual
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
          <div className="bg-slate-950 p-4 border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Submitted</span>
            <div className="text-3xl font-black text-white mt-1">{submittedTickets}</div>
          </div>
          <div className="bg-slate-950 p-4 border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">In Progress</span>
            <div className="text-3xl font-black text-white mt-1">{inProgressTickets}</div>
          </div>
          <div className="bg-slate-950 p-4 border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pending Approval</span>
            <div className="text-3xl font-black text-zinc-300 mt-1 animate-pulse">{pendingApprovalTickets}</div>
          </div>
          <div className="bg-slate-950 p-4 border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Completed</span>
            <div className="text-3xl font-black text-emerald-500 mt-1">{completedTickets}</div>
          </div>
          <div className="bg-slate-950 p-4 border border-slate-800 col-span-2 lg:col-span-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Rejected / Draft</span>
            <div className="text-3xl font-black text-red-500 mt-1">{rejectedTickets}</div>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SVG Chart 1 - Trends (7 Columns) */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white p-6 rounded-none border-2 border-slate-900 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-slate-905" />
              Tren Tiket Mingguan (Mei 2026)
            </h4>
            <div className="flex gap-2 text-[10px] font-bold text-slate-600">
              <span className="flex items-center gap-1"><span className="w-2.5 h-1 px-1 bg-slate-900 inline-block"></span>Tiket Masuk</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-1 px-1 bg-emerald-500 inline-block"></span>Tiket Selesai</span>
            </div>
          </div>

          {/* Simple Highly Responsive Vector Chart */}
          <div className="flex-1 w-full h-48 bg-slate-50 border border-slate-200 p-2 relative flex items-end">
            <svg viewBox="0 0 500 160" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1.5" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1.5" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1.5" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2 2" />

              {/* Day Labels */}
              <text x="40" y="152" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">16 Mei</text>
              <text x="110" y="152" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">17 Mei</text>
              <text x="180" y="152" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">18 Mei</text>
              <text x="250" y="152" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">19 Mei</text>
              <text x="320" y="152" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">20 Mei</text>
              <text x="390" y="152" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">21 Mei</text>
              <text x="460" y="152" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">22 Mei</text>

              {/* Y Axis Guide */}
              <text x="30" y="23" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="end">12</text>
              <text x="30" y="63" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="end">8</text>
              <text x="30" y="103" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="end">4</text>
              <text x="30" y="143" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="end">0</text>

              {/* Line 1: Tiket Masuk (Slate/Black) */}
              <path
                d="M 40 120 L 110 90 L 180 60 L 250 100 L 320 50 L 390 30 L 460 70"
                fill="none"
                stroke="#0f172a"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Line 2: Tiket Selesai (Emerald) */}
              <path
                d="M 40 130 L 110 110 L 180 80 L 250 90 L 320 100 L 390 60 L 460 80"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="4,2"
                strokeLinecap="round"
              />

              {/* Interaction Circles */}
              <circle cx="390" cy="30" r="4" fill="#0f172a" stroke="white" strokeWidth="1" />
              <circle cx="460" cy="70" r="4" fill="#0f172a" stroke="white" strokeWidth="1" />
              <circle cx="460" cy="80" r="4" fill="#10b981" stroke="white" strokeWidth="1" />
            </svg>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-center border-t-2 border-slate-900 pt-3">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Total SLA Dipenuhi</div>
              <div className="text-2xl font-black text-slate-950 mt-0.5">92.5%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Preventive On-Time</div>
              <div className="text-2xl font-black text-slate-950 mt-0.5">85.0%</div>
            </div>
          </div>
        </div>

        {/* SVG Chart 2 - Category Distribution (5 Columns) */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-none border-2 border-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5 mb-3">
              <PieChart className="w-5 h-5 text-slate-900" />
              Tiket Berdasarkan Kategori
            </h4>
            <p className="text-xs text-slate-500 font-medium mb-4 uppercase tracking-wide">Proporsi kategori laporan keluhan maintenance sistem.</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3.5">
            {categories.map((cat, idx) => {
              // Color map
              const colors = ['bg-slate-900', 'bg-emerald-500', 'bg-orange-500', 'bg-blue-600', 'bg-purple-600', 'bg-rose-500'];
              const color = colors[idx % colors.length];
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span className={`w-3 h-3 border border-slate-950 ${color}`}></span>
                      {cat.name}
                    </span>
                    <span className="font-black text-slate-950">
                      {cat.count} TKT ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 border border-slate-900 overflow-hidden">
                    <div
                      className={`h-full ${color}`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 font-bold uppercase">
                Belum ada data distribusi tiket kerusakan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Technician Performance Grid */}
      <div className="bg-white p-6 rounded-none border-2 border-slate-900 shadow-sm">
        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5 mb-3">
          <BarChart3 className="w-5 h-5 text-slate-900" />
          Kinerja Tiap Teknisi (Leaderboard)
        </h4>
        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mb-4">Pengukuran total tiket yang berhasil diselesaikan oleh masing-masing personil lapangan.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-705 border-collapse border-2 border-slate-900">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-black border-b-2 border-slate-900">
                <th className="py-3 px-4 font-black">Nama Teknisi</th>
                <th className="py-3 px-4 font-black text-center">Ditugaskan</th>
                <th className="py-3 px-4 font-black text-center">Selesai</th>
                <th className="py-3 px-4 font-black text-center">Sedang Proses</th>
                <th className="py-3 px-4 font-black text-right">Rasio Penyelesaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {techStats.map(tech => (
                <tr key={tech.id} className="hover:bg-slate-50 transition-colors font-bold text-slate-800">
                  <td className="py-3 px-4 font-black text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      {tech.name.split('')[0]}
                    </span>
                    {tech.name}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900 font-black">{tech.assigned}</td>
                  <td className="py-3 px-4 text-center text-emerald-650 font-black">{tech.completed}</td>
                  <td className="py-3 px-4 text-center text-orange-650 font-black">{tech.progress}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <span className="font-black text-slate-950">{tech.rate}%</span>
                      <div className="w-20 bg-slate-100 h-2 border border-slate-900 overflow-hidden">
                        <div className="h-full bg-slate-900" style={{ width: `${tech.rate}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
