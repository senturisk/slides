import React, { useEffect, useState } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-[#313033] px-3.5 py-1.5 text-xs font-medium text-[#F4EFF4] shadow-lg border border-[#49454F] animate-fade-in">
        <WifiOff className="w-3.5 h-3.5 text-[#FFB4AB]" />
        <span>Working Offline • Files auto-saved to IndexedDB</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-[#1C1B1F] px-3.5 py-1.5 text-xs font-medium text-[#D0E6D3] shadow-lg border border-[#49454F] animate-fade-in">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#86DF8F]" />
        <span>Back Online • Sen Slides synced</span>
      </div>
    );
  }

  return null;
};
