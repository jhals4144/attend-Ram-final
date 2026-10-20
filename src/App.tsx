import React, { useEffect, useState } from 'react';
import {
  AttendanceRecord,
  AttendanceStatus,
  DayOfWeek,
  Semester,
  Subject,
  TimetableSlot,
} from './types/attendance';
import {
  getInitialData,
  loadStoredData,
  saveStoredData,
} from './utils/storage';
import {
  getOverallStats,
  getSubjectStats,
} from './utils/calculator';
import { Header } from './components/Header';
import { TodayAttendance } from './components/TodayAttendance';
import { SubjectList } from './components/SubjectList';
import { SemesterCombinedReport } from './components/SemesterCombinedReport';
import { AllSemestersCompiledView } from './components/AllSemestersCompiledView';
import { BunkCalculator } from './components/BunkCalculator';
import { TimetableEditor } from './components/TimetableEditor';
import { HistoryCalendar } from './components/HistoryCalendar';
import { SemesterManagerModal } from './components/SemesterManagerModal';
import { DataBackupModal } from './components/DataBackupModal';
import { ShareScheduleModal } from './components/ShareScheduleModal';
import { PhotoTimetableScannerModal } from './components/PhotoTimetableScannerModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  CalendarCheck,
  BookOpen,
  BarChart3,
  Calculator,
  Calendar,
  History,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [activeTab, setActiveTab] = useState<
    'today' | 'subjects' | 'combined' | 'all-semesters' | 'calculator' | 'timetable' | 'history'
  >('today');

  // Modals
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Initialize data from local storage & check URL query params for shared schedule
  useEffect(() => {
    const data = loadStoredData();
    setSemesters(data.semesters);
    setActiveSemesterId(data.activeSemId || data.semesters[0]?.id || null);
    setSubjects(data.subjects);
    setTimetable(data.timetable);
    setRecords(data.records);
    setIsLoaded(true);

    // If URL has ?import_sched=... auto open share modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('import_sched')) {
      setIsShareModalOpen(true);
    }
  }, []);

  // Save to local storage whenever data changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveStoredData(
        semesters,
        subjects,
        timetable,
        records,
        activeSemesterId || undefined
      );
    }
  }, [semesters, subjects, timetable, records, activeSemesterId, isLoaded]);

  // Active semester
  const activeSemester =
    semesters.find((s) => s.id === activeSemesterId) || semesters[0] || null;

  // Active semester subjects
  const currentSemesterSubjects = activeSemester
    ? subjects.filter((s) => s.semesterId === activeSemester.id)
    : [];

  // Active semester records
  const currentSemesterRecords = activeSemester
    ? records.filter((r) => r.semesterId === activeSemester.id)
    : [];

  // Calculate stats
  const subjectsWithStats = getSubjectStats(
    currentSemesterSubjects,
    currentSemesterRecords,
    activeSemester?.targetPercentage || 75
  );

  const overallStats = getOverallStats(
    subjectsWithStats,
    activeSemester?.targetPercentage || 75
  );

  // Handlers for Attendance
  const handleMarkAttendance = (
    subjectId: string,
    date: string,
    status: AttendanceStatus,
    slotId?: string,
    time?: string,
    notes?: string
  ) => {
    if (!activeSemester) return;

    setRecords((prev) => {
      const existingIndex = prev.findIndex((r) => {
        if (r.semesterId !== activeSemester.id || r.date !== date) return false;
        if (slotId && r.slotId) return r.slotId === slotId;
        return r.subjectId === subjectId && r.time === time;
      });

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status,
          notes: notes !== undefined ? notes : updated[existingIndex].notes,
          timestamp: Date.now(),
        };
        return updated;
      }

      const newRecord: AttendanceRecord = {
        id: `rec-${date}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        semesterId: activeSemester.id,
        subjectId,
        date,
        status,
        slotId,
        time,
        notes,
        timestamp: Date.now(),
      };
      return [...prev, newRecord];
    });
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  const handleUpdateRecordStatus = (
    recordId: string,
    newStatus: AttendanceStatus,
    notes?: string
  ) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: newStatus,
              notes: notes !== undefined ? notes : r.notes,
              timestamp: Date.now(),
            }
          : r
      )
    );
  };

  const handleAddExtraClass = (
    subjectId: string,
    date: string,
    time: string,
    status: AttendanceStatus,
    notes?: string
  ) => {
    if (!activeSemester) return;
    const newRecord: AttendanceRecord = {
      id: `extra-${date}-${Date.now()}`,
      semesterId: activeSemester.id,
      subjectId,
      date,
      status,
      time,
      notes,
      timestamp: Date.now(),
    };
    setRecords((prev) => [...prev, newRecord]);
  };

  // Handlers for Subjects
  const handleAddSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSub: Subject = {
      ...subjectData,
      id: `sub-${Date.now()}`,
    };
    setSubjects((prev) => [...prev, newSub]);
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === updatedSubject.id ? updatedSubject : s))
    );
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    setTimetable((prev) => prev.filter((t) => t.subjectId !== subjectId));
    setRecords((prev) => prev.filter((r) => r.subjectId !== subjectId));
  };

  const handleQuickAdjust = (
    subjectId: string,
    attendedDelta: number,
    conductedDelta: number
  ) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              manualAttended: Math.max(0, s.manualAttended + attendedDelta),
              manualConducted: Math.max(0, s.manualConducted + conductedDelta),
            }
          : s
      )
    );
  };

  // Handlers for Timetable
  const handleAddSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}`,
    };
    setTimetable((prev) => [...prev, newSlot]);
  };

  const handleUpdateSlot = (updatedSlot: TimetableSlot) => {
    setTimetable((prev) =>
      prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s))
    );
  };

  const handleDeleteSlot = (slotId: string) => {
    setTimetable((prev) => prev.filter((s) => s.id !== slotId));
  };

  const handleCopyDaySchedule = (fromDay: DayOfWeek, toDay: DayOfWeek) => {
    if (!activeSemester) return;
    const sourceSlots = timetable.filter(
      (s) => s.semesterId === activeSemester.id && s.dayOfWeek === fromDay
    );

    const otherSlots = timetable.filter(
      (s) => !(s.semesterId === activeSemester.id && s.dayOfWeek === toDay)
    );

    const clonedSlots: TimetableSlot[] = sourceSlots.map((s) => ({
      ...s,
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dayOfWeek: toDay,
    }));

    setTimetable([...otherSlots, ...clonedSlots]);
  };

  // Handlers for Semesters
  const handleSelectSemester = (semId: string) => {
    setActiveSemesterId(semId);
  };

  const handleAddSemester = (
    newSemesterData: Omit<Semester, 'id' | 'createdAt'>,
    duplicateSubjectsFromId?: string
  ) => {
    const newSemId = `sem-${Date.now()}`;
    const newSem: Semester = {
      ...newSemesterData,
      id: newSemId,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };

    setSemesters((prev) => [...prev, newSem]);
    setActiveSemesterId(newSemId);

    if (duplicateSubjectsFromId) {
      const srcSubjects = subjects.filter(
        (s) => s.semesterId === duplicateSubjectsFromId
      );
      const clonedSubjects: Subject[] = srcSubjects.map((s) => ({
        ...s,
        id: `sub-${newSemId}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        semesterId: newSemId,
        manualAttended: 0,
        manualConducted: 0,
      }));
      setSubjects((prev) => [...prev, ...clonedSubjects]);
    }
  };

  const handleUpdateSemester = (updatedSemester: Semester) => {
    setSemesters((prev) =>
      prev.map((s) => (s.id === updatedSemester.id ? updatedSemester : s))
    );
  };

  const handleDeleteSemester = (semId: string) => {
    if (semesters.length <= 1) return;
    setSemesters((prev) => prev.filter((s) => s.id !== semId));
    setSubjects((prev) => prev.filter((s) => s.semesterId !== semId));
    setTimetable((prev) => prev.filter((t) => t.semesterId !== semId));
    setRecords((prev) => prev.filter((r) => r.semesterId !== semId));

    if (activeSemesterId === semId) {
      const remaining = semesters.filter((s) => s.id !== semId);
      setActiveSemesterId(remaining[0]?.id || null);
    }
  };

  const handleUpdateSemesterTarget = (newTarget: number) => {
    if (!activeSemester) return;
    handleUpdateSemester({
      ...activeSemester,
      targetPercentage: newTarget,
    });
  };

  // Import Shared Schedule (from another device)
  const handleImportSharedSchedule = (
    targetSemesterId: string,
    importedSubjects: Subject[],
    importedSlots: TimetableSlot[]
  ) => {
    setSubjects((prev) => [...prev, ...importedSubjects]);
    setTimetable((prev) => [...prev, ...importedSlots]);
    setActiveSemesterId(targetSemesterId);
  };

  // Import Extracted Timetable from Photo
  const handleImportExtractedTimetable = (
    newSubjectsData: Omit<Subject, 'id'>[],
    newSlotsData: Omit<TimetableSlot, 'id'>[]
  ) => {
    if (!activeSemester) return;

    const createdSubjects: Subject[] = [];
    const nameToIdMap = new Map<string, string>();

    // First check existing subjects in active semester
    currentSemesterSubjects.forEach((s) => {
      nameToIdMap.set(s.name.toLowerCase().trim(), s.id);
    });

    // Create new subjects that don't exist yet
    newSubjectsData.forEach((subData) => {
      const key = subData.name.toLowerCase().trim();
      if (!nameToIdMap.has(key)) {
        const newSub: Subject = {
          ...subData,
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        };
        createdSubjects.push(newSub);
        nameToIdMap.set(key, newSub.id);
      }
    });

    // Create slots mapped to subject IDs
    const createdSlots: TimetableSlot[] = newSlotsData.map((slotData) => ({
      ...slotData,
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId: nameToIdMap.get(slotData.subjectId) || createdSubjects[0]?.id || 'unknown',
    }));

    setSubjects((prev) => [...prev, ...createdSubjects]);
    setTimetable((prev) => [...prev, ...createdSlots]);
  };

  // Backup & Import Data
  const handleImportData = (data: {
    semesters: Semester[];
    subjects: Subject[];
    timetable: TimetableSlot[];
    records: AttendanceRecord[];
  }) => {
    setSemesters(data.semesters);
    setActiveSemesterId(data.semesters[0]?.id || null);
    setSubjects(data.subjects);
    setTimetable(data.timetable);
    setRecords(data.records);
  };

  const handleResetData = () => {
    const initial = getInitialData();
    setSemesters(initial.semesters);
    setActiveSemesterId(initial.semesters[0]?.id || null);
    setSubjects(initial.subjects);
    setTimetable(initial.timetable);
    setRecords(initial.records);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Loading AttendSmart 2nd Year Tracker...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-20 md:pb-8">
      {/* Universal Top Bar */}
      <Header
        semesters={semesters}
        activeSemester={activeSemester}
        overallStats={overallStats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSemesterModal={() => setIsSemesterModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Active Tab View */}
        {activeTab === 'today' && (
          <TodayAttendance
            activeSemester={activeSemester}
            subjects={currentSemesterSubjects}
            timetable={timetable}
            records={records}
            onMarkAttendance={handleMarkAttendance}
            onDeleteRecord={handleDeleteRecord}
            onAddExtraClass={handleAddExtraClass}
            onOpenUploadSchedule={() => setIsPhotoModalOpen(true)}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectList
            activeSemester={activeSemester}
            subjectsWithStats={subjectsWithStats}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onQuickAdjust={handleQuickAdjust}
          />
        )}

        {activeTab === 'combined' && (
          <SemesterCombinedReport
            semesters={semesters}
            activeSemesterId={activeSemesterId}
            onSelectSemester={handleSelectSemester}
            subjects={subjects}
            records={records}
          />
        )}

        {activeTab === 'all-semesters' && (
          <AllSemestersCompiledView
            semesters={semesters}
            subjects={subjects}
            records={records}
            timetable={timetable}
            onSelectSemester={handleSelectSemester}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'calculator' && (
          <BunkCalculator
            activeSemester={activeSemester}
            subjectsWithStats={subjectsWithStats}
            onUpdateSemesterTarget={handleUpdateSemesterTarget}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableEditor
            activeSemester={activeSemester}
            subjects={currentSemesterSubjects}
            timetable={timetable}
            onAddSlot={handleAddSlot}
            onUpdateSlot={handleUpdateSlot}
            onDeleteSlot={handleDeleteSlot}
            onCopyDaySchedule={handleCopyDaySchedule}
            onOpenScanPhoto={() => setIsPhotoModalOpen(true)}
            onOpenShare={() => setIsShareModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryCalendar
            activeSemester={activeSemester}
            subjects={currentSemesterSubjects}
            records={records}
            onUpdateRecordStatus={handleUpdateRecordStatus}
            onDeleteRecord={handleDeleteRecord}
            onJumpToDay={(dateStr) => {
              setActiveTab('today');
            }}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb-Ergonomic Destinations) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="grid grid-cols-6 items-center h-16 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'today' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span className="text-[9px] tracking-tight mt-1">Today</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'subjects' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[9px] tracking-tight mt-1">Subjects</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all-semesters')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'all-semesters' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span className="text-[9px] tracking-tight mt-1 font-semibold">All Sem</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'calculator' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="text-[9px] tracking-tight mt-1">Bunk Calc</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'timetable' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[9px] tracking-tight mt-1">Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'history' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="text-[9px] tracking-tight mt-1">Calendar</span>
          </button>
        </div>
      </nav>

      {/* Floating Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Semester Manager Modal */}
      <SemesterManagerModal
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        semesters={semesters}
        activeSemesterId={activeSemesterId}
        onSelectSemester={handleSelectSemester}
        onAddSemester={handleAddSemester}
        onUpdateSemester={handleUpdateSemester}
        onDeleteSemester={handleDeleteSemester}
      />

      {/* Share Schedule Modal */}
      <ShareScheduleModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        semesters={semesters}
        activeSemesterId={activeSemesterId}
        subjects={subjects}
        timetable={timetable}
        onImportSharedSchedule={handleImportSharedSchedule}
      />

      {/* Photo Timetable Scanner Modal */}
      <PhotoTimetableScannerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        activeSemester={activeSemester}
        onImportExtractedTimetable={handleImportExtractedTimetable}
      />

      {/* Backup & Import Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        semesters={semesters}
        subjects={subjects}
        timetable={timetable}
        records={records}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />
    </div>
  );
}
