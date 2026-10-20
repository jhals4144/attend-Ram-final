import React, { useState } from 'react';
import { Semester, SubjectWithStats } from '../types/attendance';
import { calculateAttendanceStats } from '../utils/calculator';
import {
  Calculator,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sparkles,
  Info,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';

interface BunkCalculatorProps {
  activeSemester: Semester | null;
  subjectsWithStats: SubjectWithStats[];
  onUpdateSemesterTarget?: (newTarget: number) => void;
}

export const BunkCalculator: React.FC<BunkCalculatorProps> = ({
  activeSemester,
  subjectsWithStats,
  onUpdateSemesterTarget,
}) => {
  const [targetPct, setTargetPct] = useState<number>(
    activeSemester?.targetPercentage || 75
  );

  // Simulator State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjectsWithStats[0]?.id || 'overall'
  );
  const [attendMoreCount, setAttendMoreCount] = useState<number>(3);
  const [bunkMoreCount, setBunkMoreCount] = useState<number>(0);

  if (!activeSemester) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Please select an active semester.
      </div>
    );
  }

  // Calculate overall metrics
  const totalAttended = subjectsWithStats.reduce((acc, s) => acc + s.stats.attended, 0);
  const totalConducted = subjectsWithStats.reduce((acc, s) => acc + s.stats.conducted, 0);
  const overallStats = calculateAttendanceStats(totalAttended, totalConducted, targetPct);

  // Re-calculate subject stats with current dynamic targetPct
  const recalculatedSubjects = subjectsWithStats.map((s) => {
    const stats = calculateAttendanceStats(s.stats.attended, s.stats.conducted, targetPct);
    return {
      ...s,
      dynamicStats: stats,
    };
  });

  // Simulator calculations
  let simAttended = totalAttended;
  let simConducted = totalConducted;
  let simTarget = targetPct;
  let simSubjectName = 'Overall Semester';

  if (selectedSubjectId !== 'overall') {
    const foundSub = recalculatedSubjects.find((s) => s.id === selectedSubjectId);
    if (foundSub) {
      simAttended = foundSub.stats.attended;
      simConducted = foundSub.stats.conducted;
      simTarget = foundSub.stats.targetPercentage;
      simSubjectName = foundSub.name;
    }
  }

  // If user simulates attending +X or bunking +Y:
  // Attended + attendMoreCount
  // Conducted + attendMoreCount + bunkMoreCount
  const projectedAttended = simAttended + attendMoreCount;
  const projectedConducted = simConducted + attendMoreCount + bunkMoreCount;
  const projectedStats = calculateAttendanceStats(
    projectedAttended,
    projectedConducted,
    simTarget
  );

  const currentSimPct =
    simConducted > 0 ? Math.round((simAttended / simConducted) * 1000) / 10 : 100;
  const diffPct = Math.round((projectedStats.percentage - currentSimPct) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Target Setting Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-900 text-white">
                <Calculator className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Attendance & Bunk Calculator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target requirement: {targetPct}%
            </p>
          </div>

          {/* Quick Target Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Target:</span>
            {[65, 75, 80, 85].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setTargetPct(preset);
                  if (onUpdateSemesterTarget) onUpdateSemesterTarget(preset);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  targetPct === preset
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {/* Target Slider */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500 shrink-0">Custom Target:</span>
          <input
            type="range"
            min="50"
            max="95"
            step="1"
            value={targetPct}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTargetPct(val);
              if (onUpdateSemesterTarget) onUpdateSemesterTarget(val);
            }}
            className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <span className="font-mono font-bold text-sm text-slate-900 shrink-0 w-12 text-right">
            {targetPct}%
          </span>
        </div>
      </div>

      {/* Global Status Result Banner */}
      <div
        className={`rounded-xl border p-5 ${
          overallStats.percentage >= targetPct
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                overallStats.percentage >= targetPct
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-rose-600 text-white shadow-sm'
              }`}
            >
              {overallStats.percentage >= targetPct ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">
                  {overallStats.percentage >= targetPct
                    ? `Eligible (${overallStats.percentage}%)`
                    : `Shortage (${overallStats.percentage}%)`}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/80 border border-current">
                  Goal: {targetPct}%
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {overallStats.percentage >= targetPct ? (
                  <>
                    Attended <strong className="font-mono">{overallStats.attended}</strong> /{' '}
                    <strong className="font-mono">{overallStats.conducted}</strong> classes. Safe to bunk{' '}
                    <strong className="font-mono font-bold text-emerald-700">
                      {overallStats.safeBunks}
                    </strong>{' '}
                    more classes.
                  </>
                ) : (
                  <>
                    Attended <strong className="font-mono">{overallStats.attended}</strong> /{' '}
                    <strong className="font-mono">{overallStats.conducted}</strong> classes. Attend next{' '}
                    <strong className="font-mono font-bold text-rose-700">
                      {overallStats.classesNeeded}
                    </strong>{' '}
                    consecutive classes to reach {targetPct}%.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-500 block">Classes to Next Milestone</span>
            <span
              className={`text-2xl font-mono font-bold ${
                overallStats.percentage >= targetPct ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {overallStats.percentage >= targetPct
                ? `${overallStats.safeBunks} Bunks Left`
                : `${overallStats.classesNeeded} Must Attend`}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive "What-If" Simulator Sandbox */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-slate-900" />
          <h3 className="text-sm font-bold text-slate-900">
            Interactive "What-If" Simulator (Future Projection)
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          See what happens to your percentage if you attend or miss upcoming classes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Subject / Scope
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="overall">All Subjects (Overall Semester)</option>
              {recalculatedSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.stats.percentage}%
                </option>
              ))}
            </select>
          </div>

          {/* Attend More Classes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-emerald-800">
                If I ATTEND next classes:
              </label>
              <span className="text-xs font-mono font-bold text-emerald-700">
                +{attendMoreCount}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={attendMoreCount}
              onChange={(e) => setAttendMoreCount(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0 classes</span>
              <span>10</span>
              <span>20 classes</span>
            </div>
          </div>

          {/* Bunk / Miss More Classes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-rose-800">
                If I MISS / BUNK next classes:
              </label>
              <span className="text-xs font-mono font-bold text-rose-700">
                +{bunkMoreCount}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              value={bunkMoreCount}
              onChange={(e) => setBunkMoreCount(Number(e.target.value))}
              className="w-full accent-rose-600 h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0 classes</span>
              <span>7</span>
              <span>15 classes</span>
            </div>
          </div>
        </div>

        {/* Simulation Output Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500">
              Projected Outcome for: <strong className="text-slate-900">{simSubjectName}</strong>
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-lg font-mono font-bold text-slate-500">
                {currentSimPct}%
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span
                className={`text-2xl font-mono font-bold ${
                  projectedStats.percentage >= simTarget ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {projectedStats.percentage}%
              </span>
              <span
                className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                  diffPct >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 sm:text-right space-y-0.5">
            <div>
              New Attended: <strong className="font-mono text-slate-900">{projectedAttended}</strong> /{' '}
              {projectedConducted}
            </div>
            <div>
              Status:{' '}
              <strong
                className={
                  projectedStats.percentage >= simTarget
                    ? 'text-emerald-700 font-bold'
                    : 'text-rose-700 font-bold'
                }
              >
                {projectedStats.percentage >= simTarget
                  ? 'Eligible for Exams'
                  : 'Debarred / Below Target'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Detailed Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Subject-Wise Target Analysis ({targetPct}% Threshold)
            </h3>
            <p className="text-xs text-slate-500">
              Classes needed to attend vs safe bunks remaining per subject
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-4 font-semibold">Subject</th>
                <th className="py-2.5 px-3 font-semibold text-right">Attended / Total</th>
                <th className="py-2.5 px-3 font-semibold text-right">Current %</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right text-rose-700">
                  Classes Needed
                </th>
                <th className="py-2.5 px-4 font-semibold text-right text-emerald-700">
                  Safe Bunks
                </th>
                <th className="py-2.5 px-4 font-semibold text-right">Next Class (+1 / -1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recalculatedSubjects.map((subj) => {
                const isSafe = subj.dynamicStats.percentage >= targetPct;

                return (
                  <tr key={subj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{subj.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{subj.code}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {subj.dynamicStats.attended} / {subj.dynamicStats.conducted}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      <span
                        className={isSafe ? 'text-emerald-700' : 'text-rose-700'}
                      >
                        {subj.dynamicStats.percentage}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isSafe
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isSafe ? 'Safe Zone' : 'Shortage'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {subj.dynamicStats.classesNeeded > 0 ? (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Attend {subj.dynamicStats.classesNeeded}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0 (On Track)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {subj.dynamicStats.safeBunks > 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {subj.dynamicStats.safeBunks} bunks
                        </span>
                      ) : (
                        <span className="text-rose-600 font-normal">0 safe bunks</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                      <span className="text-emerald-700">
                        {subj.dynamicStats.nextClassAttendedPct}%
                      </span>{' '}
                      /{' '}
                      <span className="text-rose-600">
                        {subj.dynamicStats.nextClassMissedPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* College Rules & Formula Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Info className="w-4 h-4 text-slate-500" />
          <span>How AttendSmart Calculates Attendance</span>
        </div>
        <p className="leading-relaxed">
          <strong>Classes to attend formula:</strong> To reach target $T\%$ when currently at $A$ attended and $C$ conducted, you need $X$ consecutive attended lectures calculated as:
          <code className="mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">
            X = ceil((T × C - 100 × A) / (100 - T))
          </code>
        </p>
        <p className="leading-relaxed">
          <strong>Safe bunks formula:</strong> If you are already at or above $T\%$, the number of classes $Y$ you can skip without dropping below $T\%$ is:
          <code className="mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">
            Y = floor((100 × A - T × C) / T)
          </code>
        </p>
      </div>
    </div>
  );
};
