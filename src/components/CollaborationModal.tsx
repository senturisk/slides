import React, { useState } from 'react';
import { Collaborator, Presentation } from '../types';
import { collabService } from '../services/peerCollab';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Wifi, 
  X, 
  LogIn, 
  Radio, 
  UserCheck, 
  LogOut 
} from 'lucide-react';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  presentation: Presentation;
  onApplyRemotePresentation: (pres: Presentation) => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  presentation,
  onApplyRemotePresentation,
}) => {
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [userName, setUserName] = useState(collabService.myName);
  const [isJoining, setIsJoining] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleStartHosting = async () => {
    try {
      setIsHosting(true);
      setErrorMessage('');
      await collabService.startHosting(presentation);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Failed to start room');
    } finally {
      setIsHosting(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) return;
    try {
      setIsJoining(true);
      setErrorMessage('');
      const success = await collabService.joinSession(joinCode.trim());
      if (!success) {
        setErrorMessage('Could not connect to room. Please check the room code.');
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Failed to join');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyLink = () => {
    const code = collabService.roomId || collabService.myPeerId;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = (name: string) => {
    setUserName(name);
    collabService.setUserName(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 select-none animate-fade-in">
      <div className="w-full max-w-md bg-[#FEF7FF] border border-[#CAC4D0] rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E6E0E9] flex items-center justify-between bg-[#F3EDF7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#21005D]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1B1F]">Real-time Collaboration</h3>
              <p className="text-[11px] text-[#49454F]">Live peer editing & cursor tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#49454F] hover:bg-[#E6E0E9] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-[#1C1B1F]">
          {/* User Profile */}
          <div className="space-y-1.5">
            <label className="font-bold text-[11px] text-[#49454F] uppercase tracking-wider">
              Your Name & Color
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border border-black/20 shrink-0"
                style={{ backgroundColor: collabService.myColor }}
              />
              <input
                type="text"
                value={userName}
                onChange={(e) => handleSaveName(e.target.value)}
                placeholder="Enter your collaborator name"
                className="flex-1 bg-white border border-[#CAC4D0] rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#EA8600]"
              />
            </div>
          </div>

          {/* Connected State */}
          {collabService.isConnected ? (
            <div className="space-y-4 bg-white border border-[#CAC4D0] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#386A20] animate-pulse" />
                  <span className="font-bold text-xs text-[#386A20]">
                    {collabService.isHost ? 'Hosting Active Room' : 'Connected as Peer'}
                  </span>
                </div>
                <button
                  onClick={() => collabService.leaveSession()}
                  className="flex items-center gap-1 text-[11px] text-[#B3261E] hover:underline"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Leave</span>
                </button>
              </div>

              {/* Room Code */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Room Code</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#F8F9FD] border border-[#E6E0E9] rounded-xl px-3 py-2 font-mono font-bold text-sm text-[#1C1B1F] truncate">
                    {collabService.roomId}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-[#EADDFF] hover:bg-[#D0BCFF] text-[#21005D] rounded-xl font-semibold flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Connected Collaborators list */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-500 uppercase font-bold">
                  Active Users ({collaborators.length + 1})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {/* You */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#F3EDF7]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: collabService.myColor }}
                      />
                      <span className="font-bold text-xs">{userName} (You)</span>
                    </div>
                    <span className="text-[10px] text-[#6750A4] font-semibold">
                      {collabService.isHost ? 'Host' : 'Guest'}
                    </span>
                  </div>

                  {/* Other peers */}
                  {collaborators.map((c) => (
                    <div key={c.peerId} className="flex items-center justify-between p-2 rounded-xl bg-[#F8F9FD]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="font-medium text-xs">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">Live cursor active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Not Connected Options: Host or Join */
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-[11px] font-medium border border-red-200">
                  {errorMessage}
                </div>
              )}

              {/* Option 1: Start Room */}
              <div className="p-4 bg-white border border-[#CAC4D0] rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#EA8600]" />
                  <span className="font-bold text-xs">Host a New Session</span>
                </div>
                <p className="text-[11px] text-[#49454F] leading-relaxed">
                  Start a collaborative room and share the room code with colleagues or students for real-time cursor tracking.
                </p>
                <button
                  onClick={handleStartHosting}
                  disabled={isHosting}
                  className="w-full py-2.5 bg-[#EA8600] hover:bg-[#D47900] text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isHosting ? 'Initializing Peer Network...' : 'Start Collaboration Room'}</span>
                </button>
              </div>

              {/* Option 2: Join Existing Room */}
              <div className="p-4 bg-white border border-[#CAC4D0] rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-[#6750A4]" />
                  <span className="font-bold text-xs">Join an Existing Room</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter Host Room Code (e.g. sen-123456)"
                    className="flex-1 bg-[#F8F9FD] border border-[#CAC4D0] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#6750A4]"
                  />
                  <button
                    onClick={handleJoinSession}
                    disabled={isJoining || !joinCode.trim()}
                    className="px-4 py-2 bg-[#6750A4] hover:bg-[#523e85] disabled:opacity-40 text-white font-bold rounded-xl transition"
                  >
                    {isJoining ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info footer */}
          <p className="text-[10px] text-center text-gray-500 leading-normal">
            Direct Peer-to-Peer WebRTC channels • Zero tracking • Complete privacy by Senturisk
          </p>
        </div>
      </div>
    </div>
  );
};
