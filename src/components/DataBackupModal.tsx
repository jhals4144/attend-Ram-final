import React, { useRef, useState } from 'react';
import {
  AttendanceRecord,
  Semester,
  Subject,
  TimetableSlot,
} from '../types/attendance';
import { exportBackupJSON, getInitialData } from '../utils/storage';
import {
  Download,
  Upload,
  RotateCcw,
  X,
  FileCheck,
  AlertTriangle,
  Database,
  Check,
} from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesters: Semester[];
  subjects: Subject[];
  timetable: TimetableSlot[];
  records: AttendanceRecord[];
  onImportData: (data: {
    semesters: Semester[];
    subjects: Subject[];
    timetable: TimetableSlot[];
    records: AttendanceRecord[];
  }) => void;
  onResetData: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  semesters,
  subjects,
  timetable,
  records,
  onImportData,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportBackupJSON(semesters, subjects, timetable, records);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendsmart_backup_2ndyear_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setImportStatus('Backup downloaded successfully!');
    setIsError(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (
          Array.isArray(parsed.semesters) &&
          Array.isArray(parsed.subjects) &&
          Array.isArray(parsed.timetable) &&
          Array.isArray(parsed.records)
        ) {
          onImportData({
            semesters: parsed.semesters,
            subjects: parsed.subjects,
            timetable: parsed.timetable,
            records: parsed.records,
          });
          setImportStatus('Backup restored successfully!');
          setIsError(false);
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setIsError(true);
          setImportStatus('Invalid JSON backup file structure.');
        }
      } catch (err) {
        setIsError(true);
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset to default 2nd Year sample timetable and attendance data? All current records will be restored to initial sample.'
      )
    ) {
      onResetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-900 text-white">
              <Database className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Data Backup & Export</h3>
              <p className="text-xs text-slate-500">
                Save your whole year attendance to file or restore on another device.
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

        {/* Current Data Summary */}
        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span>Semesters Tracked:</span>
            <strong className="font-mono text-slate-900">{semesters.length}</strong>
          </div>
          <div className="flex justify-between">
            <span>Total Subjects:</span>
            <strong className="font-mono text-slate-900">{subjects.length}</strong>
          </div>
          <div className="flex justify-between">
            <span>Timetable Slots:</span>
            <strong className="font-mono text-slate-900">{timetable.length}</strong>
          </div>
          <div className="flex justify-between">
            <span>Attendance Logs Saved:</span>
            <strong className="font-mono text-slate-900">{records.length} entries</strong>
          </div>
        </div>

        {importStatus && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              isError
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExport}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export & Download Backup JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Restore Backup from File</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo 2nd Year Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
