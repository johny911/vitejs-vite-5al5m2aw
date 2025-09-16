export enum UserRole {
  Admin = 'Admin',
  Engineer = 'Engineer',
  Storekeeper = 'Storekeeper',
  Supervisor = 'Supervisor',
  Board = 'Board'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string;
  status: 'Active' | 'Inactive';
}

export interface Project {
  id:string;
  name: string;
  location: string;
  status: 'Ongoing' | 'Completed' | 'On Hold';
  engineerIds: string[];
  startDate?: string;
}

export type TaskStatus = 'Planned' | 'Working on it' | 'Completed' | 'Delayed';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  quantity?: number;
  uom?: string;
  
  // For 'Planned' status
  plannedStartDate?: string;
  durationDays?: number;

  // For 'Working on it', 'Completed', 'Delayed'
  actualStartDate?: string;

  // For 'Working on it'
  estimatedEndDate?: string;
  
  // For 'Completed'
  actualEndDate?: string;
  
  // For 'Delayed'
  delayReason?: string;
}


export interface Material {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
}

export interface LabourAllocation {
    id: string;
    teamId: string;
    typeId: string;
    count: number;
}

export interface MaterialConsumption {
    id: string;
    materialId: string;
    quantity: number;
}

export interface WorkItem {
    id: string;
    description: string;
    quantity: number;
    uom: string;
    rate?: number; // For 'Rate Work' type costing
    allocations: LabourAllocation[];
    materialsConsumed: MaterialConsumption[];
}

export interface WorkReport {
    id: string;
    projectId: string;
    date: string;
    items: WorkItem[];
}


export interface MaterialTransaction {
  id: string;
  materialId: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  description: string;
}

// --- New Types for Labour Management ---

export type LabourWorkType = 'NMR' | 'Rate Work';

export interface LabourTeamType {
  typeId: string;
  cost?: number; // Cost per count for NMR type
}

export interface LabourTeam {
  id: string;
  name: string;
  workType: LabourWorkType;
  types: LabourTeamType[];
}

export interface LabourType {
  id: string;
  name: string;
}

export interface AttendanceRecord {
    id: string;
    projectId: string;
    date: string;
    teamId: string;
    typeId: string;
    count: number;
}