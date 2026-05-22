/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  MANAJER = 'Manajer',
  ADMIN = 'Admin',
  REGION_SPV = 'Region (SPV)',
  GA = 'GA',
  LEADER_CABANG = 'Leader Cabang'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  permissions: string[];
  branches?: string[]; // Multiple branches selected by Super Admin
  regions?: string[];  // Multiple regional units selected by Super Admin
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  EMERGENCY = 'Emergency'
}

export enum TicketStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  IN_PROGRESS = 'In Progress',
  PENDING_APPROVAL = 'Pending Approval',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected'
}

export interface TicketChecklistItem {
  id: string;
  task: string;
  isDone: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string; // e.g., AC, Electrical, Plumbing, IT, Civil, Cleanliness
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  reportedBy: { id: string; name: string; role: string };
  assignedTo?: { id: string; name: string };
  supervisorId?: string;
  createdAt: string;
  updatedAt: string;
  checklist: TicketChecklistItem[];
  photoUrl?: string; // Captured photo
  workNotes?: string;
  technicianSignature?: string; // dataURI png/jpeg
  supervisorSignature?: string; // dataURI png/jpeg
  approvalDate?: string;
  rejectionReason?: string;
}

export enum PMFrequency {
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly'
}

export interface PMSchedule {
  id: string;
  assetName: string;
  category: string;
  frequency: PMFrequency;
  lastMaintenance?: string;
  nextScheduledDate: string;
  assignedTechnician: { id: string; name: string };
  tasks: string[];
  status: 'Active' | 'Paused' | 'Overdue';
}

export interface VisitChecklistItem {
  id: string;
  itemName: string; // Generator, Chiller, Panel Listrik, Pompa Air
  status: 'Normal' | 'Abnormal' | 'Pending';
  remarks: string;
}

export interface VisitChecklist {
  id: string;
  visitDate: string;
  location: string;
  inspector: { id: string; name: string };
  items: VisitChecklistItem[];
  notes: string;
  signature: string; // Data URI for sign
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  supervisorNotes?: string;
  supervisorSignature?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetId?: string;
  details: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}
