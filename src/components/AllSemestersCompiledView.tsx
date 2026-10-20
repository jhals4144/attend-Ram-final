import React, { useState } from 'react';
import { Semester, Subject, AttendanceRecord, SubjectWithStats } from '../types/attendance';
import { getSubjectStats, calculateAttendanceStats } from '../utils/calculator';
import { exportBackupJSON } from '../utils/storage';
import {
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Search,
  Filter,
  HardDrive,
  TrendingUp,
  Sliders,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface AllSemestersCompiledViewProps {
  semesters: Semester[];
  subjects: Subject[];
  records: AttendanceRecord[];
  timetable: any[];
  onSelectSemester: (semId: string) => void;
  onNavigateToTab: (tab: 'today' | 'subjects' | 'calculator' | 'timetable' | 'history' | 'combined') => void;
}

export const AllSemestersCompiledView: React.FC<AllSemestersCompiledViewProps> = ({
  semesters,
  subjects,
  records,
  timetable,
  onSelectSemester,
  onNavigateToTab,
}) => {
  const [targetPct, setTargetPct] = useState<number>(75);
  const [filterSemesterId, setFilterSemesterId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'shortage'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [simYearAttendMore, setSimYearAttendMore] = useState<number>(0);

  // Compute stats for each semester individually
  const semesterSummaries = semesters.map((sem) => {
    const semSubjects = subjects.filter((s) => s.semesterId === sem.id);
    const semRecords = records.filter((r) => r.semesterId === sem.id);
    const withStats = getSubjectStats(semSubjects, semRecords, targetPct);

    let attended = 0;
    let conducted = 0;
    let safeBunks = 0;
    let shortageSubjects = 0;

    withStats.forEach((s) => {
      attended += s.stats.attended;
      conducted += s.stats.conducted;
      safeBunks += s.stats.safeBunks;
      if (s.stats.percentage < targetPct) shortageSubjects++;
    });

    const percentage = conducted > 0 ? Math.round((attended / conducted) * 1000) / 10 : 100;

    return {
      semester: sem,
      subjects: withStats,
      attended,
      conducted,
      percentage,
      safeBunks,
      shortageSubjects,
    };
  });

  // Compiled Grand Totals across ALL semesters
  let grandTotalAttended = 0;
  let grandTotalConducted = 0;
  let grandTotalSafeBunks = 0;
  let grandTotalShortages = 0;

  // Flatten all subjects with their semester metadata
  interface CompiledSubjectItem extends SubjectWithStats {
    semesterName: string;
    academicYear: string;
  }

  const allCompiledSubjects: CompiledSubjectItem[] = [];

  semesterSummaries.forEach((summary) => {
    grandTotalAttended += summary.attended;
    grandTotalConducted += summary.conducted;
    grandTotalSafeBunks += summary.safeBunks;
    grandTotalShortages += summary.shortageSubjects;

    summary.subjects.forEach((sub) => {
      allCompiledSubjects.push({
        ...sub,
        semesterName: summary.semester.name,
        academicYear: summary.semester.academicYear,
      });
    });
  });

  const grandOverallPercentage =
    grandTotalConducted > 0
      ? Math.round((grandTotalAttended / grandTotalConducted) * 1000) / 10
      : 100;

  const grandOverallStats = calculateAttendanceStats(
    grandTotalAttended,
    grandTotalConducted,
    targetPct
  );

  // Filtered compiled subjects
  const filteredCompiledSubjects = allCompiledSubjects.filter((item) => {
    if (filterSemesterId !== 'all' && item.semesterId !== filterSemesterId) return false;
    if (statusFilter === 'safe' && item.stats.percentage < targetPct) return false;
    if (statusFilter === 'shortage' && item.stats.percentage >= targetPct) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.teacher && item.teacher.toLowerCase().includes(q)) ||
        item.semesterName.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  // Simulator on Grand Total
  const simAttended = grandTotalAttended + simYearAttendMore;
  const simConducted = grandTotalConducted + simYearAttendMore;
  const simOverallPct =
    simConducted > 0 ? Math.round((simAttended / simConducted) * 1000) / 10 : 100;

  const handleDownloadLocalFile = () => {
    const jsonStr = exportBackupJSON(semesters, subjects, timetable, records);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendsmart_all_semesters_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Grand Academic Year Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 print:border-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-slate-700/40 bg-slate-950 flex items-center justify-center print:hidden">
              <img src="/app-logo.svg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  All Semesters Attendance
                </h2>
                <span className="hidden sm:inline-flex text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Compiled
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-year cumulative attendance of every subject across all semesters
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Local Storage Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Stored Locally</span>
            </div>

            <button
              type="button"
              onClick={handleDownloadLocalFile}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Download your full offline attendance JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Local File</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Print academic year attendance report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Transcript</span>
            </button>
          </div>
        </div>

        {/* Target Slider & Presets */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Minimum College Criteria:</span>
            {[65, 75, 80, 85].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTargetPct(preset)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  targetPct === preset
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Custom Target:</span>
            <input
              type="range"
              min="50"
              max="95"
              value={targetPct}
              onChange={(e) => setTargetPct(Number(e.target.value))}
              className="w-24 accent-slate-900 cursor-pointer h-1.5 bg-slate-100 rounded"
            />
            <span className="text-xs font-mono font-bold text-slate-800 w-8">{targetPct}%</span>
          </div>
        </div>
      </div>

      {/* 4 Grand Totals Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Year-Long Overall Attendance */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Compiled Year Attendance</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                grandOverallPercentage >= targetPct ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {grandOverallPercentage}%
            </span>
            <span className="text-xs text-slate-400">
              ({grandTotalAttended}/{grandTotalConducted})
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                grandOverallPercentage >= targetPct ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, grandOverallPercentage)}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {semesters.length} semesters & {allCompiledSubjects.length} subjects
          </span>
        </div>

        {/* Metric 2: Total Classes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Cumulative Classes Held</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {grandTotalConducted}
            </span>
            <span className="text-xs text-slate-400">total lectures</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Attended: <strong className="text-slate-800">{grandTotalAttended}</strong> · Missed: {grandTotalConducted - grandTotalAttended}
          </span>
        </div>

        {/* Metric 3: Total Cumulative Safe Bunks */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Combined Safe Bunks Buffer</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">
              {grandTotalSafeBunks}
            </span>
            <span className="text-xs text-slate-400">available bunks</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Sum of safe skips across all healthy subjects
          </span>
        </div>

        {/* Metric 4: Shortage Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Shortage Deficit Subjects</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono ${
                grandTotalShortages > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {grandTotalShortages}
            </span>
            <span className="text-xs text-slate-400">below {targetPct}%</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {grandTotalShortages === 0
              ? 'All subjects eligible for examinations'
              : 'Immediate attendance recovery required'}
          </span>
        </div>
      </div>

      {/* Semester-by-Semester Comparison Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">
          Semester Comparison (Semester 3 vs Semester 4 Breakdown)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {semesterSummaries.map((summary) => {
            const isSafe = summary.percentage >= targetPct;

            return (
              <div
                key={summary.semester.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      {summary.semester.academicYear}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{summary.semester.name}</h4>
                    <span className="text-xs text-slate-500">
                      {summary.subjects.length} subjects registered
                    </span>
                  </div>

                  <div
                    className={`px-2.5 py-1 rounded-lg border text-right ${
                      isSafe
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <span className="text-xl font-bold font-mono leading-none block">
                      {summary.percentage}%
                    </span>
                    <span className="text-[10px] uppercase font-semibold">
                      {isSafe ? 'Eligible' : 'Shortage'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Attended</span>
                    <strong className="font-mono text-slate-800">
                      {summary.attended} / {summary.conducted}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Safe Bunks</span>
                    <strong className="font-mono text-emerald-700">
                      {summary.safeBunks} bunks
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Below {targetPct}%</span>
                    <strong
                      className={`font-mono ${
                        summary.shortageSubjects > 0 ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {summary.shortageSubjects} subjects
                    </strong>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSemester(summary.semester.id);
                      onNavigateToTab('combined');
                    }}
                    className="text-slate-900 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>View Single Semester View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSemester(summary.semester.id);
                      onNavigateToTab('today');
                    }}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Mark Today &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar for Compiled Subjects */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subjects across all semesters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Semester Filter */}
          <select
            value={filterSemesterId}
            onChange={(e) => setFilterSemesterId(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="all">All Semesters ({semesters.length})</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="all">All Statuses ({allCompiledSubjects.length})</option>
            <option value="safe">Safe (≥ {targetPct}%)</option>
            <option value="shortage">Shortage (&lt; {targetPct}%)</option>
          </select>
        </div>
      </div>

      {/* Compiled Master Subject Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Compiled Attendance of Each Subject ({filteredCompiledSubjects.length} Courses)
          </h3>
          <span className="text-xs text-slate-500">
            Click any subject to view full details
          </span>
        </div>

        {filteredCompiledSubjects.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No subjects matching filter</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or semester filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompiledSubjects.map((item) => {
              const isSafe = item.stats.percentage >= targetPct;

              return (
                <div
                  key={`${item.semesterId}-${item.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Semester Tag & Code */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.semesterName}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                            {item.code}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                          {item.name}
                        </h4>
                        {(item.teacher || item.room) && (
                          <span className="text-[11px] text-slate-400 block line-clamp-1">
                            {item.teacher} {item.teacher && item.room && '·'} {item.room}
                          </span>
                        )}
                      </div>

                      <div
                        className={`text-right shrink-0 px-2 py-1 rounded-lg border ${
                          isSafe
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        <span className="text-base font-bold font-mono leading-none block">
                          {item.stats.percentage}%
                        </span>
                        <span className="text-[9px] uppercase font-semibold">
                          {isSafe ? 'Safe' : 'Low'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Class Counts */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>
                          Attended: <strong className="font-mono text-slate-900">{item.stats.attended}</strong> / {item.stats.conducted}
                        </span>
                        <span className="text-slate-400">
                          {item.stats.conducted - item.stats.attended} missed
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, item.stats.percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bunk / Attendance Advice Box */}
                    <div
                      className={`mt-3 p-2.5 rounded-lg border text-xs leading-relaxed ${
                        isSafe
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/60 border-rose-200 text-rose-950'
                      }`}
                    >
                      {isSafe ? (
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            Safe! You can bunk{' '}
                            <strong className="font-mono font-bold text-emerald-700">
                              {item.stats.safeBunks}
                            </strong>{' '}
                            more {item.stats.safeBunks === 1 ? 'class' : 'classes'} safely.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>
                            Shortage! Attend next{' '}
                            <strong className="font-mono font-bold text-rose-700">
                              {item.stats.classesNeeded}
                            </strong>{' '}
                            consecutive classes to reach {targetPct}%.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Switch to this semester shortcut */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Next: +1={item.stats.nextClassAttendedPct}% / -1={item.stats.nextClassMissedPct}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSemester(item.semesterId);
                        onNavigateToTab('subjects');
                      }}
                      className="text-slate-900 font-semibold hover:underline"
                    >
                      Manage &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cumulative Year Bunk Simulator Sandbox */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-slate-900" />
          <h3 className="text-sm font-bold text-slate-900">
            Cumulative Academic Year Bunk & Attendance Projection
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Test how attending or missing more classes across your whole 2nd year affects your cumulative degree attendance percentage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Simulate Attending Extra Classes Across Semesters:
              </label>
              <span className="font-mono font-bold text-emerald-700 text-xs">
                +{simYearAttendMore} classes
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={simYearAttendMore}
              onChange={(e) => setSimYearAttendMore(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0</span>
              <span>15</span>
              <span>30 classes</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Projected Cumulative Year Attendance:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {simOverallPct}%
                </span>
                <span className="text-xs text-slate-400">
                  (was {grandOverallPercentage}%)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  simOverallPct >= targetPct
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}
              >
                {simOverallPct >= targetPct ? 'Degree Eligible' : 'Debarred / Below Target'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
