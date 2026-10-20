import React from 'react';
import { Semester, AttendanceStats } from '../types/attendance';
import { Calendar, Download, Layers, Share2, Sparkles, BarChart3 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  semesters: Semester[];
  activeSemester: Semester | null;
  overallStats: AttendanceStats;
  activeTab: 'today' | 'subjects' | 'combined' | 'all-semesters' | 'calculator' | 'timetable' | 'history';
  setActiveTab: (tab: 'today' | 'subjects' | 'combined' | 'all-semesters' | 'calculator' | 'timetable' | 'history') => void;
  onOpenSemesterModal: () => void;
  onOpenBackupModal: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  semesters,
  activeSemester,
  overallStats,
  activeTab,
  setActiveTab,
  onOpenSemesterModal,
  onOpenBackupModal,
  onOpenShareModal,
}) => {
  const isSafe = overallStats.percentage >= overallStats.targetPercentage;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 1-Row Header */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand title & Active Semester Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-700/40 bg-slate-950 flex items-center justify-center">
              <img src="/app-logo.svg" alt="AttendSmart Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  AttendSmart
                </span>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                  · 2nd Year
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenSemesterModal}
                className="group flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
                title="Click to switch or manage semester schedule"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                <span className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2">
                  {activeSemester?.name || 'Semester'}
                </span>
                <span className="text-[11px] text-slate-600 group-hover:text-slate-900">
                  (Change)
                </span>
              </button>
            </div>
          </div>

          {/* Zone 2: Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'today'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Today's Attendance
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'subjects'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Subjects
            </button>
            <button
              onClick={() => setActiveTab('combined')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'combined'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Sem Report
            </button>
            <button
              onClick={() => setActiveTab('all-semesters')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all-semesters'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All Semesters (Compiled)</span>
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Bunk Calc
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'timetable'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Calendar & Edit
            </button>
          </nav>

          {/* Zone 3: Primary Action & Overall Percentage metric */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* In-App PWA Install Button */}
            <PWAInstallButton />

            {/* Share Schedule trigger */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Share timetable to another device"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Overall Percentage badge */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                isSafe
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex flex-col text-right leading-none">
                <span className="text-[10px] text-slate-500 font-normal">Overall</span>
                <span className="font-mono font-bold text-sm tabular-nums">
                  {overallStats.percentage}%
                </span>
              </div>
              <span className="text-[11px] hidden lg:inline">
                ({overallStats.attended}/{overallStats.conducted})
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenBackupModal}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Backup, export, or restore attendance data"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Backup</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
