import React, { useState } from 'react';
import { Semester, Subject, SubjectWithStats } from '../types/attendance';
import { ALL_MBBS_SUBJECTS, MBBSSubjectPreset } from '../utils/storage';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Search,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface SubjectListProps {
  activeSemester: Semester | null;
  subjectsWithStats: SubjectWithStats[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onQuickAdjust: (subjectId: string, attendedDelta: number, conductedDelta: number) => void;
}

export const SubjectList: React.FC<SubjectListProps> = ({
  activeSemester,
  subjectsWithStats,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onQuickAdjust,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'safe' | 'danger'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMBBSDrawerOpen, setIsMBBSDrawerOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [activeProfTab, setActiveProfTab] = useState<string>('2nd Prof (2nd Year)');

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [formTarget, setFormTarget] = useState<number>(75);
  const [formManualAttended, setFormManualAttended] = useState<number>(0);
  const [formManualConducted, setFormManualConducted] = useState<number>(0);

  if (!activeSemester) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Please select an active semester.
      </div>
    );
  }

  const openAddModal = (preset?: MBBSSubjectPreset) => {
    setEditingSubject(null);
    setFormName(preset ? preset.name : '');
    setFormCode(preset ? preset.code : '');
    setFormTeacher('');
    setFormRoom(preset ? preset.defaultRoom : '');
    setFormColor(preset ? preset.color : 'blue');
    setFormTarget(activeSemester.targetPercentage || 75);
    setFormManualAttended(0);
    setFormManualConducted(0);
    setIsAddModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormCode(subject.code);
    setFormTeacher(subject.teacher || '');
    setFormRoom(subject.room || '');
    setFormColor(subject.color || 'blue');
    setFormTarget(subject.targetPercentage || activeSemester.targetPercentage || 75);
    setFormManualAttended(subject.manualAttended || 0);
    setFormManualConducted(subject.manualConducted || 0);
    setIsAddModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    if (editingSubject) {
      onUpdateSubject({
        ...editingSubject,
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        teacher: formTeacher.trim(),
        room: formRoom.trim(),
        color: formColor,
        targetPercentage: Number(formTarget),
        manualAttended: Number(formManualAttended),
        manualConducted: Number(formManualConducted),
      });
    } else {
      onAddSubject({
        semesterId: activeSemester.id,
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        teacher: formTeacher.trim(),
        room: formRoom.trim(),
        color: formColor,
        targetPercentage: Number(formTarget),
        manualAttended: Number(formManualAttended),
        manualConducted: Number(formManualConducted),
      });
    }
    setIsAddModalOpen(false);
  };

  // Add individual MBBS preset directly
  const handleQuickAddMBBS = (preset: MBBSSubjectPreset) => {
    // Check if code already exists in current semester
    const exists = subjectsWithStats.some(
      (s) => s.code.toUpperCase() === preset.code.toUpperCase()
    );
    if (exists) return;

    onAddSubject({
      semesterId: activeSemester.id,
      code: preset.code,
      name: preset.name,
      room: preset.defaultRoom,
      color: preset.color,
      targetPercentage: activeSemester.targetPercentage || 75,
      manualAttended: 0,
      manualConducted: 0,
    });
  };

  // 1-Click: Add all 2nd Year MBBS subjects
  const handleAddAll2ndYearMBBS = () => {
    const secondYearSubjects = ALL_MBBS_SUBJECTS.filter(
      (s) => s.prof === '2nd Prof (2nd Year)'
    );

    secondYearSubjects.forEach((preset) => {
      const alreadyPresent = subjectsWithStats.some(
        (s) => s.code.toUpperCase() === preset.code.toUpperCase()
      );
      if (!alreadyPresent) {
        onAddSubject({
          semesterId: activeSemester.id,
          code: preset.code,
          name: preset.name,
          room: preset.defaultRoom,
          color: preset.color,
          targetPercentage: activeSemester.targetPercentage || 75,
          manualAttended: 0,
          manualConducted: 0,
        });
      }
    });
  };

  // Filtered subjects
  const filteredSubjects = subjectsWithStats.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.teacher && s.teacher.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'safe') return s.stats.percentage >= s.stats.targetPercentage;
    if (filterType === 'danger') return s.stats.percentage < s.stats.targetPercentage;
    return true;
  });

  // Metrics
  const totalAttended = subjectsWithStats.reduce((acc, s) => acc + s.stats.attended, 0);
  const totalConducted = subjectsWithStats.reduce((acc, s) => acc + s.stats.conducted, 0);
  const overallPercentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 1000) / 10 : 100;
  const shortageSubjects = subjectsWithStats.filter((s) => s.stats.percentage < s.stats.targetPercentage);
  const totalSafeBunks = subjectsWithStats.reduce((acc, s) => acc + s.stats.safeBunks, 0);

  // Grouped MBBS subjects
  const profCategories = [
    '2nd Prof (2nd Year)',
    '1st Prof (1st Year)',
    '3rd Prof Part 1',
    'Final Prof',
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Overall Percentage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Overall Attendance</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
              {overallPercentage}%
            </span>
            <span className="text-xs text-slate-400">
              / {activeSemester.targetPercentage}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                overallPercentage >= activeSemester.targetPercentage
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Attended Count */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Attended / Total</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
              {totalAttended}
            </span>
            <span className="text-sm font-mono text-slate-400">/ {totalConducted}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {totalConducted - totalAttended} missed
          </p>
        </div>

        {/* Card 3: Shortage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Shortage</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                shortageSubjects.length > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {shortageSubjects.length}
            </span>
            <span className="text-xs text-slate-400">subjects</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {shortageSubjects.length > 0 ? 'Below 75%' : 'All safe'}
          </p>
        </div>

        {/* Card 4: Safe Bunks */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-semibold text-slate-500">Safe Bunks Buffer</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600">
              {totalSafeBunks}
            </span>
            <span className="text-xs text-slate-400">classes</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Can be skipped safely</p>
        </div>
      </div>

      {/* MBBS Subjects Quick Adder Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                MBBS Subjects Directory
              </h3>
              <p className="text-xs text-slate-500">
                Quickly add 2nd Year or any MBBS subjects. All subjects can be removed at any time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddAll2ndYearMBBS}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Add All 2nd Year MBBS</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMBBSDrawerOpen(!isMBBSDrawerOpen)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              {isMBBSDrawerOpen ? 'Hide Catalog' : 'Browse All MBBS'}
            </button>
          </div>
        </div>

        {/* MBBS Full Subject Selector (Collapsible) */}
        {isMBBSDrawerOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {/* Prof Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {profCategories.map((prof) => (
                <button
                  key={prof}
                  type="button"
                  onClick={() => setActiveProfTab(prof)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeProfTab === prof
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {prof}
                </button>
              ))}
            </div>

            {/* Subject Chips for active Prof */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {ALL_MBBS_SUBJECTS.filter((s) => s.prof === activeProfTab).map((preset) => {
                const isAdded = subjectsWithStats.some(
                  (s) => s.code.toUpperCase() === preset.code.toUpperCase()
                );

                return (
                  <div
                    key={preset.code}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-1 py-0.5 rounded border border-slate-200">
                          {preset.code}
                        </span>
                        <span className="font-semibold text-slate-900 truncate block">
                          {preset.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {preset.defaultRoom}
                      </span>
                    </div>

                    {isAdded ? (
                      <span className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200 flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" />
                        Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickAddMBBS(preset)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shrink-0"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar: Search, Filter, and Custom Subject */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subjects or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({subjectsWithStats.length})
            </button>
            <button
              onClick={() => setFilterType('safe')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'safe'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Safe
            </button>
            <button
              onClick={() => setFilterType('danger')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'danger'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shortage
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Active Subjects Grid (All Removable) */}
      {filteredSubjects.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No subjects in this view</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={handleAddAll2ndYearMBBS}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Load 2nd Year MBBS Subjects
            </button>
            <button
              onClick={() => openAddModal()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Create Custom
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subj) => {
            const isSafe = subj.stats.percentage >= subj.stats.targetPercentage;

            return (
              <div
                key={subj.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow"
              >
                <div>
                  {/* Top: Code & Percentage */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {subj.code}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Target: {subj.stats.targetPercentage}%
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                        {subj.name}
                      </h4>
                      {(subj.teacher || subj.room) && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {subj.teacher} {subj.teacher && subj.room && '·'} {subj.room}
                        </p>
                      )}
                    </div>

                    <div
                      className={`text-right shrink-0 px-2 py-1 rounded-lg border ${
                        isSafe
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <span className="text-base font-bold font-mono tabular-nums leading-none block">
                        {subj.stats.percentage}%
                      </span>
                      <span className="text-[10px] uppercase font-semibold">
                        {isSafe ? 'Safe' : 'Shortage'}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Attended: <strong className="font-mono text-slate-900">{subj.stats.attended}</strong> / {subj.stats.conducted}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {subj.stats.conducted - subj.stats.attended} missed
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, subj.stats.percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Crisp Status Tag (No verbose faltu text) */}
                  <div className="mt-2.5">
                    {isSafe ? (
                      <div className="text-xs font-medium text-emerald-700 bg-emerald-50/70 border border-emerald-100 rounded-md px-2.5 py-1 flex items-center justify-between">
                        <span>Safe to bunk:</span>
                        <strong className="font-mono font-bold text-emerald-800">
                          {subj.stats.safeBunks} {subj.stats.safeBunks === 1 ? 'class' : 'classes'}
                        </strong>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-rose-700 bg-rose-50/70 border border-rose-100 rounded-md px-2.5 py-1 flex items-center justify-between">
                        <span>Need to attend:</span>
                        <strong className="font-mono font-bold text-rose-800">
                          +{subj.stats.classesNeeded} {subj.stats.classesNeeded === 1 ? 'class' : 'classes'}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Quick +Present / +Absent, Edit, and Removable Subject Button */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onQuickAdjust(subj.id, 1, 1)}
                      className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                      title="+1 Present"
                    >
                      + Present
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAdjust(subj.id, 0, 1)}
                      className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                      title="+1 Absent"
                    >
                      + Absent
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(subj)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Explicit Removable Subject button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove "${subj.name}" (${subj.code}) from this semester?`
                          )
                        ) {
                          onDeleteSubject(subj.id);
                        }
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded border border-rose-200 transition-colors flex items-center gap-1"
                      title="Remove subject"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pathology"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PATH201"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full text-xs font-mono uppercase border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. R. K. Gupta"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lecture Hall / Lab (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pathology LT"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Attendance (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formTarget}
                  onChange={(e) => setFormTarget(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              {/* Baseline manual count */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-800 block mb-1">
                  Starting Attendance Count (If already started)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Attended so far
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formManualAttended}
                      onChange={(e) => setFormManualAttended(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Conducted so far
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formManualConducted}
                      onChange={(e) => setFormManualConducted(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  {editingSubject ? 'Save Changes' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
