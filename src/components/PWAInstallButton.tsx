import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6750A4] bg-[#EADDFF] hover:bg-[#D0BCFF] rounded-full transition shadow-xs"
        title="Install Sen Slides as offline PWA desktop app"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install Offline App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#49454F] bg-[#ECE6F0] hover:bg-[#E6E0E9] rounded-full transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#FEF7FF] p-6 shadow-2xl border border-[#CAC4D0]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#1C1B1F]">Install Sen Slides on iOS</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[#49454F] leading-relaxed mb-4">
                1. Tap the <strong>Share</strong> icon in Safari toolbar.<br />
                2. Scroll down and choose <strong>Add to Home Screen</strong>.<br />
                3. Enjoy full offline access anytime without connection!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-full bg-[#6750A4] text-white py-2.5 text-sm font-semibold hover:bg-[#523e85] transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
