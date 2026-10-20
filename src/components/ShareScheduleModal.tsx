import React, { useEffect, useRef, useState } from 'react';
import { Semester, Subject, TimetableSlot } from '../types/attendance';
import { drawQRToCanvas } from '../utils/qrGenerator';
import {
  Share2,
  QrCode,
  Copy,
  Check,
  Upload,
  Layers,
  Smartphone,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';

interface ShareScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesters: Semester[];
  activeSemesterId: string | null;
  subjects: Subject[];
  timetable: TimetableSlot[];
  onImportSharedSchedule: (
    targetSemesterId: string,
    importedSubjects: Subject[],
    importedSlots: TimetableSlot[]
  ) => void;
}

export const ShareScheduleModal: React.FC<ShareScheduleModalProps> = ({
  isOpen,
  onClose,
  semesters,
  activeSemesterId,
  subjects,
  timetable,
  onImportSharedSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'import'>('share');
  const [selectedSemId, setSelectedSemId] = useState<string>(
    activeSemesterId || semesters[0]?.id || ''
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [importCodeText, setImportCodeText] = useState('');
  const [importTargetSemId, setImportTargetSemId] = useState<string>(
    activeSemesterId || semesters[0]?.id || ''
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const targetSemester =
    semesters.find((s) => s.id === selectedSemId) || semesters[0] || null;

  // Filter subjects and slots for selected semester
  const semSubjects = subjects.filter((s) => s.semesterId === targetSemester?.id);
  const semSlots = timetable.filter((s) => s.semesterId === targetSemester?.id);

  // Encode schedule into a compact JSON string
  const schedulePayload = JSON.stringify({
    type: 'ATTENDSMART_SCHEDULE_SHARE_V1',
    semesterName: targetSemester?.name || 'Schedule',
    subjects: semSubjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      teacher: s.teacher,
      room: s.room,
      color: s.color,
      targetPercentage: s.targetPercentage,
    })),
    slots: semSlots.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectId: slot.subjectId,
      room: slot.room,
      type: slot.type,
    })),
  });

  const base64Code = btoa(unescape(encodeURIComponent(schedulePayload)));
  const shareCode = `ATTEND_SCHED:${base64Code}`;
  const shareableUrl = `${window.location.origin}${window.location.pathname}?import_sched=${encodeURIComponent(base64Code)}`;

  // Draw QR code on canvas whenever payload changes or tab switches to share
  useEffect(() => {
    if (isOpen && activeTab === 'share' && canvasRef.current) {
      // Encode shareable link or code into QR canvas
      drawQRToCanvas(canvasRef.current, shareableUrl, 5);
    }
  }, [isOpen, activeTab, selectedSemId, shareableUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Schedule for ${targetSemester?.name} - AttendSmart`,
          text: `Here is our 2nd Year class schedule for ${targetSemester?.name}! Open in AttendSmart to import with 1 tap:`,
          url: shareableUrl,
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportSuccess(null);

    let rawData = importCodeText.trim();
    if (!rawData) {
      setImportError('Please enter a schedule code or paste the shared link.');
      return;
    }

    // Handle full URL with query param ?import_sched=...
    if (rawData.includes('import_sched=')) {
      const match = rawData.match(/import_sched=([^&]+)/);
      if (match) {
        rawData = decodeURIComponent(match[1]);
      }
    } else if (rawData.startsWith('ATTEND_SCHED:')) {
      rawData = rawData.replace('ATTEND_SCHED:', '');
    }

    try {
      const decodedJson = decodeURIComponent(escape(atob(rawData)));
      const parsed = JSON.parse(decodedJson);

      if (
        parsed.type === 'ATTENDSMART_SCHEDULE_SHARE_V1' &&
        Array.isArray(parsed.subjects) &&
        Array.isArray(parsed.slots)
      ) {
        // Map subjects to target semester
        const subjectIdMap = new Map<string, string>();
        const mappedSubjects: Subject[] = parsed.subjects.map((sub: any) => {
          const newId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          subjectIdMap.set(sub.id, newId);
          return {
            id: newId,
            semesterId: importTargetSemId,
            code: sub.code,
            name: sub.name,
            teacher: sub.teacher || '',
            room: sub.room || '',
            color: sub.color || 'blue',
            targetPercentage: sub.targetPercentage || 75,
            manualAttended: 0,
            manualConducted: 0,
          };
        });

        // Map slots to new subject IDs and target semester
        const mappedSlots: TimetableSlot[] = parsed.slots.map((slot: any) => ({
          id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          semesterId: importTargetSemId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subjectId: subjectIdMap.get(slot.subjectId) || slot.subjectId,
          room: slot.room,
          type: slot.type || 'theory',
        }));

        onImportSharedSchedule(importTargetSemId, mappedSubjects, mappedSlots);
        setImportSuccess(
          `Successfully imported ${mappedSubjects.length} subjects and ${mappedSlots.length} timetable slots!`
        );
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setImportError('Invalid schedule structure format.');
      }
    } catch (err) {
      setImportError('Failed to decode schedule. Please check the code and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-900 text-white">
              <Share2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Share Class Timetable</h3>
              <p className="text-xs text-slate-500">
                Transfer weekly timetable to classmates or your other device.
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

        {/* Tab Switcher */}
        <div className="mt-4 flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'share'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Share to Another Device</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import Schedule Code</span>
          </button>
        </div>

        {activeTab === 'share' ? (
          <div className="mt-4 space-y-4">
            {/* Semester Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Semester Schedule to Share:
              </label>
              <select
                value={selectedSemId}
                onChange={(e) => setSelectedSemId(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({subjects.filter((sub) => sub.semesterId === s.id).length} subjects)
                  </option>
                ))}
              </select>
            </div>

            {/* Offline Canvas QR Code */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
              <canvas
                ref={canvasRef}
                className="rounded-xl shadow-sm border border-slate-200 bg-white max-w-[200px] h-auto"
              />
              <span className="text-xs font-bold text-slate-800 mt-2.5">
                Scan with any phone camera
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Instantly transfers {semSlots.length} class slots and {semSubjects.length} subjects
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>
            </div>

            {/* WhatsApp Text Code */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Or Copy Code for Classmates:</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={shareCode}
                className="w-full text-[11px] font-mono text-slate-600 bg-white border border-slate-200 rounded p-1.5 select-all"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleImportSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Semester (Where to save this timetable):
              </label>
              <select
                value={importTargetSemId}
                onChange={(e) => setImportTargetSemId(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste Shared Link or Schedule Code:
              </label>
              <textarea
                rows={4}
                required
                placeholder="Paste the link or ATTEND_SCHED:ey... code from your classmate here"
                value={importCodeText}
                onChange={(e) => setImportCodeText(e.target.value)}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
              >
                Import Schedule Now
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
