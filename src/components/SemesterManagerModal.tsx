import React, { useState } from 'react';
import { Semester, Subject } from '../types/attendance';
import {
  Layers,
  Plus,
  CheckCircle,
  ShieldCheck,
  Calendar,
  Trash2,
  Edit2,
  X,
  Sparkles,
} from 'lucide-react';

interface SemesterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesters: Semester[];
  activeSemesterId: string | null;
  onSelectSemester: (semesterId: string) => void;
  onAddSemester: (
    newSemester: Omit<Semester, 'id' | 'createdAt'>,
    duplicateSubjectsFromId?: string
  ) => void;
  onUpdateSemester: (semester: Semester) => void;
  onDeleteSemester: (semesterId: string) => void;
}

export const SemesterManagerModal: React.FC<SemesterManagerModalProps> = ({
  isOpen,
  onClose,
  semesters,
  activeSemesterId,
  onSelectSemester,
  onAddSemester,
  onUpdateSemester,
  onDeleteSemester,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('2024 - 2025');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [duplicateFrom, setDuplicateFrom] = useState<string>('none');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingSemester(null);
    setName(`2nd Year - Semester ${semesters.length + 2}`);
    setAcademicYear('2024 - 2025');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setTargetPercentage(75);
    setDuplicateFrom(activeSemesterId || 'none');
    setIsCreatingNew(true);
  };

  const handleStartEdit = (sem: Semester) => {
    setEditingSemester(sem);
    setName(sem.name);
    setAcademicYear(sem.academicYear);
    setStartDate(sem.startDate);
    setEndDate(sem.endDate);
    setTargetPercentage(sem.targetPercentage);
    setIsCreatingNew(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSemester) {
      onUpdateSemester({
        ...editingSemester,
        name: name.trim(),
        academicYear: academicYear.trim(),
        startDate,
        endDate,
        targetPercentage: Number(targetPercentage),
      });
    } else {
      onAddSemester(
        {
          name: name.trim(),
          academicYear: academicYear.trim(),
          startDate,
          endDate,
          targetPercentage: Number(targetPercentage),
          isCurrent: true,
        },
        duplicateFrom !== 'none' ? duplicateFrom : undefined
      );
    }

    setIsCreatingNew(false);
    setEditingSemester(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-900 text-white">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Manage Semesters & Timetables
              </h3>
              <p className="text-xs text-slate-500">
                Switch semesters, create new schedules, past attendance stays protected.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reassurance banner for keeping past attendance */}
        <div className="my-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Past Saved Attendance is 100% Preserved</span>
            <span>
              Each semester has its own schedule and subjects. Switching from Semester 3 to
              Semester 4 will never erase your past attendance records or historical logs.
            </span>
          </div>
        </div>

        {!isCreatingNew ? (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {semesters.map((sem) => {
                const isActive = sem.id === activeSemesterId;

                return (
                  <div
                    key={sem.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      isActive
                        ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-1 bg-slate-50/70'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{sem.name}</span>
                        {isActive && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Active Now
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Year: {sem.academicYear}</span>
                        <span>·</span>
                        <span>Target: {sem.targetPercentage}%</span>
                        {sem.startDate && (
                          <>
                            <span>·</span>
                            <span>From: {sem.startDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSemester(sem.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm"
                        >
                          Switch
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(sem)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                        title="Edit Semester"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {semesters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete "${sem.name}"? Records for this semester will be removed.`
                              )
                            ) {
                              onDeleteSemester(sem.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete Semester"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleStartCreate}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Semester (e.g. 2nd Year Sem 4 or Next Year)</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              {editingSemester ? 'Edit Semester' : 'Add New Semester'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2nd Year - Semester 4 (Even)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024 - 2025"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target %
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            {!editingSemester && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Starting Subjects Setup
                </label>
                <select
                  value={duplicateFrom}
                  onChange={(e) => setDuplicateFrom(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                >
                  <option value="none">Start with blank schedule & add new subjects</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      Carry over subjects from {s.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Attendance count for new semester will start fresh at 0.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingSemester(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back to List
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
              >
                {editingSemester ? 'Save Semester' : 'Create & Switch to Semester'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
