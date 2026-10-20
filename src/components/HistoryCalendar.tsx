import React, { useState } from 'react';
import {
  AttendanceRecord,
  AttendanceStatus,
  Semester,
  Subject,
} from '../types/attendance';
import {
  formatDateKey,
  formatDisplayDate,
  DAY_SHORT_NAMES,
} from '../utils/calculator';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Slash,
  Filter,
  Search,
  RotateCcw,
  Clock,
  FileText,
} from 'lucide-react';

interface HistoryCalendarProps {
  activeSemester: Semester | null;
  subjects: Subject[];
  records: AttendanceRecord[];
  onUpdateRecordStatus: (recordId: string, newStatus: AttendanceStatus, notes?: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onJumpToDay: (dateStr: string) => void;
}

export const HistoryCalendar: React.FC<HistoryCalendarProps> = ({
  activeSemester,
  subjects,
  records,
  onUpdateRecordStatus,
  onDeleteRecord,
  onJumpToDay,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(formatDateKey(new Date()));
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchNotes, setSearchNotes] = useState<string>('');

  // Record being edited
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editNotes, setEditNotes] = useState<string>('');

  if (!activeSemester) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Please select an active semester.
      </div>
    );
  }

  // Filter records for active semester
  const semesterRecords = records.filter((r) => r.semesterId === activeSemester.id);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  // Calendar calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create calendar grid items
  const calendarDays: Array<{ dateKey: string; dayNumber: number; isCurrentMonth: boolean }> = [];

  // Previous month trailing days
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthLastDate - i;
    const date = new Date(year, month - 1, d);
    calendarDays.push({
      dateKey: formatDateKey(date),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    calendarDays.push({
      dateKey: formatDateKey(date),
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete week rows (up to 35 or 42 cells)
  const remainingCells = 42 - calendarDays.length;
  for (let d = 1; d <= remainingCells && calendarDays.length < 35; d++) {
    const date = new Date(year, month + 1, d);
    calendarDays.push({
      dateKey: formatDateKey(date),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Map records by date for fast calendar dot lookup
  const recordsByDate = new Map<string, AttendanceRecord[]>();
  semesterRecords.forEach((r) => {
    const existing = recordsByDate.get(r.date) || [];
    existing.push(r);
    recordsByDate.set(r.date, existing);
  });

  // Selected date records
  const selectedDayRecords = (recordsByDate.get(selectedDateKey) || []).filter((r) => {
    if (filterSubjectId !== 'all' && r.subjectId !== filterSubjectId) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchNotes && (!r.notes || !r.notes.toLowerCase().includes(searchNotes.toLowerCase())))
      return false;
    return true;
  });

  const getSubjectById = (id: string) => subjects.find((s) => s.id === id);

  const openEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditStatus(rec.status);
    setEditNotes(rec.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    onUpdateRecordStatus(editingRecord.id, editStatus, editNotes.trim());
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-900 text-white">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Attendance Calendar & Past Log Editor
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any past date to view, edit, or adjust attendance records (Present / Absent / Cancelled).
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const todayStr = formatDateKey(new Date());
              setSelectedDateKey(todayStr);
              onJumpToDay(todayStr);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors self-start sm:self-center"
          >
            Jump to Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Month Calendar (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonthDate(new Date())}
                className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, i) => (
              <span
                key={i}
                className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1"
              >
                {dayChar}
              </span>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell) => {
              const isSelected = selectedDateKey === cell.dateKey;
              const isToday = formatDateKey(new Date()) === cell.dateKey;
              const dayRecs = recordsByDate.get(cell.dateKey) || [];

              const hasPresent = dayRecs.some((r) => r.status === 'present');
              const hasAbsent = dayRecs.some((r) => r.status === 'absent');
              const hasCancelled = dayRecs.some((r) => r.status === 'cancelled');

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={`min-h-[52px] p-1.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-2 ring-slate-900 ring-offset-1'
                      : isToday
                      ? 'border-indigo-300 bg-indigo-50/40 text-slate-900'
                      : cell.isCurrentMonth
                      ? 'border-slate-100 hover:border-slate-300 text-slate-800'
                      : 'border-transparent text-slate-300 hover:text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isSelected ? 'text-white' : ''
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayRecs.length > 0 && (
                      <span
                        className={`text-[10px] font-mono ${
                          isSelected ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {dayRecs.length}
                      </span>
                    )}
                  </div>

                  {/* Status Indicator Dots */}
                  <div className="flex items-center gap-1 mt-1">
                    {hasPresent && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                        }`}
                        title="Present class recorded"
                      />
                    )}
                    {hasAbsent && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-rose-300' : 'bg-rose-500'
                        }`}
                        title="Absent class recorded"
                      />
                    )}
                    {hasCancelled && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-slate-400' : 'bg-slate-300'
                        }`}
                        title="Cancelled/Off class"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> Cancelled / Holiday
              </span>
            </div>
            <span>Click any day to view or edit</span>
          </div>
        </div>

        {/* Right Column: Detailed Day Log & Edit List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {formatDisplayDate(selectedDateKey)}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedDayRecords.length} attendance records logged
              </p>
            </div>
            <button
              type="button"
              onClick={() => onJumpToDay(selectedDateKey)}
              className="text-xs font-semibold text-slate-900 hover:underline"
            >
              Open in Daily View &rarr;
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-700"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present only</option>
              <option value="absent">Absent only</option>
              <option value="cancelled">Cancelled only</option>
            </select>
          </div>

          {/* Records List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {selectedDayRecords.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-medium">No records matching criteria for this date.</p>
                <button
                  type="button"
                  onClick={() => onJumpToDay(selectedDateKey)}
                  className="mt-2 text-xs font-semibold text-slate-800 hover:underline inline-block"
                >
                  + Mark Attendance for this Date
                </button>
              </div>
            ) : (
              selectedDayRecords.map((rec) => {
                const subject = getSubjectById(rec.subjectId);

                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-3 bg-white"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {subject?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                          {subject?.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'absent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rec.status.toUpperCase()}
                        </span>
                        {rec.time && (
                          <span className="text-[11px] font-mono text-slate-500">
                            {rec.time}
                          </span>
                        )}
                      </div>

                      {rec.notes && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Note: {rec.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions: Edit status or Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Edit attendance status or notes"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this attendance entry?')) {
                            onDeleteRecord(rec.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Edit Attendance Record
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update status for {getSubjectById(editingRecord.subjectId)?.name} on{' '}
              {formatDisplayDate(editingRecord.date)}.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('present')}
                    className={`py-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      editStatus === 'present'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('absent')}
                    className={`py-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      editStatus === 'absent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('cancelled')}
                    className={`py-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      editStatus === 'cancelled'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes (Reason / Medical / Clarification)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical excuse accepted by Dean"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
