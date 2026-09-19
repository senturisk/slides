import React, { useState } from 'react';
import { Presentation, Slide, SlideElement, SlideLayout, PresentationTheme } from '../types';
import { 
  Play, 
  Layers, 
  Plus, 
  Paintbrush, 
  Sparkles, 
  Users, 
  Download, 
  Upload, 
  FolderOpen, 
  Sliders, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon, 
  Table as TableIcon,
  Trash2,
  Copy,
  Magnet,
  Grid
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { THEMES } from '../data/themes';
import { exportToPPTX, exportToODP, exportToSenFile } from '../services/exportImport';

interface MobileLayoutProps {
  presentation: Presentation;
  currentSlide: Slide;
  activeSlideIndex: number;
  onSelectSlide: (id: string) => void;
  onAddSlide: (layout: SlideLayout) => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  selectedElement: SlideElement | null;
  onUpdateElement: (element: SlideElement) => void;
  onAddElement: (element: SlideElement) => void;
  onDeleteElement: (id: string) => void;
  onUpdateSlide: (slide: Slide) => void;
  onPresent: () => void;
  onOpenCollab: () => void;
  onOpenSavedDecks: () => void;
  onSelectTheme: (theme: PresentationTheme) => void;
  collaboratorCount: number;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  showGrid: 'none' | 'dots' | 'lines';
  onCycleGrid: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  presentation,
  currentSlide,
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  selectedElement,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
  onUpdateSlide,
  onPresent,
  onOpenCollab,
  onOpenSavedDecks,
  onSelectTheme,
  collaboratorCount,
  snapEnabled,
  onToggleSnap,
  showGrid,
  onCycleGrid,
}) => {
  const [activeSheet, setActiveSheet] = useState<'slides' | 'insert' | 'format' | 'more' | null>(null);

  const slides = presentation.slides;

  const handleNextSlide = () => {
    if (activeSlideIndex < slides.length - 1) {
      onSelectSlide(slides[activeSlideIndex + 1].id);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      onSelectSlide(slides[activeSlideIndex - 1].id);
    }
  };

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="h-12 w-full bg-[#FEF7FF] border-b border-[#E6E0E9] px-3 flex items-center justify-between shrink-0 select-none z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FBBC04] to-[#EA8600] flex items-center justify-center text-white font-extrabold text-xs shadow-2xs">
            Sen
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs text-[#1C1B1F] truncate">{presentation.title}</span>
            <span className="text-[9px] text-[#6750A4] font-semibold">by Senturisk</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenCollab}
            className={`p-1.5 rounded-full transition ${
              collaboratorCount > 0 ? 'bg-[#EADDFF] text-[#21005D]' : 'bg-[#ECE6F0] text-[#49454F]'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={onPresent}
            className="flex items-center gap-1 px-3 py-1 bg-[#EA8600] text-white rounded-full font-bold text-xs shadow-2xs"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Present</span>
          </button>
        </div>
      </div>

      {/* Mobile Slide Navigation Sub-bar */}
      <div className="h-9 w-full bg-[#F3EDF7] border-b border-[#E6E0E9] px-3 flex items-center justify-between shrink-0 select-none">
        <button
          onClick={handlePrevSlide}
          disabled={activeSlideIndex === 0}
          className="p-1 rounded-full text-[#49454F] disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveSheet('slides')}
          className="text-xs font-bold text-[#1C1B1F] bg-white px-3 py-0.5 rounded-full border border-[#CAC4D0] shadow-2xs"
        >
          Slide {activeSlideIndex + 1} of {slides.length} ▾
        </button>
        <button
          onClick={handleNextSlide}
          disabled={activeSlideIndex === slides.length - 1}
          className="p-1 rounded-full text-[#49454F] disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (Material 3 standard) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#FEF7FF] border-t border-[#E6E0E9] px-4 flex items-center justify-around z-30 select-none shadow-lg">
        <button
          onClick={() => setActiveSheet(activeSheet === 'slides' ? null : 'slides')}
          className={`flex flex-col items-center gap-1 ${
            activeSheet === 'slides' ? 'text-[#EA8600]' : 'text-[#79747E]'
          }`}
        >
          <div className={`px-3 py-1 rounded-full ${activeSheet === 'slides' ? 'bg-[#FFE082]' : ''}`}>
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">Slides</span>
        </button>

        <button
          onClick={() => setActiveSheet(activeSheet === 'insert' ? null : 'insert')}
          className={`flex flex-col items-center gap-1 ${
            activeSheet === 'insert' ? 'text-[#6750A4]' : 'text-[#79747E]'
          }`}
        >
          <div className={`px-3 py-1 rounded-full ${activeSheet === 'insert' ? 'bg-[#EADDFF]' : ''}`}>
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">Insert</span>
        </button>

        <button
          onClick={() => setActiveSheet(activeSheet === 'format' ? null : 'format')}
          className={`flex flex-col items-center gap-1 ${
            activeSheet === 'format' ? 'text-[#0B57D0]' : 'text-[#79747E]'
          }`}
        >
          <div className={`px-3 py-1 rounded-full ${activeSheet === 'format' ? 'bg-[#D3E3FD]' : ''}`}>
            <Sliders className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">Format</span>
        </button>

        <button
          onClick={() => setActiveSheet(activeSheet === 'more' ? null : 'more')}
          className={`flex flex-col items-center gap-1 ${
            activeSheet === 'more' ? 'text-[#386A20]' : 'text-[#79747E]'
          }`}
        >
          <div className={`px-3 py-1 rounded-full ${activeSheet === 'more' ? 'bg-[#C8E6C9]' : ''}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">Options</span>
        </button>
      </div>

      {/* Mobile Bottom Sheets */}
      {activeSheet && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/40 backdrop-blur-2xs animate-fade-in">
          <div
            onClick={() => setActiveSheet(null)}
            className="flex-1 w-full"
          />
          <div className="bg-[#FEF7FF] rounded-t-3xl border-t border-[#CAC4D0] p-4 max-h-[70vh] overflow-y-auto space-y-4 shadow-2xl mb-16">
            {/* Sheet Handle */}
            <div className="w-10 h-1 rounded-full bg-[#CAC4D0] mx-auto mb-2" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0E9]">
              <span className="font-bold text-sm text-[#1C1B1F] uppercase tracking-wider">
                {activeSheet === 'slides' && 'Slide Deck'}
                {activeSheet === 'insert' && 'Insert Object'}
                {activeSheet === 'format' && 'Format Properties'}
                {activeSheet === 'more' && 'Presentation Options'}
              </span>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet 1: Slides Manager */}
            {activeSheet === 'slides' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      onAddSlide('title-body');
                      setActiveSheet(null);
                    }}
                    className="flex-1 py-2 bg-[#EA8600] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Slide</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {slides.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSlide(s.id);
                        setActiveSheet(null);
                      }}
                      className={`p-2 rounded-xl border-2 transition ${
                        s.id === currentSlide.id
                          ? 'border-[#EA8600] bg-[#FFF8E1]'
                          : 'border-[#E6E0E9] bg-white'
                      }`}
                    >
                      <div className="aspect-video bg-gray-50 rounded-lg p-1.5 text-[10px] font-bold overflow-hidden border border-gray-200">
                        {idx + 1}. {s.title}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-gray-500">#{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateSlide(s.id);
                            }}
                            className="p-1 text-gray-500 hover:text-black"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {slides.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSlide(s.id);
                              }}
                              className="p-1 text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sheet 2: Insert */}
            {activeSheet === 'insert' && (
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    onAddElement({
                      id: 'el-' + Math.random().toString(36).substring(2, 9),
                      type: 'text',
                      x: 340,
                      y: 280,
                      width: 600,
                      height: 80,
                      rotation: 0,
                      opacity: 1,
                      zIndex: 10,
                      text: 'Heading Title',
                      fontSize: 42,
                      fontWeight: '800',
                    });
                    setActiveSheet(null);
                  }}
                  className="p-3 rounded-2xl bg-white border border-[#CAC4D0] flex flex-col items-center gap-1.5"
                >
                  <Type className="w-6 h-6 text-[#6750A4]" />
                  <span className="text-xs font-bold">Text Heading</span>
                </button>

                <button
                  onClick={() => {
                    onAddElement({
                      id: 'el-' + Math.random().toString(36).substring(2, 9),
                      type: 'shape',
                      shapeType: 'rounded',
                      x: 480,
                      y: 260,
                      width: 240,
                      height: 140,
                      rotation: 0,
                      opacity: 1,
                      zIndex: 10,
                      fill: '#EA8600',
                      borderRadius: 24,
                    });
                    setActiveSheet(null);
                  }}
                  className="p-3 rounded-2xl bg-white border border-[#CAC4D0] flex flex-col items-center gap-1.5"
                >
                  <Square className="w-6 h-6 text-[#EA8600]" />
                  <span className="text-xs font-bold">Rounded Box</span>
                </button>

                <button
                  onClick={() => {
                    onAddElement({
                      id: 'el-' + Math.random().toString(36).substring(2, 9),
                      type: 'shape',
                      shapeType: 'circle',
                      x: 520,
                      y: 240,
                      width: 180,
                      height: 180,
                      rotation: 0,
                      opacity: 1,
                      zIndex: 10,
                      fill: '#0B57D0',
                      borderRadius: 9999,
                    });
                    setActiveSheet(null);
                  }}
                  className="p-3 rounded-2xl bg-white border border-[#CAC4D0] flex flex-col items-center gap-1.5"
                >
                  <Circle className="w-6 h-6 text-[#0B57D0]" />
                  <span className="text-xs font-bold">Circle</span>
                </button>

                <button
                  onClick={() => {
                    onAddElement({
                      id: 'el-' + Math.random().toString(36).substring(2, 9),
                      type: 'table',
                      x: 390,
                      y: 250,
                      width: 500,
                      height: 180,
                      rotation: 0,
                      opacity: 1,
                      zIndex: 10,
                      tableData: [
                        ['Item', 'Value'],
                        ['Metric 1', '100%'],
                      ],
                    });
                    setActiveSheet(null);
                  }}
                  className="p-3 rounded-2xl bg-white border border-[#CAC4D0] flex flex-col items-center gap-1.5"
                >
                  <TableIcon className="w-6 h-6 text-[#386A20]" />
                  <span className="text-xs font-bold">Table</span>
                </button>

                <button
                  onClick={() => {
                    onAddElement({
                      id: 'el-' + Math.random().toString(36).substring(2, 9),
                      type: 'badge',
                      x: 490,
                      y: 300,
                      width: 240,
                      height: 44,
                      rotation: 0,
                      opacity: 1,
                      zIndex: 10,
                      text: '✨ HIGHLIGHT BADGE',
                      fontSize: 14,
                      fontWeight: 'bold',
                      fill: '#FFE082',
                      color: '#B06000',
                      borderRadius: 9999,
                    });
                    setActiveSheet(null);
                  }}
                  className="p-3 rounded-2xl bg-white border border-[#CAC4D0] flex flex-col items-center gap-1.5"
                >
                  <Sparkles className="w-6 h-6 text-[#B06000]" />
                  <span className="text-xs font-bold">Pill Badge</span>
                </button>
              </div>
            )}

            {/* Sheet 3: Format */}
            {activeSheet === 'format' && (
              selectedElement ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-700">Font Size</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onUpdateElement({
                            ...selectedElement,
                            fontSize: Math.max(12, (selectedElement.fontSize || 18) - 4),
                          })
                        }
                        className="px-2 py-1 bg-gray-200 rounded-md font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-sm">
                        {selectedElement.fontSize || 18}px
                      </span>
                      <button
                        onClick={() =>
                          onUpdateElement({
                            ...selectedElement,
                            fontSize: Math.min(100, (selectedElement.fontSize || 18) + 4),
                          })
                        }
                        className="px-2 py-1 bg-gray-200 rounded-md font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="font-bold text-xs text-gray-700">Fill Color</span>
                    <div className="flex items-center gap-1">
                      {['#EA8600', '#6750A4', '#0B57D0', '#386A20', '#FFFFFF', '#1C1B1F'].map(
                        (col) => (
                          <button
                            key={col}
                            onClick={() => onUpdateElement({ ...selectedElement, fill: col })}
                            style={{ backgroundColor: col }}
                            className="w-6 h-6 rounded-full border border-black/20"
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onDeleteElement(selectedElement.id)}
                      className="w-full py-2 bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Element</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs">
                  Tap any element on the slide to edit its properties.
                </div>
              )
            )}

            {/* Sheet 4: More / Options */}
            {activeSheet === 'more' && (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onToggleSnap();
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between ${
                    snapEnabled ? 'border-[#6750A4] bg-[#EADDFF]' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Magnet className="w-4 h-4 text-[#6750A4]" />
                    <span className="font-bold text-xs">Canva Smart Autosnap</span>
                  </div>
                  <span className="text-[10px] font-mono">{snapEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => {
                    onCycleGrid();
                  }}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-[#EA8600]" />
                    <span className="font-bold text-xs">Canvas Grid Mode</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold">{showGrid}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenSavedDecks();
                    setActiveSheet(null);
                  }}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#0B57D0]" />
                    <span className="font-bold text-xs">Saved Decks (Offline Storage)</span>
                  </div>
                </button>

                {/* Native Export Options */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Export Presentation
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={async () => {
                        setActiveSheet(null);
                        await exportToPPTX(presentation);
                      }}
                      className="p-2 rounded-xl border border-gray-200 text-center text-xs font-semibold hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mx-auto mb-1 text-[#D24726]" />
                      <span>.PPTX</span>
                    </button>
                    <button
                      onClick={async () => {
                        setActiveSheet(null);
                        await exportToODP(presentation);
                      }}
                      className="p-2 rounded-xl border border-gray-200 text-center text-xs font-semibold hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mx-auto mb-1 text-[#2B78E4]" />
                      <span>.ODP</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSheet(null);
                        exportToSenFile(presentation);
                      }}
                      className="p-2 rounded-xl border border-gray-200 text-center text-xs font-semibold hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mx-auto mb-1 text-[#386A20]" />
                      <span>.SEN</span>
                    </button>
                  </div>
                </div>

                {/* Material Themes */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Themes
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.slice(0, 4).map((th) => (
                      <button
                        key={th.id}
                        onClick={() => {
                          onSelectTheme(th);
                          setActiveSheet(null);
                        }}
                        className="p-2 rounded-xl border border-gray-200 text-left text-xs font-semibold"
                        style={{ backgroundColor: th.background }}
                      >
                        {th.name}
                      </button>
                    ))}
                  </div>
                </div>

                <PWAInstallButton />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
