import {
  AttendanceRecord,
  DayOfWeek,
  Semester,
  Subject,
  TimetableSlot,
} from '../types/attendance';
import { formatDateKey } from './calculator';

const STORAGE_KEYS = {
  SEMESTERS: 'attendsmart_semesters_v1',
  SUBJECTS: 'attendsmart_subjects_v1',
  TIMETABLE: 'attendsmart_timetable_v1',
  ATTENDANCE: 'attendsmart_records_v1',
  ACTIVE_SEM_ID: 'attendsmart_active_sem_v1',
};

// Full Master Directory of all MBBS Subjects across all years / profs
export interface MBBSSubjectPreset {
  code: string;
  name: string;
  prof: string;
  color: string;
  defaultRoom: string;
}

export const ALL_MBBS_SUBJECTS: MBBSSubjectPreset[] = [
  // 2nd Professional (2nd Year MBBS)
  { code: 'PATH201', name: 'Pathology (Theory)', prof: '2nd Prof (2nd Year)', color: 'rose', defaultRoom: 'Pathology LT' },
  { code: 'PATH201P', name: 'Pathology Practical / Histopathology', prof: '2nd Prof (2nd Year)', color: 'rose', defaultRoom: 'Histopathology Lab' },
  { code: 'PHARM201', name: 'Pharmacology (Theory)', prof: '2nd Prof (2nd Year)', color: 'emerald', defaultRoom: 'Pharmacology LT' },
  { code: 'PHARM201P', name: 'Pharmacology Practical & Dispensing', prof: '2nd Prof (2nd Year)', color: 'emerald', defaultRoom: 'Pharmacy Lab' },
  { code: 'MICRO201', name: 'Microbiology (Theory)', prof: '2nd Prof (2nd Year)', color: 'blue', defaultRoom: 'Microbiology LT' },
  { code: 'MICRO201P', name: 'Microbiology Practical & Bacteriology', prof: '2nd Prof (2nd Year)', color: 'blue', defaultRoom: 'Microbiology Lab' },
  { code: 'FMT201', name: 'Forensic Medicine & Toxicology (FMT)', prof: '2nd Prof (2nd Year)', color: 'amber', defaultRoom: 'FMT Dept' },
  { code: 'FMT201P', name: 'FMT Practical & Autopsy Postings', prof: '2nd Prof (2nd Year)', color: 'amber', defaultRoom: 'Mortuary / FMT Hall' },
  { code: 'PSM201', name: 'Community Medicine (PSM)', prof: '2nd Prof (2nd Year)', color: 'indigo', defaultRoom: 'PSM Lecture Hall' },
  { code: 'CLIN201', name: 'Clinical Postings / Hospital Wards', prof: '2nd Prof (2nd Year)', color: 'teal', defaultRoom: 'Civil Hospital Wards' },
  { code: 'PATH202', name: 'Systemic Pathology', prof: '2nd Prof (2nd Year)', color: 'rose', defaultRoom: 'Pathology LT' },
  { code: 'PHARM202', name: 'Systemic Pharmacology', prof: '2nd Prof (2nd Year)', color: 'emerald', defaultRoom: 'Pharmacology LT' },

  // 1st Professional (1st Year MBBS)
  { code: 'ANAT101', name: 'Human Anatomy (Theory)', prof: '1st Prof (1st Year)', color: 'rose', defaultRoom: 'Anatomy LT' },
  { code: 'ANAT101P', name: 'Anatomy Dissection & Histology', prof: '1st Prof (1st Year)', color: 'rose', defaultRoom: 'Dissection Hall' },
  { code: 'PHYS101', name: 'Physiology (Theory)', prof: '1st Prof (1st Year)', color: 'blue', defaultRoom: 'Physio LT' },
  { code: 'PHYS101P', name: 'Physiology Practical & Hematology', prof: '1st Prof (1st Year)', color: 'blue', defaultRoom: 'Physio Lab' },
  { code: 'BIOC101', name: 'Biochemistry (Theory)', prof: '1st Prof (1st Year)', color: 'amber', defaultRoom: 'Biochem LT' },
  { code: 'BIOC101P', name: 'Biochemistry Practical', prof: '1st Prof (1st Year)', color: 'amber', defaultRoom: 'Biochem Lab' },

  // 3rd Professional Part 1 (3rd Year MBBS)
  { code: 'OPHT301', name: 'Ophthalmology (Eye)', prof: '3rd Prof Part 1', color: 'emerald', defaultRoom: 'Eye OPD / LT' },
  { code: 'OPHT301C', name: 'Ophthalmology Clinical Posting', prof: '3rd Prof Part 1', color: 'emerald', defaultRoom: 'Eye Wards' },
  { code: 'ENT301', name: 'Otorhinolaryngology (ENT)', prof: '3rd Prof Part 1', color: 'teal', defaultRoom: 'ENT LT' },
  { code: 'ENT301C', name: 'ENT Clinical Posting', prof: '3rd Prof Part 1', color: 'teal', defaultRoom: 'ENT OPD' },
  { code: 'PSM301', name: 'Community Medicine (PSM Part 2)', prof: '3rd Prof Part 1', color: 'indigo', defaultRoom: 'PSM LH' },

  // Final Professional (Part 2)
  { code: 'MED401', name: 'General Medicine', prof: 'Final Prof', color: 'blue', defaultRoom: 'Medicine LT' },
  { code: 'MED401C', name: 'Medicine Clinical Postings', prof: 'Final Prof', color: 'blue', defaultRoom: 'Medicine Wards' },
  { code: 'SURG401', name: 'General Surgery', prof: 'Final Prof', color: 'rose', defaultRoom: 'Surgery LT' },
  { code: 'SURG401C', name: 'Surgery OT & Ward Postings', prof: 'Final Prof', color: 'rose', defaultRoom: 'Surgery OT' },
  { code: 'OBG401', name: 'Obstetrics & Gynaecology (OBGYN)', prof: 'Final Prof', color: 'violet', defaultRoom: 'OBG Ward / LT' },
  { code: 'PED401', name: 'Pediatrics & Neonatology', prof: 'Final Prof', color: 'emerald', defaultRoom: 'Pediatrics LH' },
  { code: 'ORTH401', name: 'Orthopedics & Trauma', prof: 'Final Prof', color: 'amber', defaultRoom: 'Ortho Ward' },
  { code: 'DERM401', name: 'Dermatology & Venereology', prof: 'Final Prof', color: 'teal', defaultRoom: 'Skin OPD' },
  { code: 'PSYC401', name: 'Psychiatry', prof: 'Final Prof', color: 'indigo', defaultRoom: 'Psychiatry OPD' },
  { code: 'RAD401', name: 'Radiodiagnosis', prof: 'Final Prof', color: 'slate', defaultRoom: 'Radiology Dept' },
  { code: 'ANES401', name: 'Anesthesiology & Critical Care', prof: 'Final Prof', color: 'blue', defaultRoom: 'OT Complex' },
  { code: 'EMER401', name: 'Emergency Medicine & Casualty', prof: 'Final Prof', color: 'rose', defaultRoom: 'Emergency Dept' },
];

