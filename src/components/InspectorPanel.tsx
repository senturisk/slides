import React, { useState } from 'react';
import { Slide, SlideElement, PresentationTheme, SlideTransition } from '../types';
import { THEMES } from '../data/themes';
import { 
  Paintbrush, 
  Layers, 
  FileText, 
  Sliders, 
  Check, 
  Sparkles, 
  Move, 
  RotateCw, 
  Maximize2 
} from 'lucide-react';

interface InspectorPanelProps {
  selectedElement: SlideElement | null;
  onUpdateElement: (element: SlideElement) => void;
  slide: Slide;
  onUpdateSlide: (slide: Slide) => void;
  currentThemeId: string;
  onSelectTheme: (theme: PresentationTheme) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedElement,
  onUpdateElement,
  slide,
  onUpdateSlide,
  currentThemeId,
  onSelectTheme,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'format' | 'slide' | 'themes' | 'notes'>('format');

  if (!isOpen) return null;

  return (
    <aside className="w-72 h-full bg-[#FEF7FF] border-l border-[#E6E0E9] flex flex-col shrink-0 select-none text-xs z-20 shadow-xs">
      {/* Inspector Tabs */}
      <div className="flex items-center justify-around border-b border-[#E6E0E9] p-1 bg-[#F3EDF7]">
        <button
          onClick={() => setActiveTab('format')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition ${
            activeTab === 'format' ? 'bg-white text-[#1C1B1F] shadow-2xs' : 'text-[#79747E] hover:text-[#1C1B1F]'
          }`}
          title="Element Format"
        >
          <Sliders className="w-3.5 h-3.5 text-[#EA8600]" />
          <span>Format</span>
        </button>
        <button
          onClick={() => setActiveTab('slide')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition ${
            activeTab === 'slide' ? 'bg-white text-[#1C1B1F] shadow-2xs' : 'text-[#79747E] hover:text-[#1C1B1F]'
          }`}
          title="Slide Background & Layout"
        >
          <Paintbrush className="w-3.5 h-3.5 text-[#6750A4]" />
          <span>Slide</span>
        </button>
        <button
          onClick={() => setActiveTab('themes')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition ${
            activeTab === 'themes' ? 'bg-white text-[#1C1B1F] shadow-2xs' : 'text-[#79747E] hover:text-[#1C1B1F]'
          }`}
          title="Deck Themes"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#0B57D0]" />
          <span>Themes</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition ${
            activeTab === 'notes' ? 'bg-white text-[#1C1B1F] shadow-2xs' : 'text-[#79747E] hover:text-[#1C1B1F]'
          }`}
          title="Speaker Notes"
        >
          <FileText className="w-3.5 h-3.5 text-[#386A20]" />
          <span>Notes</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Format Tab (Element-Specific Properties) */}
        {activeTab === 'format' && (
          selectedElement ? (
            <div className="space-y-4">
              {/* Position & Size */}
              <div className="space-y-2">
                <span className="font-bold text-[#49454F] uppercase tracking-wider text-[10px]">
                  Position & Size
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border border-[#CAC4D0] rounded-xl p-2 flex items-center justify-between">
                    <span className="text-gray-400 font-mono">X</span>
                    <input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) => onUpdateElement({ ...selectedElement, x: Number(e.target.value) })}
                      className="w-16 text-right font-mono font-semibold outline-none"
                    />
                  </div>
                  <div className="bg-white border border-[#CAC4D0] rounded-xl p-2 flex items-center justify-between">
                    <span className="text-gray-400 font-mono">Y</span>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => onUpdateElement({ ...selectedElement, y: Number(e.target.value) })}
                      className="w-16 text-right font-mono font-semibold outline-none"
                    />
                  </div>
                  <div className="bg-white border border-[#CAC4D0] rounded-xl p-2 flex items-center justify-between">
                    <span className="text-gray-400 font-mono">W</span>
                    <input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => onUpdateElement({ ...selectedElement, width: Math.max(20, Number(e.target.value)) })}
                      className="w-16 text-right font-mono font-semibold outline-none"
                    />
                  </div>
                  <div className="bg-white border border-[#CAC4D0] rounded-xl p-2 flex items-center justify-between">
                    <span className="text-gray-400 font-mono">H</span>
                    <input
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) => onUpdateElement({ ...selectedElement, height: Math.max(20, Number(e.target.value)) })}
                      className="w-16 text-right font-mono font-semibold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation & Opacity */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Rotation</span>
                  <span className="font-mono text-gray-500">{selectedElement.rotation || 0}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedElement.rotation || 0}
                  onChange={(e) => onUpdateElement({ ...selectedElement, rotation: Number(e.target.value) })}
                  className="w-full accent-[#EA8600]"
                />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Opacity</span>
                  <span className="font-mono text-gray-500">
                    {Math.round((selectedElement.opacity ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={Math.round((selectedElement.opacity ?? 1) * 100)}
                  onChange={(e) => onUpdateElement({ ...selectedElement, opacity: Number(e.target.value) / 100 })}
                  className="w-full accent-[#EA8600]"
                />
              </div>

              {/* Corner Radius & Shadows */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Corner Radius</span>
                  <span className="font-mono text-gray-500">{selectedElement.borderRadius || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={selectedElement.borderRadius || 0}
                  onChange={(e) => onUpdateElement({ ...selectedElement, borderRadius: Number(e.target.value) })}
                  className="w-full accent-[#EA8600]"
                />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Drop Shadow</span>
                  <input
                    type="checkbox"
                    checked={!!selectedElement.shadow}
                    onChange={(e) => onUpdateElement({ ...selectedElement, shadow: e.target.checked })}
                    className="w-4 h-4 accent-[#EA8600]"
                  />
                </div>
              </div>

              {/* Border / Stroke */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="font-bold text-[#49454F] uppercase tracking-wider text-[10px]">
                  Border & Stroke
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedElement.stroke || '#E6E0E9'}
                    onChange={(e) => onUpdateElement({ ...selectedElement, stroke: e.target.value })}
                    className="w-7 h-7 rounded-md cursor-pointer border-0 p-0"
                  />
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={selectedElement.strokeWidth || 0}
                    onChange={(e) => onUpdateElement({ ...selectedElement, strokeWidth: Number(e.target.value) })}
                    className="flex-1 bg-white border border-[#CAC4D0] rounded-xl px-2 py-1 outline-none text-right font-mono"
                    placeholder="Width px"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Sliders className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-medium text-xs">No element selected</p>
              <p className="text-[11px]">Click any shape, text, or card on the slide to inspect properties.</p>
            </div>
          )
        )}

        {/* 2. Slide Tab (Slide Background & Transition) */}
        {activeTab === 'slide' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="font-bold text-[#49454F] uppercase tracking-wider text-[10px]">
                Slide Background
              </span>
              <div className="grid grid-cols-5 gap-2">
                {[
                  '#FFFFFF',
                  '#FFF8E1',
                  '#F6F2FF',
                  '#F0F7FF',
                  '#F1F5E9',
                  '#FFF0F2',
                  '#F8F9FD',
                  '#141218',
                  '#211F26',
                  '#2B2B2B',
                ].map((bg) => (
                  <button
                    key={bg}
                    onClick={() => onUpdateSlide({ ...slide, background: { type: 'color', value: bg } })}
                    style={{ backgroundColor: bg }}
                    className={`h-9 rounded-xl border transition hover:scale-105 ${
                      slide.background.value === bg ? 'border-2 border-[#EA8600]' : 'border-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={slide.background.value}
                  onChange={(e) => onUpdateSlide({ ...slide, background: { type: 'color', value: e.target.value } })}
                  className="w-7 h-7 rounded-md cursor-pointer border-0 p-0"
                />
                <span className="text-gray-500 font-mono text-[11px]">Custom Background</span>
              </div>
            </div>

            {/* Slide Transition */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <span className="font-bold text-[#49454F] uppercase tracking-wider text-[10px]">
                Slide Transition
              </span>
              <select
                value={slide.transition || 'none'}
                onChange={(e) => onUpdateSlide({ ...slide, transition: e.target.value as SlideTransition })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl px-3 py-2 text-xs text-[#1C1B1F] outline-none"
              >
                <option value="none">None (Instant)</option>
                <option value="fade">Fade Transition</option>
                <option value="slide">Slide In Horizontal</option>
                <option value="zoom">Zoom Scale</option>
                <option value="flip">3D Flip</option>
              </select>
            </div>
          </div>
        )}

        {/* 3. Themes Tab */}
        {activeTab === 'themes' && (
          <div className="space-y-3">
            <span className="font-bold text-[#49454F] uppercase tracking-wider text-[10px]">
              Material You Palettes
            </span>
            <div className="space-y-2.5">
              {THEMES.map((theme) => {
                const isSelected = theme.id === currentThemeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme)}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-[#EA8600] bg-[#FFF8E1] shadow-xs'
                        : 'border-[#E6E0E9] bg-white hover:border-[#6750A4]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-[#1C1B1F]">{theme.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {theme.fontFamily.split(',')[0].replace(/'/g, '')}
                      </div>
                    </div>
                    {/* Swatch chips */}
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: theme.background }} />
                      <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: theme.primary }} />
                      <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: theme.secondary }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Speaker Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-2 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#49454F] uppercase tracking-wider text-[10px]">
                Speaker Notes
              </span>
              <span className="text-[10px] text-gray-400">Only visible to presenter</span>
            </div>
            <textarea
              value={slide.notes || ''}
              onChange={(e) => onUpdateSlide({ ...slide, notes: e.target.value })}
              placeholder="Add speaking points, cues, or presentation notes for this slide..."
              className="w-full flex-1 min-h-[220px] bg-white border border-[#CAC4D0] rounded-2xl p-3 text-xs leading-relaxed text-[#1C1B1F] outline-none resize-none focus:border-[#EA8600]"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
