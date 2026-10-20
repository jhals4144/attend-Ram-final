import React, { useState } from 'react';
import {
  DayOfWeek,
  Semester,
  Subject,
  TimetableSlot,
} from '../types/attendance';
import { DAY_NAMES, DAY_SHORT_NAMES } from '../utils/calculator';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Copy,
  MapPin,
  Check,
  Layers,
  Sparkles,
  Info,
  Camera,
  Share2,
} from 'lucide-react';

interface TimetableEditorProps {
  activeSemester: Semester | null;
  subjects: Subject[];
  timetable: TimetableSlot[];
  onAddSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  onUpdateSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCopyDaySchedule: (fromDay: DayOfWeek, toDay: DayOfWeek) => void;
  onOpenScanPhoto: () => void;
  onOpenShare: () => void;
}

export const TimetableEditor: React.FC<TimetableEditorProps> = ({
  activeSemester,
  subjects,
  timetable,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
  onCopyDaySchedule,
  onOpenScanPhoto,
  onOpenShare,
}) => {
  const [activeDay, setActiveDay] = useState<DayOfWeek>(1); // Monday default
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  // Form states
  const [slotDay, setSlotDay] = useState<DayOfWeek>(1);
  const [slotSubjectId, setSlotSubjectId] = useState(subjects[0]?.id || '');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('10:00');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotType, setSlotType] = useState<'theory' | 'lab' | 'tutorial'>('theory');

  // Copy schedule state
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyToDay, setCopyToDay] = useState<DayOfWeek>(2);

  if (!activeSemester) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Please select an active semester.
      </div>
    );
  }

  // Filter slots for current semester and current day
  const currentSemesterSlots = timetable.filter(
    (s) => s.semesterId === activeSemester.id
  );

  const activeDaySlots = currentSemesterSlots
    .filter((s) => s.dayOfWeek === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const openAddModal = (defaultDay?: DayOfWeek) => {
    setEditingSlot(null);
    setSlotDay(defaultDay ?? activeDay);
    setSlotSubjectId(subjects[0]?.id || '');
    setSlotStartTime('09:00');
    setSlotEndTime('10:00');
    setSlotRoom('');
    setSlotType('theory');
    setIsSlotModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setSlotDay(slot.dayOfWeek);
    setSlotSubjectId(slot.subjectId);
    setSlotStartTime(slot.startTime);
    setSlotEndTime(slot.endTime);
    setSlotRoom(slot.room || '');
    setSlotType(slot.type || 'theory');
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotSubjectId) return;

    if (editingSlot) {
      onUpdateSlot({
        ...editingSlot,
        dayOfWeek: slotDay,
        subjectId: slotSubjectId,
        startTime: slotStartTime,
        endTime: slotEndTime,
        room: slotRoom.trim(),
        type: slotType,
      });
    } else {
      onAddSlot({
        semesterId: activeSemester.id,
        dayOfWeek: slotDay,
        subjectId: slotSubjectId,
        startTime: slotStartTime,
        endTime: slotEndTime,
        room: slotRoom.trim(),
        type: slotType,
      });
    }
    setIsSlotModalOpen(false);
  };

  const handleCopyDay = (e: React.FormEvent) => {
    e.preventDefault();
    onCopyDaySchedule(activeDay, copyToDay);
    setIsCopyModalOpen(false);
    setActiveDay(copyToDay);
  };

  const getSubjectById = (id: string) => subjects.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      {/* Semester Timetable Context Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-900 text-white">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Weekly Timetable
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSemester.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenScanPhoto}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              title="Upload timetable photo from gallery or snap with camera"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-700" />
              <span>Upload Schedule (Gallery / Camera)</span>
            </button>

            <button
              type="button"
              onClick={onOpenShare}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Share timetable via QR code, link, or code"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Share Schedule</span>
            </button>

            {activeDaySlots.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                title="Copy this day's schedule to another weekday"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Day</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => openAddModal(activeDay)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class Slot</span>
            </button>
          </div>
        </div>

        {/* Day Selector Tabs (Mon - Sat/Sun) */}
        <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2 p-1.5 bg-slate-100 rounded-xl">
          {([1, 2, 3, 4, 5, 6, 0] as DayOfWeek[]).map((dayNum) => {
            const count = currentSemesterSlots.filter((s) => s.dayOfWeek === dayNum).length;
            const isSelected = activeDay === dayNum;

            return (
              <button
                key={dayNum}
                onClick={() => setActiveDay(dayNum)}
                className={`py-2 px-1 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className="block text-xs uppercase tracking-wide">
                  {DAY_SHORT_NAMES[dayNum]}
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                  {count} {count === 1 ? 'class' : 'classes'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots List for Selected Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {DAY_NAMES[activeDay]} Schedule ({activeDaySlots.length} slots)
          </h3>
          <span className="text-xs text-slate-400">
            Classes are ordered by start time
          </span>
        </div>

        {activeDaySlots.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              No classes scheduled on {DAY_NAMES[activeDay]}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add your lecture slots to enable 1-tap daily attendance marking.
            </p>
            <button
              onClick={() => openAddModal(activeDay)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Class to {DAY_NAMES[activeDay]}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {activeDaySlots.map((slot, index) => {
              const subject = getSubjectById(slot.subjectId);

              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0">
                      #{index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {subject?.name || 'Unknown Subject'}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {subject?.code || 'N/A'}
                        </span>
                        {slot.type && slot.type !== 'theory' && (
                          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 uppercase">
                            {slot.type}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-mono font-medium">
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
                          <span className="text-slate-400">
                            Instructor: {subject.teacher}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => openEditModal(slot)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit slot timing or classroom"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this class slot from schedule?')) {
                          onDeleteSlot(slot.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Timetable Slot Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingSlot ? 'Edit Class Slot' : 'Add Class Slot'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure scheduled lecture time for {DAY_NAMES[slotDay]}.
            </p>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={slotDay}
                  onChange={(e) => setSlotDay(Number(e.target.value) as DayOfWeek)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  {([1, 2, 3, 4, 5, 6, 0] as DayOfWeek[]).map((d) => (
                    <option key={d} value={d}>
                      {DAY_NAMES[d]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
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
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room / Lab
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 302 / Lab 1"
                    value={slotRoom}
                    onChange={(e) => setSlotRoom(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Session Type
                  </label>
                  <select
                    value={slotType}
                    onChange={(e) => setSlotType(e.target.value as 'theory' | 'lab' | 'tutorial')}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                  >
                    <option value="theory">Theory Lecture</option>
                    <option value="lab">Lab Practical</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  {editingSlot ? 'Save Slot' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Day Schedule Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Copy Schedule from {DAY_NAMES[activeDay]}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Duplicate all {activeDaySlots.length} class slots from {DAY_NAMES[activeDay]} to another day.
            </p>

            <form onSubmit={handleCopyDay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Day
                </label>
                <select
                  value={copyToDay}
                  onChange={(e) => setCopyToDay(Number(e.target.value) as DayOfWeek)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  {([1, 2, 3, 4, 5, 6, 0] as DayOfWeek[])
                    .filter((d) => d !== activeDay)
                    .map((d) => (
                      <option key={d} value={d}>
                        {DAY_NAMES[d]}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  Duplicate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