// Seed initial default 2nd Year MBBS data
export function getInitialData(): {
  semesters: Semester[];
  subjects: Subject[];
  timetable: TimetableSlot[];
  records: AttendanceRecord[];
} {
  const sem3Id = 'sem-mbbs-3';
  const sem4Id = 'sem-mbbs-4';

  const semesters: Semester[] = [
    {
      id: sem3Id,
      name: '2nd Year MBBS - Term 1 (3rd Sem)',
      academicYear: '2024 - 2025',
      startDate: '2024-08-01',
      endDate: '2024-12-20',
      targetPercentage: 75,
      isCurrent: true,
      createdAt: new Date('2024-08-01').toISOString(),
    },
    {
      id: sem4Id,
      name: '2nd Year MBBS - Term 2 (4th Sem)',
      academicYear: '2024 - 2025',
      startDate: '2025-01-05',
      endDate: '2025-05-30',
      targetPercentage: 75,
      isCurrent: false,
      createdAt: new Date('2025-01-01').toISOString(),
    },
  ];

  const subjects: Subject[] = [
    // 2nd Year MBBS Subjects (Term 1)
    {
      id: 'sub-path-3',
      semesterId: sem3Id,
      code: 'PATH201',
      name: 'Pathology',
      teacher: 'Dr. R. K. Gupta',
      room: 'Pathology LT',
      color: 'rose',
      targetPercentage: 75,
      manualAttended: 24,
      manualConducted: 28,
    },
    {
      id: 'sub-pharm-3',
      semesterId: sem3Id,
      code: 'PHARM201',
      name: 'Pharmacology',
      teacher: 'Dr. Meenakshi Sundaram',
      room: 'Pharmacology LT',
      color: 'emerald',
      targetPercentage: 75,
      manualAttended: 22,
      manualConducted: 26,
    },
    {
      id: 'sub-micro-3',
      semesterId: sem3Id,
      code: 'MICRO201',
      name: 'Microbiology',
      teacher: 'Dr. Sandeep Mukherjee',
      room: 'Microbiology LT',
      color: 'blue',
      targetPercentage: 75,
      manualAttended: 20,
      manualConducted: 25,
    },
    {
      id: 'sub-fmt-3',
      semesterId: sem3Id,
      code: 'FMT201',
      name: 'Forensic Medicine & Toxicology (FMT)',
      teacher: 'Dr. Vivek Saxena',
      room: 'FMT Dept',
      color: 'amber',
      targetPercentage: 75,
      manualAttended: 14,
      manualConducted: 20, // Shortage to demonstrate bunker calculator
    },
    {
      id: 'sub-psm-3',
      semesterId: sem3Id,
      code: 'PSM201',
      name: 'Community Medicine (PSM)',
      teacher: 'Dr. Preeti Deshpande',
      room: 'PSM Lecture Hall',
      color: 'indigo',
      targetPercentage: 75,
      manualAttended: 18,
      manualConducted: 22,
    },
    {
      id: 'sub-clin-3',
      semesterId: sem3Id,
      code: 'CLIN201',
      name: 'Clinical Postings / Hospital Wards',
      teacher: 'Unit Chiefs (Med & Surg)',
      room: 'Hospital Wards',
      color: 'teal',
      targetPercentage: 75,
      manualAttended: 32,
      manualConducted: 35,
    },
    {
      id: 'sub-lab-3',
      semesterId: sem3Id,
      code: 'LAB201',
      name: 'Pathology & Microbiology Practicals',
      teacher: 'Dr. Gupta & Dr. Mukherjee',
      room: 'Histopathology Lab',
      color: 'violet',
      targetPercentage: 75,
      manualAttended: 15,
      manualConducted: 16,
    },

    // 2nd Year MBBS Subjects (Term 2)
    {
      id: 'sub-path-4',
      semesterId: sem4Id,
      code: 'PATH202',
      name: 'Systemic Pathology',
      teacher: 'Dr. R. K. Gupta',
      room: 'Pathology LT',
      color: 'rose',
      targetPercentage: 75,
      manualAttended: 0,
      manualConducted: 0,
    },
    {
      id: 'sub-pharm-4',
      semesterId: sem4Id,
      code: 'PHARM202',
      name: 'Systemic Pharmacology',
      teacher: 'Dr. Meenakshi Sundaram',
      room: 'Pharmacology LT',
      color: 'emerald',
      targetPercentage: 75,
      manualAttended: 0,
      manualConducted: 0,
    },
    {
      id: 'sub-micro-4',
      semesterId: sem4Id,
      code: 'MICRO202',
      name: 'Clinical Microbiology & Immunology',
      teacher: 'Dr. Sandeep Mukherjee',
      room: 'Microbiology LT',
      color: 'blue',
      targetPercentage: 75,
      manualAttended: 0,
      manualConducted: 0,
    },
    {
      id: 'sub-fmt-4',
      semesterId: sem4Id,
      code: 'FMT202',
      name: 'Medical Jurisprudence & Autopsy',
      teacher: 'Dr. Vivek Saxena',
      room: 'Mortuary / FMT Hall',
      color: 'amber',
      targetPercentage: 75,
      manualAttended: 0,
      manualConducted: 0,
    },
    {
      id: 'sub-clin-4',
      semesterId: sem4Id,
      code: 'CLIN202',
      name: 'Clinical Wards (OBGYN & Pediatrics)',
      teacher: 'Hospital Faculty',
      room: 'Clinical Wards',
      color: 'teal',
      targetPercentage: 75,
      manualAttended: 0,
      manualConducted: 0,
    },
  ];

  // MBBS 2nd Year Timetable (Hospital Clinical postings 09:00 - 12:00, Lectures 13:00 - 16:00)
  const timetable: TimetableSlot[] = [
    // Monday
    {
      id: 'slot-m1',
      semesterId: sem3Id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
      subjectId: 'sub-clin-3',
      room: 'Hospital Wards',
      type: 'lab',
    },
    {
      id: 'slot-m2',
      semesterId: sem3Id,
      dayOfWeek: 1,
      startTime: '13:00',
      endTime: '14:00',
      subjectId: 'sub-path-3',
      room: 'Pathology LT',
      type: 'theory',
    },
    {
      id: 'slot-m3',
      semesterId: sem3Id,
      dayOfWeek: 1,
      startTime: '14:00',
      endTime: '15:00',
      subjectId: 'sub-pharm-3',
      room: 'Pharmacology LT',
      type: 'theory',
    },

    // Tuesday
    {
      id: 'slot-t1',
      semesterId: sem3Id,
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '12:00',
      subjectId: 'sub-clin-3',
      room: 'Hospital Wards',
      type: 'lab',
    },
    {
      id: 'slot-t2',
      semesterId: sem3Id,
      dayOfWeek: 2,
      startTime: '13:00',
      endTime: '14:00',
      subjectId: 'sub-micro-3',
      room: 'Microbiology LT',
      type: 'theory',
    },
    {
      id: 'slot-t3',
      semesterId: sem3Id,
      dayOfWeek: 2,
      startTime: '14:00',
      endTime: '15:00',
      subjectId: 'sub-fmt-3',
      room: 'FMT Dept',
      type: 'theory',
    },

    // Wednesday
    {
      id: 'slot-w1',
      semesterId: sem3Id,
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '12:00',
      subjectId: 'sub-clin-3',
      room: 'Hospital Wards',
      type: 'lab',
    },
    {
      id: 'slot-w2',
      semesterId: sem3Id,
      dayOfWeek: 3,
      startTime: '13:00',
      endTime: '14:00',
      subjectId: 'sub-psm-3',
      room: 'PSM Lecture Hall',
      type: 'theory',
    },
    {
      id: 'slot-w3',
      semesterId: sem3Id,
      dayOfWeek: 3,
      startTime: '14:00',
      endTime: '16:00',
      subjectId: 'sub-lab-3',
      room: 'Histopathology Lab',
      type: 'lab',
    },

    // Thursday
    {
      id: 'slot-th1',
      semesterId: sem3Id,
      dayOfWeek: 4,
      startTime: '09:00',
      endTime: '12:00',
      subjectId: 'sub-clin-3',
      room: 'Hospital Wards',
      type: 'lab',
    },
    {
      id: 'slot-th2',
      semesterId: sem3Id,
      dayOfWeek: 4,
      startTime: '13:00',
      endTime: '14:00',
      subjectId: 'sub-path-3',
      room: 'Pathology LT',
      type: 'theory',
    },
    {
      id: 'slot-th3',
      semesterId: sem3Id,
      dayOfWeek: 4,
      startTime: '14:00',
      endTime: '15:00',
      subjectId: 'sub-pharm-3',
      room: 'Pharmacology LT',
      type: 'theory',
    },

    // Friday
    {
      id: 'slot-f1',
      semesterId: sem3Id,
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '12:00',
      subjectId: 'sub-clin-3',
      room: 'Hospital Wards',
      type: 'lab',
    },
    {
      id: 'slot-f2',
      semesterId: sem3Id,
      dayOfWeek: 5,
      startTime: '13:00',
      endTime: '14:00',
      subjectId: 'sub-micro-3',
      room: 'Microbiology LT',
      type: 'theory',
    },
    {
      id: 'slot-f3',
      semesterId: sem3Id,
      dayOfWeek: 5,
      startTime: '14:00',
      endTime: '15:00',
      subjectId: 'sub-psm-3',
      room: 'PSM Lecture Hall',
      type: 'theory',
    },

    // Saturday
    {
      id: 'slot-s1',
      semesterId: sem3Id,
      dayOfWeek: 6,
      startTime: '09:00',
      endTime: '11:00',
      subjectId: 'sub-fmt-3',
      room: 'FMT Hall',
      type: 'tutorial',
    },
  ];

  // Seed sample attendance records
  const today = new Date();
  const records: AttendanceRecord[] = [];

  for (let offset = 0; offset <= 3; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const dateStr = formatDateKey(d);
    const dayOfWeek = d.getDay() as DayOfWeek;

    const daySlots = timetable.filter(
      (slot) => slot.semesterId === sem3Id && slot.dayOfWeek === dayOfWeek
    );

    daySlots.forEach((slot, idx) => {
      const status =
        offset === 0
          ? 'present'
          : (offset + idx) % 5 === 0
          ? 'absent'
          : (offset + idx) % 7 === 0
          ? 'cancelled'
          : 'present';

      records.push({
        id: `rec-${dateStr}-${slot.id}`,
        semesterId: sem3Id,
        subjectId: slot.subjectId,
        date: dateStr,
        status,
        slotId: slot.id,
        time: slot.startTime,
        timestamp: d.getTime(),
      });
    });
  }

  return {
    semesters,
    subjects,
    timetable,
    records,
  };
}

