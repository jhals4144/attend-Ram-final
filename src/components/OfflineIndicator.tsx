import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700/60 px-3.5 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md animate-fade-in">
      <WifiOff className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>Offline Mode Active · All Attendance Saved Locally</span>
    </div>
  );
};
