import React, { useState } from 'react';
import {
  AttendanceRecord,
  AttendanceStatus,
  DayOfWeek,
  Semester,
  Subject,
  TimetableSlot,
} from '../types/attendance';
import {
  formatDateKey,
  formatDisplayDate,
  DAY_NAMES,
} from '../utils/calculator';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Slash,
  Plus,
  Clock,
  MapPin,
  User,
  Sparkles,
  RotateCcw,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface TodayAttendanceProps {
  activeSemester: Semester | null;
  subjects: Subject[];
  timetable: TimetableSlot[];
  records: AttendanceRecord[];
  onMarkAttendance: (
    subjectId: string,
    date: string,
    status: AttendanceStatus,
    slotId?: string,
    time?: string,
    notes?: string
  ) => void;
  onDeleteRecord: (recordId: string) => void;
  onAddExtraClass: (
    subjectId: string,
    date: string,
    time: string,
    status: AttendanceStatus,
    notes?: string
  ) => void;
  onOpenUploadSchedule?: () => void;
}

export const TodayAttendance: React.FC<TodayAttendanceProps> = ({
  activeSemester,
  subjects,
  timetable,
  records,
  onMarkAttendance,
  onDeleteRecord,
  onAddExtraClass,
  onOpenUploadSchedule,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraSubjectId, setExtraSubjectId] = useState(subjects[0]?.id || '');
  const [extraTime, setExtraTime] = useState('11:00');
  const [extraStatus, setExtraStatus] = useState<AttendanceStatus>('present');
  const [extraNotes, setExtraNotes] = useState('');

  // Note editing state
  const [editingNoteRecordId, setEditingNoteRecordId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  if (!activeSemester) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Please select or create an active semester first.
      </div>
    );
  }

  const dateKey = formatDateKey(selectedDate);
  const dayOfWeek = selectedDate.getDay() as DayOfWeek;
  const isToday = formatDateKey(new Date()) === dateKey;

  // Filter timetable slots for this day of week and current semester
  const scheduledSlots = timetable
    .filter((slot) => slot.semesterId === activeSemester.id && slot.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Get all records for this date
  const dateRecords = records.filter(
    (r) => r.semesterId === activeSemester.id && r.date === dateKey
  );

  // Extra records (records that don't match any scheduled slot ID)
  const scheduledSlotIds = new Set(scheduledSlots.map((s) => s.id));
  const extraRecords = dateRecords.filter(
    (r) => !r.slotId || !scheduledSlotIds.has(r.slotId)
  );

  // Navigation handlers
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));
  };

  // Mark all scheduled classes as present
  const handleMarkAllPresent = () => {
    scheduledSlots.forEach((slot) => {
      onMarkAttendance(slot.subjectId, dateKey, 'present', slot.id, slot.startTime);
    });
  };

  const handleSaveExtraClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraSubjectId) return;
    onAddExtraClass(extraSubjectId, dateKey, extraTime, extraStatus, extraNotes);
    setShowExtraModal(false);
    setExtraNotes('');
  };

  const getSubjectById = (id: string) => subjects.find((s) => s.id === id);

  // Stats for the selected day
  const markedCount = dateRecords.length;
  const totalSlotsCount = scheduledSlots.length + extraRecords.length;
  const presentCount = dateRecords.filter((r) => r.status === 'present').length;
  const absentCount = dateRecords.filter((r) => r.status === 'absent').length;
  const cancelledCount = dateRecords.filter((r) => r.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Date Navigation Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isToday
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="ml-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {DAY_NAMES[dayOfWeek]}, {formatDisplayDate(dateKey)}
              </h2>
              <p className="text-xs text-slate-500">
                {isToday ? 'Today\'s Attendance' : 'Past Date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={dateKey}
                onChange={handleDateInputChange}
                className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            {scheduledSlots.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowExtraModal(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Extra Class</span>
            </button>
          </div>
        </div>

        {/* Day Summary Micro Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Scheduled: <strong className="font-mono text-slate-900">{scheduledSlots.length}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700">
              Present: <strong className="font-mono">{presentCount}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-700">
              Absent: <strong className="font-mono">{absentCount}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">
              Cancelled: <strong className="font-mono">{cancelledCount}</strong>
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            {markedCount} of {totalSlotsCount} marked
          </div>
        </div>
      </div>

      {/* Scheduled Classes for the day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Schedule for {DAY_NAMES[dayOfWeek]} ({scheduledSlots.length} classes)
          </h3>
        </div>

        {scheduledSlots.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              No classes scheduled for {DAY_NAMES[dayOfWeek]}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setShowExtraModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Extra Class
              </button>
              {onOpenUploadSchedule && (
                <button
                  onClick={onOpenUploadSchedule}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1.5"
                >
                  Upload Schedule Photo
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {scheduledSlots.map((slot) => {
              const subject = getSubjectById(slot.subjectId);
              const record = dateRecords.find((r) => r.slotId === slot.id);
              const currentStatus = record?.status;

              return (
                <div
                  key={slot.id}
                  className={`bg-white rounded-xl border p-4 transition-all duration-200 ${
                    currentStatus === 'present'
                      ? 'border-emerald-300 ring-1 ring-emerald-100 bg-emerald-50/20'
                      : currentStatus === 'absent'
                      ? 'border-rose-300 ring-1 ring-rose-100 bg-rose-50/20'
                      : currentStatus === 'cancelled'
                      ? 'border-slate-300 bg-slate-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Slot Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
                        <span className="text-[10px] font-mono font-bold text-slate-700">
                          {slot.startTime}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {subject?.name || 'Unknown Subject'}
                          </span>
                          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {subject?.code || 'N/A'}
                          </span>
                          {slot.type === 'lab' && (
                            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              Lab Practical
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {(slot.room || subject?.room) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {slot.room || subject?.room}
                            </span>
                          )}
                          {subject?.teacher && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {subject.teacher}
                            </span>
                          )}
                        </div>

                        {record?.notes && (
                          <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 mt-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Note: {record.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls for Marking & Editing */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end md:self-center">
                      {/* Present Button */}
                      <button
                        type="button"
                        onClick={() =>
                          onMarkAttendance(slot.subjectId, dateKey, 'present', slot.id, slot.startTime)
                        }
                        className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1'
                            : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                        }`}
                        title="Mark Attended (Present)"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Present</span>
                      </button>

                      {/* Absent Button */}
                      <button
                        type="button"
                        onClick={() =>
                          onMarkAttendance(slot.subjectId, dateKey, 'absent', slot.id, slot.startTime)
                        }
                        className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600 ring-offset-1'
                            : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200'
                        }`}
                        title="Mark Missed (Absent / Bunk)"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Absent</span>
                      </button>

                      {/* Cancelled / Off Button */}
                      <button
                        type="button"
                        onClick={() =>
                          onMarkAttendance(slot.subjectId, dateKey, 'cancelled', slot.id, slot.startTime)
                        }
                        className={`min-h-[44px] px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all ${
                          currentStatus === 'cancelled'
                            ? 'bg-slate-700 text-white shadow-sm ring-2 ring-slate-700 ring-offset-1'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                        title="Class Cancelled / Teacher on Leave (Does not affect %)"
                      >
                        <Slash className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Off/Cancelled</span>
                      </button>

                      {/* Reset / Undo Button if marked */}
                      {record && (
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(record.id)}
                          className="min-h-[44px] min-w-[40px] px-2 py-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
                          title="Clear / Reset this mark"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Extra or Manual Classes added for this day */}
      {extraRecords.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-slate-800">
            Extra & Substitution Classes on {formatDisplayDate(dateKey)}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {extraRecords.map((rec) => {
              const subject = getSubjectById(rec.subjectId);
              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        rec.status === 'present'
                          ? 'bg-emerald-500'
                          : rec.status === 'absent'
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {subject?.name || 'Extra Class'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                          {rec.time || 'Extra'}
                        </span>
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
                      </div>
                      {rec.notes && (
                        <p className="text-xs text-slate-500 mt-0.5">{rec.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onMarkAttendance(
                          rec.subjectId,
                          dateKey,
                          rec.status === 'present' ? 'absent' : 'present',
                          rec.slotId,
                          rec.time,
                          rec.notes
                        )
                      }
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      Toggle {rec.status === 'present' ? 'Absent' : 'Present'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rec.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete extra class"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra Class Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Add Extra / Substitution Class
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Log an un-scheduled extra lecture or remedial class held on {formatDisplayDate(dateKey)}.
            </p>

            <form onSubmit={handleSaveExtraClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Subject
                </label>
                <select
                  value={extraSubjectId}
                  onChange={(e) => setExtraSubjectId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class Time
                  </label>
                  <input
                    type="time"
                    value={extraTime}
                    onChange={(e) => setExtraTime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={extraStatus}
                    onChange={(e) => setExtraStatus(e.target.value as AttendanceStatus)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                  >
                    <option value="present">Present (Attended)</option>
                    <option value="absent">Absent (Missed)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Note (Reason / Faculty)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra lecture by HOD, syllabus revision"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExtraModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
                >
                  Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
