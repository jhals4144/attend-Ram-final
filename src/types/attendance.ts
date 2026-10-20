export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 1=Monday, ..., 6=Saturday

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';

export interface Semester {
  id: string;
  name: string; // e.g., "2nd Year - Sem 3 (Odd)"
  academicYear: string; // e.g., "2024 - 2025"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetPercentage: number; // default 75
  isCurrent: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  semesterId: string;
  code: string; // e.g. "CS301"
  name: string; // e.g. "Data Structures & Algorithms"
  teacher?: string; // e.g. "Prof. Sharma"
  room?: string; // e.g. "Room 204"
  color: string; // emerald, blue, indigo, violet, amber, rose, teal, orange
  targetPercentage?: number; // per-subject target override (default: semester target)
  // baseline manual counters when starting midway
  manualAttended: number;
  manualConducted: number;
}

export interface TimetableSlot {
  id: string;
  semesterId: string;
  dayOfWeek: DayOfWeek; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  subjectId: string;
  room?: string;
  type?: 'theory' | 'lab' | 'tutorial';
}

export interface AttendanceRecord {
  id: string;
  semesterId: string;
  subjectId: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  slotId?: string; // optional linked timetable slot
  time?: string; // e.g. "09:00"
  notes?: string;
  timestamp: number;
}

export interface AttendanceStats {
  attended: number;
  conducted: number;
  percentage: number;
  targetPercentage: number;
  status: 'safe' | 'warning' | 'danger';
  classesNeeded: number; // classes needed to attend consecutively to reach target%
  safeBunks: number; // safe classes you can miss without falling below target%
  nextClassAttendedPct: number;
  nextClassMissedPct: number;
}

export interface SubjectWithStats extends Subject {
  stats: AttendanceStats;
  totalPresent: number;
  totalAbsent: number;
  totalCancelled: number;
}
