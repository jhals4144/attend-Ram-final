import React, { useState } from 'react';
import { Semester, Subject, AttendanceRecord, SubjectWithStats } from '../types/attendance';
import { getSubjectStats, getOverallStats, calculateAttendanceStats } from '../utils/calculator';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Printer,
  Calendar,
  Sparkles,
  HelpCircle,
  Layers,
  Flame,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface SemesterCombinedReportProps {
  semesters: Semester[];
  activeSemesterId: string | null;
  onSelectSemester: (semId: string) => void;
  subjects: Subject[];
  records: AttendanceRecord[];
}

export const SemesterCombinedReport: React.FC<SemesterCombinedReportProps> = ({
  semesters,
  activeSemesterId,
  onSelectSemester,
  subjects,
  records,
}) => {
  const [selectedSemId, setSelectedSemId] = useState<string>(
    activeSemesterId || semesters[0]?.id || ''
  );
  const [customTarget, setCustomTarget] = useState<number>(75);
  const [sortBy, setSortBy] = useState<'lowest' | 'highest' | 'bunks' | 'name'>('lowest');
  const [simulatedClasses, setSimulatedClasses] = useState<{ [subjectId: string]: number }>({});

  const currentSemester =
    semesters.find((s) => s.id === selectedSemId) || semesters[0] || null;

  if (!currentSemester) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        No semester found. Please create a semester first.
      </div>
    );
  }

  // Filter subjects and records for the selected semester
  const semSubjects = subjects.filter((s) => s.semesterId === currentSemester.id);
  const semRecords = records.filter((r) => r.semesterId === currentSemester.id);

  // Calculate subject stats
  const subjectsWithStats = getSubjectStats(semSubjects, semRecords, customTarget);
  const overallStats = getOverallStats(subjectsWithStats, customTarget);

  // Sorting
  const sortedSubjects = [...subjectsWithStats].sort((a, b) => {
    if (sortBy === 'lowest') return a.stats.percentage - b.stats.percentage;
    if (sortBy === 'highest') return b.stats.percentage - a.stats.percentage;
    if (sortBy === 'bunks') return b.stats.safeBunks - a.stats.safeBunks;
    return a.name.localeCompare(b.name);
  });

  const shortageCount = subjectsWithStats.filter((s) => s.stats.percentage < customTarget).length;
  const safeCount = subjectsWithStats.filter((s) => s.stats.percentage >= customTarget).length;
  const totalSafeBunks = subjectsWithStats.reduce((sum, s) => sum + s.stats.safeBunks, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateChange = (subjectId: string, delta: number) => {
    setSimulatedClasses((prev) => ({
      ...prev,
      [subjectId]: Math.max(0, (prev[subjectId] || 0) + delta),
    }));
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Top Controls & Semester Switcher Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 print:border-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-900 text-white print:hidden">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Semester Attendance Report
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject-wise attendance & safe bunks for {currentSemester.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Semester Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedSemId}
                onChange={(e) => {
                  setSelectedSemId(e.target.value);
                  onSelectSemester(e.target.value);
                }}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 print:hidden"
              title="Print attendance report sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Target Slider & Quick Chips */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Target Attendance %:</span>
            {[65, 75, 80, 85].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCustomTarget(preset)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md border transition-colors ${
                  customTarget === preset
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Custom:</span>
            <input
              type="range"
              min="50"
              max="95"
              value={customTarget}
              onChange={(e) => setCustomTarget(Number(e.target.value))}
              className="w-24 accent-slate-900 cursor-pointer h-1.5 bg-slate-100 rounded"
            />
            <span className="text-xs font-mono font-bold text-slate-800 w-8">{customTarget}%</span>
          </div>
        </div>
      </div>

      {/* Aggregate Semester Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Combined Attendance</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                overallStats.percentage >= customTarget ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {overallStats.percentage}%
            </span>
            <span className="text-xs text-slate-400">
              ({overallStats.attended}/{overallStats.conducted})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {overallStats.percentage >= customTarget
              ? 'Above target threshold'
              : 'Action required to avoid debarment'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Total Subjects</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {semSubjects.length}
            </span>
            <span className="text-xs text-slate-400">courses in {currentSemester.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="text-emerald-700 font-semibold">{safeCount} Safe</span>
            <span>·</span>
            <span className="text-rose-700 font-semibold">{shortageCount} Shortage</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Cumulative Safe Bunks</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">
              {totalSafeBunks}
            </span>
            <span className="text-xs text-slate-500">classes across subjects</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Sum of bunks you can skip safely
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Debarred / At Risk</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono ${
                shortageCount > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {shortageCount}
            </span>
            <span className="text-xs text-slate-400">below {customTarget}%</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {shortageCount === 0
              ? '100% Eligible for End-Sem Exams'
              : 'Catch-up classes required immediately'}
          </span>
        </div>
      </div>

      {/* Sorting & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-800">
          Subject-Wise Combined Breakdown & Inline Bunk Calculator
        </h3>

        <div className="flex items-center gap-2 print:hidden">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-medium border border-slate-200 bg-white rounded-lg p-1 text-slate-700"
          >
            <option value="lowest">Lowest Attendance (Priority)</option>
            <option value="highest">Highest Attendance</option>
            <option value="bunks">Most Safe Bunks</option>
            <option value="name">Subject Name</option>
          </select>
        </div>
      </div>

      {/* Subject Cards with Inline Bunk & Goal Calculations */}
      {sortedSubjects.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No subjects in this semester yet.</p>
          <p className="text-xs text-slate-500 mt-1">
            Add subjects or import a timetable to see combined attendance calculations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedSubjects.map((subj) => {
            const isSafe = subj.stats.percentage >= customTarget;
            const extraSim = simulatedClasses[subj.id] || 0;

            // Simulated calculation if user adds simulated classes
            const simAttended = subj.stats.attended + extraSim;
            const simConducted = subj.stats.conducted + extraSim;
            const simStats = calculateAttendanceStats(simAttended, simConducted, customTarget);

            return (
              <div
                key={subj.id}
                className={`bg-white rounded-xl border p-4.5 transition-all flex flex-col justify-between ${
                  isSafe
                    ? 'border-slate-200 hover:border-emerald-300'
                    : 'border-rose-200 bg-rose-50/10 hover:border-rose-300'
                }`}
              >
                <div>
                  {/* Subject Title & Stats Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {subj.code}
                        </span>
                        {(subj.teacher || subj.room) && (
                          <span className="text-xs text-slate-400">
                            {subj.teacher || subj.room}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{subj.name}</h4>
                    </div>

                    <div
                      className={`text-right shrink-0 px-2.5 py-1 rounded-lg border ${
                        isSafe
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <span className="text-xl font-bold font-mono tabular-nums block leading-none">
                        {subj.stats.percentage}%
                      </span>
                      <span className="text-[10px] font-semibold uppercase mt-0.5 block">
                        {isSafe ? 'Eligible' : 'Shortage'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Class Counts */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Attended: <strong className="font-mono text-slate-900">{subj.stats.attended}</strong> / {subj.stats.conducted}
                      </span>
                      <span className="text-slate-400">
                        {subj.stats.conducted - subj.stats.attended} missed
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, subj.stats.percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bunk / Attendance Requirement Box */}
                  <div
                    className={`mt-3.5 p-3 rounded-lg border text-xs leading-relaxed ${
                      isSafe
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}
                  >
                    {isSafe ? (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span>
                            Safe to bunk! You can miss up to{' '}
                            <strong className="font-mono font-bold text-emerald-700 text-sm">
                              {subj.stats.safeBunks}
                            </strong>{' '}
                            {subj.stats.safeBunks === 1 ? 'class' : 'classes'} and still maintain at
                            least {customTarget}%.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span>
                            Attendance deficit! You must attend the next{' '}
                            <strong className="font-mono font-bold text-rose-700 text-sm underline">
                              {subj.stats.classesNeeded}
                            </strong>{' '}
                            consecutive {subj.stats.classesNeeded === 1 ? 'class' : 'classes'} without
                            missing any to touch {customTarget}%.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inline Simulator / Projection */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500 print:hidden">
                    <div className="flex items-center gap-1.5">
                      <span>What if attend:</span>
                      <button
                        type="button"
                        onClick={() => handleSimulateChange(subj.id, 1)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-semibold"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateChange(subj.id, 3)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-semibold"
                      >
                        +3
                      </button>
                      {extraSim > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSimulatedClasses((prev) => ({ ...prev, [subj.id]: 0 }))
                          }
                          className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {extraSim > 0 && (
                      <span className="font-mono text-emerald-700 font-bold">
                        +{extraSim} class &rarr; {simStats.percentage}%
                      </span>
                    )}

                    {extraSim === 0 && (
                      <span className="text-[11px] font-mono text-slate-400">
                        Next: +1={subj.stats.nextClassAttendedPct}% / -1={subj.stats.nextClassMissedPct}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
