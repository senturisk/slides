import React, { useState, useEffect, useRef } from 'react';
import { Presentation, Slide } from '../types';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '../services/autosnap';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Sparkles, 
  Dot,
  Radio
} from 'lucide-react';

interface PresentationModeProps {
  presentation: Presentation;
  initialSlideIndex?: number;
  onExit: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  presentation,
  initialSlideIndex = 0,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100 });
  const [notesOpen, setNotesOpen] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideHudTimerRef = useRef<NodeJS.Timeout | null>(null);

  const slides = presentation.slides;
  const currentSlide = slides[currentIndex] || slides[0];

  // Auto-fit scale to viewport
  useEffect(() => {
    const updateScale = () => {
      const availW = window.innerWidth;
      const availH = window.innerHeight;
      const s = Math.min((availW - 32) / SLIDE_WIDTH, (availH - 32) / SLIDE_HEIGHT);
      setScale(s);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
      } else if (e.key === 'b' || e.key === 'B') {
        setBlackout((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        setLaserActive((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, onExit]);

  // Laser Pointer mouse tracking & HUD auto-hide
  const handleMouseMove = (e: React.MouseEvent) => {
    setLaserPos({ x: e.clientX, y: e.clientY });
    setHudVisible(true);

    if (hideHudTimerRef.current) clearTimeout(hideHudTimerRef.current);
    hideHudTimerRef.current = setTimeout(() => {
      setHudVisible(false);
    }, 3000);
  };

  const handleNext = () => setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1));
  const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 bg-[#0F0D13] flex items-center justify-center overflow-hidden select-none ${
        laserActive ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* Blackout curtain */}
      {blackout && (
        <div className="absolute inset-0 bg-black z-40 flex items-center justify-center">
          <span className="text-gray-600 text-xs font-mono">Screen Paused (Press 'B' to resume)</span>
        </div>
      )}

      {/* Laser Pointer Dot */}
      {laserActive && (
        <div
          style={{
            left: `${laserPos.x}px`,
            top: `${laserPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="fixed pointer-events-none z-50 w-5 h-5 rounded-full bg-red-500 shadow-[0_0_16px_4px_rgba(255,0,0,0.8)] border border-white"
        />
      )}

      {/* Presentation Canvas Stage (16:9 widescreen) */}
      <div
        id="presenter-slide-frame"
        style={{
          width: `${SLIDE_WIDTH}px`,
          height: `${SLIDE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background:
            currentSlide.background.type === 'color'
              ? currentSlide.background.value
              : '#FFFFFF',
        }}
        className="relative shadow-2xl rounded-2xl overflow-hidden transition-all duration-300"
      >
        {currentSlide.elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => {
            const style: React.CSSProperties = {
              position: 'absolute',
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: `${el.height}px`,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              opacity: el.opacity ?? 1,
              backgroundColor: el.fill || 'transparent',
              borderColor: el.stroke || 'transparent',
              borderWidth: el.strokeWidth ? `${el.strokeWidth}px` : undefined,
              borderStyle: el.strokeStyle || 'solid',
              borderRadius:
                el.borderRadius !== undefined
                  ? `${el.borderRadius}px`
                  : el.shapeType === 'rounded'
                  ? '24px'
                  : el.shapeType === 'circle'
                  ? '50%'
                  : undefined,
              boxShadow: el.shadow ? `0 10px 25px ${el.shadowColor || 'rgba(0,0,0,0.12)'}` : undefined,
              color: el.color || '#1C1B1F',
              fontFamily: el.fontFamily || 'inherit',
              fontSize: el.fontSize ? `${el.fontSize}px` : '18px',
              fontWeight: el.fontWeight || 'normal',
              fontStyle: el.fontStyle || 'normal',
              textDecoration: el.underline ? 'underline' : 'none',
              textAlign: el.textAlign || 'left',
              lineHeight: el.lineHeight || 1.3,
              padding: el.padding ? `${el.padding}px` : '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
              wordBreak: 'break-word',
            };

            if (el.type === 'table' && el.tableData) {
              return (
                <div key={el.id} style={{ ...style, padding: 0 }} className="border border-[#E6E0E9] rounded-2xl">
                  <table className="w-full h-full border-collapse">
                    <tbody>
                      {el.tableData.map((row, r) => (
                        <tr key={r} className={r === 0 ? 'bg-[#FFE082]/30 font-bold' : ''}>
                          {row.map((cell, c) => (
                            <td key={c} className="border border-[#E6E0E9] px-3 py-2 text-xs">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }

            if (el.type === 'image' && el.imageUrl) {
              return (
                <div key={el.id} style={{ ...style, padding: 0 }}>
                  <img
                    src={el.imageUrl}
                    alt="Slide visual"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              );
            }

            return (
              <div key={el.id} style={style}>
                <div className="w-full whitespace-pre-wrap">{el.text}</div>
              </div>
            );
          })}
      </div>

      {/* Speaker Notes Drawer (Bottom Sheet) */}
      {notesOpen && (
        <div className="absolute bottom-18 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl bg-[#1C1B1F]/95 backdrop-blur-md text-white border border-white/20 p-4 rounded-2xl shadow-2xl z-40 animate-fade-in">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-xs font-bold text-[#FBBC04] uppercase tracking-wider">
              Speaker Notes (Slide {currentIndex + 1})
            </span>
            <button
              onClick={() => setNotesOpen(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {currentSlide.notes || 'No speaker notes for this slide.'}
          </p>
        </div>
      )}

      {/* Presenter Floating HUD Toolbar */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1C1B1F]/90 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl z-40 transition-opacity duration-300 ${
          hudVisible ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        }`}
      >
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous Slide (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-mono font-bold text-white px-2">
          {currentIndex + 1} / {slides.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === slides.length - 1}
          className="p-1.5 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next Slide (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-px h-4 bg-white/20" />

        {/* Laser Pointer Tool */}
        <button
          onClick={() => setLaserActive(!laserActive)}
          className={`p-1.5 rounded-full transition ${
            laserActive ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-white/10'
          }`}
          title="Laser Pointer (L)"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* Speaker Notes Toggle */}
        <button
          onClick={() => setNotesOpen(!notesOpen)}
          className={`p-1.5 rounded-full transition ${
            notesOpen ? 'bg-[#EA8600] text-white' : 'text-gray-300 hover:bg-white/10'
          }`}
          title="Speaker Notes Drawer"
        >
          <FileText className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-white/20" />

        {/* Exit Presentation Mode */}
        <button
          onClick={onExit}
          className="p-1.5 rounded-full text-gray-300 hover:bg-white/10"
          title="Exit Presentation (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
