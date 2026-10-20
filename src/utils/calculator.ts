import { AttendanceRecord, AttendanceStats, Subject, SubjectWithStats } from '../types/attendance';

/**
 * Calculates attendance statistics for a given attended & conducted count and target percentage.
 */
export function calculateAttendanceStats(
  attended: number,
  conducted: number,
  targetPercentage: number = 75
): AttendanceStats {
  const safeTarget = Math.max(1, Math.min(99, targetPercentage));
  
  if (conducted === 0) {
    return {
      attended: 0,
      conducted: 0,
      percentage: 100,
      targetPercentage: safeTarget,
      status: 'safe',
      classesNeeded: 0,
      safeBunks: 0,
      nextClassAttendedPct: 100,
      nextClassMissedPct: 0,
    };
  }

  const rawPercentage = (attended / conducted) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;

  let classesNeeded = 0;
  let safeBunks = 0;

  if (rawPercentage < safeTarget) {
    // Need more classes to reach target%
    // (attended + X) / (conducted + X) >= safeTarget / 100
    // 100*(attended + X) >= safeTarget * (conducted + X)
    // (100 - safeTarget) * X >= (safeTarget * conducted) - (100 * attended)
    const numerator = safeTarget * conducted - 100 * attended;
    const denominator = 100 - safeTarget;
    classesNeeded = Math.max(1, Math.ceil(numerator / denominator));
    safeBunks = 0;
  } else {
    // Above or equal to target%: how many can be bunked?
    // attended / (conducted + Y) >= safeTarget / 100
    // 100 * attended >= safeTarget * (conducted + Y)
    // safeTarget * Y <= 100 * attended - safeTarget * conducted
    const numerator = 100 * attended - safeTarget * conducted;
    safeBunks = Math.max(0, Math.floor(numerator / safeTarget));
    classesNeeded = 0;
  }

  // Next class projected impacts
  const nextClassAttendedPct = Math.round(((attended + 1) / (conducted + 1)) * 1000) / 10;
  const nextClassMissedPct = Math.round((attended / (conducted + 1)) * 1000) / 10;

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (percentage < safeTarget) {
    status = percentage < safeTarget - 10 ? 'danger' : 'warning';
  } else if (safeBunks === 0) {
    status = 'warning';
  }

  return {
    attended,
    conducted,
    percentage,
    targetPercentage: safeTarget,
    status,
    classesNeeded,
    safeBunks,
    nextClassAttendedPct,
    nextClassMissedPct,
  };
}

/**
 * Computes stats for each subject given all records for the active semester
 */
export function getSubjectStats(
  subjects: Subject[],
  records: AttendanceRecord[],
  defaultTargetPct: number = 75
): SubjectWithStats[] {
  return subjects.map((subj) => {
    const subjRecords = records.filter((r) => r.subjectId === subj.id);
    let presentCount = 0;
    let absentCount = 0;
    let cancelledCount = 0;

    for (const r of subjRecords) {
      if (r.status === 'present') presentCount++;
      else if (r.status === 'absent') absentCount++;
      else if (r.status === 'cancelled') cancelledCount++;
    }

    const totalAttended = presentCount + (subj.manualAttended || 0);
    const totalConducted = presentCount + absentCount + (subj.manualConducted || 0);
    const target = subj.targetPercentage || defaultTargetPct;

    const stats = calculateAttendanceStats(totalAttended, totalConducted, target);

    return {
      ...subj,
      stats,
      totalPresent: presentCount,
      totalAbsent: absentCount,
      totalCancelled: cancelledCount,
    };
  });
}

/**
 * Computes overall aggregated semester statistics
 */
export function getOverallStats(
  subjectsWithStats: SubjectWithStats[],
  targetPct: number = 75
): AttendanceStats {
  let totalAttended = 0;
  let totalConducted = 0;

  for (const s of subjectsWithStats) {
    totalAttended += s.stats.attended;
    totalConducted += s.stats.conducted;
  }

  return calculateAttendanceStats(totalAttended, totalConducted, targetPct);
}

/**
 * Formats date into YYYY-MM-DD local format
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date for display, e.g. "Tuesday, 20 Oct 2026"
 */
export function formatDisplayDate(dateKey: string): string {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Day name from day number (0..6)
 */
export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
