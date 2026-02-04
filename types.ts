
export enum AttendanceStatus {
  HADIR = 'Hadir',
  SAKIT = 'Sakit',
  ALPHA = 'Alpha',
  IZIN = 'Izin'
}

export interface ClassRoom {
  id: string;
  name: string;
  teacherName?: string;
  teacherNip?: string;
  headmasterName?: string;
  headmasterNip?: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  classId: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO format YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export type ViewState = 'dashboard' | 'classes' | 'students' | 'attendance' | 'reports';

export interface MonthlyStats {
  date: string;
  count: number;
}