export function loadStoredData() {
  try {
    const rawSemesters = localStorage.getItem(STORAGE_KEYS.SEMESTERS);
    const rawSubjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    const rawTimetable = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
    const rawRecords = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const activeSemId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SEM_ID);

    if (rawSemesters && rawSubjects && rawTimetable && rawRecords) {
      return {
        semesters: JSON.parse(rawSemesters) as Semester[],
        subjects: JSON.parse(rawSubjects) as Subject[],
        timetable: JSON.parse(rawTimetable) as TimetableSlot[],
        records: JSON.parse(rawRecords) as AttendanceRecord[],
        activeSemId: activeSemId || null,
      };
    }
  } catch (err) {
    console.error('Failed to load attendance storage', err);
  }

  const initial = getInitialData();
  saveStoredData(initial.semesters, initial.subjects, initial.timetable, initial.records);
  return {
    ...initial,
    activeSemId: initial.semesters[0]?.id || null,
  };
}

export function saveStoredData(
  semesters: Semester[],
  subjects: Subject[],
  timetable: TimetableSlot[],
  records: AttendanceRecord[],
  activeSemId?: string
) {
  try {
    localStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(semesters));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    if (activeSemId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SEM_ID, activeSemId);
    }
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

export function exportBackupJSON(
  semesters: Semester[],
  subjects: Subject[],
  timetable: TimetableSlot[],
  records: AttendanceRecord[]
): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      semesters,
      subjects,
      timetable,
      records,
    },
    null,
    2
  );
}
