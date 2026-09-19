import React, { useState } from 'react';
import { Slide, SlideLayout } from '../types';
import { Plus, Copy, Trash2, ChevronUp, ChevronDown, LayoutTemplate } from 'lucide-react';

interface SlideFilmstripProps {
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (id: string) => void;
  onAddSlide: (layout: SlideLayout) => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onMoveSlide: (index: number, direction: 'up' | 'down') => void;
}

export const SlideFilmstrip: React.FC<SlideFilmstripProps> = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
}) => {
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const handleAddTemplate = (layout: SlideLayout) => {
    onAddSlide(layout);
    setTemplateMenuOpen(false);
  };

  return (
    <aside className="w-52 h-full bg-[#FEF7FF] border-r border-[#E6E0E9] flex flex-col shrink-0 select-none z-10">
      {/* Top action: Add slide with template menu */}
      <div className="p-3 border-b border-[#E6E0E9] relative">
        <button
          onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#EADDFF] hover:bg-[#D0BCFF] text-[#21005D] rounded-full text-xs font-bold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Slide</span>
        </button>

        {/* Template Dropdown */}
        {templateMenuOpen && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-[#CAC4D0] rounded-2xl shadow-xl p-2 z-50 animate-fade-in text-xs">
            <div className="text-[10px] font-bold text-[#79747E] uppercase px-2 py-1">
              Select Layout
            </div>
            {[
              { layout: 'title', label: 'Title Slide' },
              { layout: 'title-body', label: 'Title & Body' },
              { layout: 'metrics', label: '3 Pillars / Metrics' },
              { layout: 'two-columns', label: 'Two Columns' },
              { layout: 'quote', label: 'Quote / Statement' },
              { layout: 'blank', label: 'Blank Canvas' },
            ].map((tmpl) => (
              <button
                key={tmpl.layout}
                onClick={() => handleAddTemplate(tmpl.layout as SlideLayout)}
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#F3EDF7] rounded-lg font-medium text-[#1C1B1F] flex items-center gap-2"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-[#EA8600]" />
                <span>{tmpl.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Slide Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className="group relative flex items-start gap-2 cursor-pointer"
            >
              {/* Slide Number */}
              <span className={`text-xs font-mono font-bold mt-1 ${isActive ? 'text-[#EA8600]' : 'text-[#79747E]'}`}>
                {index + 1}
              </span>

              {/* Thumbnail Card (16:9 aspect) */}
              <div
                className={`relative w-full aspect-video rounded-xl overflow-hidden border-2 transition shadow-xs ${
                  isActive
                    ? 'border-[#EA8600] ring-4 ring-[#EA8600]/15'
                    : 'border-[#E6E0E9] hover:border-[#6750A4]/40'
                }`}
                style={{
                  backgroundColor:
                    slide.background.type === 'color'
                      ? slide.background.value
                      : '#FFFFFF',
                }}
              >
                {/* Miniature slide content preview */}
                <div className="absolute inset-0 p-1 pointer-events-none scale-30 origin-top-left w-[333%] h-[333%] overflow-hidden">
                  {slide.elements.slice(0, 5).map((el) => (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: `${el.x * 0.25}px`,
                        top: `${el.y * 0.25}px`,
                        width: `${el.width * 0.25}px`,
                        height: `${el.height * 0.25}px`,
                        backgroundColor: el.fill || (el.type === 'text' ? 'transparent' : '#CAC4D0'),
                        color: el.color || '#1C1B1F',
                        fontSize: `${Math.max(6, (el.fontSize || 16) * 0.25)}px`,
                        borderRadius: `${(el.borderRadius || 0) * 0.25}px`,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                      className="font-bold opacity-80"
                    >
                      {el.text}
                    </div>
                  ))}
                </div>

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSlide(index, 'up');
                      }}
                      className="p-1 rounded-full bg-white/90 hover:bg-white text-gray-800"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  )}
                  {index < slides.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSlide(index, 'down');
                      }}
                      className="p-1 rounded-full bg-white/90 hover:bg-white text-gray-800"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(slide.id);
                    }}
                    className="p-1 rounded-full bg-white/90 hover:bg-white text-gray-800"
                    title="Duplicate Slide"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(slide.id);
                      }}
                      className="p-1 rounded-full bg-red-500 hover:bg-red-600 text-white"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
