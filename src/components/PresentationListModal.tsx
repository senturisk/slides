import React, { useState, useEffect } from 'react';
import { Presentation } from '../types';
import { getAllPresentations, deletePresentation } from '../services/storage';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Clock, 
  X, 
  ChevronRight, 
  FileCheck 
} from 'lucide-react';

interface PresentationListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPresentationId: string;
  onSelectPresentation: (presentation: Presentation) => void;
  onNewPresentation: () => void;
}

export const PresentationListModal: React.FC<PresentationListModalProps> = ({
  isOpen,
  onClose,
  currentPresentationId,
  onSelectPresentation,
  onNewPresentation,
}) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadList = async () => {
    setLoading(true);
    const list = await getAllPresentations();
    setPresentations(list);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (presentations.length <= 1) {
      alert('Cannot delete the last remaining presentation.');
      return;
    }
    if (confirm('Are you sure you want to delete this presentation from offline browser storage?')) {
      await deletePresentation(id);
      loadList();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg bg-[#FEF7FF] border border-[#CAC4D0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E6E0E9] flex items-center justify-between bg-[#F3EDF7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#21005D]">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1B1F]">Saved Decks (Offline Storage)</h3>
              <p className="text-[11px] text-[#49454F]">Stored securely in browser IndexedDB</p>
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
        <div className="p-6 flex-1 overflow-y-auto space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6E0E9]">
            <span className="font-bold text-[#49454F] uppercase tracking-wider text-[10px]">
              {presentations.length} Stored Presentations
            </span>
            <button
              onClick={() => {
                onNewPresentation();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EA8600] hover:bg-[#D47900] text-white rounded-full font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Deck</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading stored decks...</div>
          ) : presentations.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No presentations found</div>
          ) : (
            <div className="space-y-2">
              {presentations.map((p) => {
                const isCurrent = p.id === currentPresentationId;
                const formattedDate = new Date(p.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPresentation(p);
                      onClose();
                    }}
                    className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer group ${
                      isCurrent
                        ? 'border-[#EA8600] bg-[#FFF8E1] shadow-xs'
                        : 'border-[#E6E0E9] bg-white hover:border-[#6750A4] hover:bg-[#F8F9FD]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F3EDF7] border border-[#CAC4D0] flex items-center justify-center shrink-0">
                        <FileCheck className={`w-5 h-5 ${isCurrent ? 'text-[#EA8600]' : 'text-[#6750A4]'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#1C1B1F] truncate group-hover:text-[#EA8600] transition">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          <span>{p.slides.length} slides</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#EA8600] bg-[#FFE082] px-2 py-0.5 rounded-full mr-2">
                          Active
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, p.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                        title="Delete from browser storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#EA8600] transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
