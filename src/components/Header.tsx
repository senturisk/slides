import React, { useState, useRef, useEffect } from 'react';
import { Presentation, Slide } from '../types';
import { 
  Play, 
  Users, 
  Save, 
  Download, 
  Upload, 
  Plus, 
  FolderOpen, 
  Undo, 
  Redo, 
  ChevronDown, 
  FileCode, 
  Image as ImageIcon, 
  Printer, 
  SlidersHorizontal,
  CheckCircle,
  Copy
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  exportToSenFile, 
  exportSlideAsPNG, 
  exportStandaloneHTML, 
  exportToPPTX, 
  exportToODP 
} from '../services/exportImport';

interface HeaderProps {
  presentation: Presentation;
  currentSlide: Slide;
  onUpdateTitle: (newTitle: string) => void;
  onNewPresentation: () => void;
  onOpenPresentationList: () => void;
  onImportPresentation: (file: File) => void;
  onPresent: () => void;
  onOpenCollab: () => void;
  collaboratorCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleInspector: () => void;
  isInspectorOpen: boolean;
  isSaving: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  presentation,
  currentSlide,
  onUpdateTitle,
  onNewPresentation,
  onOpenPresentationList,
  onImportPresentation,
  onPresent,
  onOpenCollab,
  collaboratorCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggleInspector,
  isInspectorOpen,
  isSaving,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(presentation.title);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempTitle(presentation.title);
  }, [presentation.title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    } else {
      setTempTitle(presentation.title);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportPresentation(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFileMenuOpen(false);
  };

  return (
    <header className="h-14 w-full bg-[#FEF7FF] border-b border-[#E6E0E9] px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 select-none z-40 shadow-2xs">
      {/* Hidden File Input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".pptx,.odp,.ppt,.sen,.json"
        className="hidden"
      />

      {/* Left: Brand + Title + File Menu */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Brand Icon & Title */}
        <div className="flex items-center gap-2">
          <img
            src="/icon.svg"
            alt="Sen Slides"
            className="w-8 h-8 rounded-xl object-contain shadow-xs bg-[#F6F4FB] border border-[#E6E0E9]"
          />
          <div className="hidden md:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[#1C1B1F] tracking-tight">Sen Slides</span>
              <span className="text-[10px] font-semibold text-[#6750A4] bg-[#EADDFF] px-1.5 py-0.2 rounded-full">
                by Senturisk
              </span>
            </div>
          </div>
        </div>

        {/* File Menu Dropdown */}
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#49454F] hover:bg-[#ECE6F0] rounded-full transition"
          >
            <span>File</span>
            <ChevronDown className="w-3 h-3 text-[#79747E]" />
          </button>

          {fileMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-[#CAC4D0] rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in text-xs text-[#1C1B1F]">
              <button
                onClick={() => {
                  onNewPresentation();
                  setFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <Plus className="w-4 h-4 text-[#EA8600]" />
                <span>New Presentation</span>
              </button>
              <button
                onClick={() => {
                  onOpenPresentationList();
                  setFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <FolderOpen className="w-4 h-4 text-[#6750A4]" />
                <span>My Saved Decks (Offline Storage)</span>
              </button>
              <div className="h-px bg-[#E6E0E9] my-1" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <Upload className="w-4 h-4 text-[#0B57D0]" />
                <div className="flex flex-col">
                  <span>Import Presentation</span>
                  <span className="text-[10px] text-gray-500 font-normal">.pptx, .odp, .ppt, .sen, .json</span>
                </div>
              </button>
              <div className="h-px bg-[#E6E0E9] my-1" />
              <button
                onClick={async () => {
                  setFileMenuOpen(false);
                  try {
                    await exportToPPTX(presentation);
                  } catch (err) {
                    alert('Failed to export to PowerPoint: ' + (err as Error).message);
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <Download className="w-4 h-4 text-[#D24726]" />
                <div className="flex flex-col">
                  <span>Export PowerPoint (.pptx)</span>
                  <span className="text-[10px] text-gray-500 font-normal">Native Microsoft PowerPoint presentation</span>
                </div>
              </button>
              <button
                onClick={async () => {
                  setFileMenuOpen(false);
                  try {
                    await exportToODP(presentation);
                  } catch (err) {
                    alert('Failed to export to OpenDocument: ' + (err as Error).message);
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <Download className="w-4 h-4 text-[#2B78E4]" />
                <div className="flex flex-col">
                  <span>Export OpenDocument (.odp)</span>
                  <span className="text-[10px] text-gray-500 font-normal">LibreOffice &amp; OpenOffice format</span>
                </div>
              </button>
              <button
                onClick={() => {
                  exportToSenFile(presentation);
                  setFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <Download className="w-4 h-4 text-[#386A20]" />
                <div className="flex flex-col">
                  <span>Export Sen Slides (.sen)</span>
                  <span className="text-[10px] text-gray-500 font-normal">Lossless native project file</span>
                </div>
              </button>
              <div className="h-px bg-[#E6E0E9] my-1" />
              <button
                onClick={() => {
                  exportSlideAsPNG(currentSlide, `${presentation.title}_slide`);
                  setFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <ImageIcon className="w-4 h-4 text-[#7D5260]" />
                <span>Export Slide as PNG Image</span>
              </button>
              <button
                onClick={() => {
                  exportStandaloneHTML(presentation);
                  setFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <FileCode className="w-4 h-4 text-[#B06000]" />
                <span>Export Standalone Offline HTML</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                  setFileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F3EDF7] rounded-xl text-left font-medium"
              >
                <Printer className="w-4 h-4 text-[#49454F]" />
                <span>Print / Save as PDF Deck</span>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-[#CAC4D0] hidden sm:block" />

        {/* Editable Presentation Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTempTitle(presentation.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="px-2 py-0.5 text-sm font-semibold text-[#1C1B1F] bg-white border border-[#EA8600] rounded-lg outline-none max-w-[180px] sm:max-w-[280px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="px-2 py-0.5 text-sm font-semibold text-[#1C1B1F] hover:bg-[#ECE6F0] rounded-lg truncate max-w-[140px] sm:max-w-[240px] text-left transition"
              title="Click to rename presentation"
            >
              {presentation.title}
            </button>
          )}

          {/* Offline Persistent storage sync status */}
          <div
            className="flex items-center text-[11px] text-[#49454F] gap-1 px-1.5 py-0.5 rounded-full bg-[#F3EDF7] hidden lg:flex"
            title="All changes are automatically saved to your browser IndexedDB offline storage"
          >
            {isSaving ? (
              <>
                <div className="w-2 h-2 rounded-full bg-[#EA8600] animate-pulse" />
                <span>Saving offline...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-[#386A20]" />
                <span>Saved to storage</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: Undo / Redo */}
      <div className="hidden md:flex items-center gap-1 bg-[#F3EDF7] p-0.5 rounded-full">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-full transition ${
            canUndo ? 'text-[#1C1B1F] hover:bg-white' : 'text-[#CAC4D0] cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-full transition ${
            canRedo ? 'text-[#1C1B1F] hover:bg-white' : 'text-[#CAC4D0] cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Collaboration + Present + Inspector Toggle + PWA */}
      <div className="flex items-center gap-2 shrink-0">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Real-time Collaboration Button */}
        <button
          onClick={onOpenCollab}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition shadow-2xs ${
            collaboratorCount > 0
              ? 'bg-[#EADDFF] text-[#21005D] border border-[#D0BCFF]'
              : 'bg-[#ECE6F0] text-[#49454F] hover:bg-[#E6E0E9]'
          }`}
          title="Collaborative editing mode with real-time cursor tracking"
        >
          <Users className="w-3.5 h-3.5 text-[#6750A4]" />
          <span className="hidden sm:inline">
            {collaboratorCount > 0 ? `Collaborating (${collaboratorCount})` : 'Collaborate'}
          </span>
          {collaboratorCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#386A20] animate-ping" />
          )}
        </button>

        {/* Present Button - Material You Gold Pill */}
        <button
          onClick={onPresent}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#EA8600] hover:bg-[#D47900] active:scale-95 rounded-full transition shadow-xs"
          title="Start Slideshow presentation"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Present</span>
        </button>

        {/* Inspector Panel Toggle Button */}
        <button
          onClick={onToggleInspector}
          className={`p-2 rounded-full transition hidden sm:flex ${
            isInspectorOpen ? 'bg-[#EADDFF] text-[#21005D]' : 'text-[#49454F] hover:bg-[#ECE6F0]'
          }`}
          title="Toggle formatting & layout panel"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
