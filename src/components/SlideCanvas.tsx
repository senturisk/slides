import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Slide, SlideElement, SnapGuide, Collaborator } from '../types';
import { calculateSnap, SLIDE_WIDTH, SLIDE_HEIGHT } from '../services/autosnap';
import { Move, RotateCw } from 'lucide-react';

interface SlideCanvasProps {
  slide: Slide;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (element: SlideElement, recordHistory?: boolean) => void;
  onUpdateSlide: (slide: Slide) => void;
  onAddElement?: (element: SlideElement) => void;
  onDeleteElement?: (id: string) => void;
  snapEnabled: boolean;
  gridSnap: boolean;
  showGrid: 'none' | 'dots' | 'lines';
  scale: number;
  onSetScale?: (scale: number) => void;
  collaborators: Collaborator[];
  onCursorMove?: (x: number, y: number) => void;
}

type DragMode = 'move' | 'resize-nw' | 'resize-n' | 'resize-ne' | 'resize-e' | 'resize-se' | 'resize-s' | 'resize-sw' | 'resize-w' | 'rotate' | null;

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onUpdateSlide,
  snapEnabled,
  gridSnap,
  showGrid,
  scale,
  collaborators,
  onCursorMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Dragging state
  const dragRef = useRef<{
    mode: DragMode;
    elementId: string;
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    elemStartW: number;
    elemStartH: number;
    elemStartRot: number;
    hasMoved: boolean;
  } | null>(null);
  const lastUpdatedElRef = useRef<SlideElement | null>(null);

  const selectedElement = slide.elements.find((el) => el.id === selectedElementId);

  // Convert client coordinates to slide coordinates (1280x720 base)
  const getSlideCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / scale;
      const y = (clientY - rect.top) / scale;
      return { x, y };
    },
    [scale]
  );

  // Handle cursor broadcast for collaboration
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getSlideCoords(e.clientX, e.clientY);
    onCursorMove?.(Math.round(coords.x), Math.round(coords.y));
  };

  // Start dragging or resizing
  const handleStartDrag = (
    e: React.MouseEvent | React.TouchEvent,
    elementId: string,
    mode: DragMode
  ) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = getSlideCoords(clientX, clientY);

    const el = slide.elements.find((item) => item.id === elementId);
    if (!el || el.locked) return;

    onSelectElement(elementId);
    lastUpdatedElRef.current = null;

    dragRef.current = {
      mode,
      elementId,
      startX: coords.x,
      startY: coords.y,
      elemStartX: el.x,
      elemStartY: el.y,
      elemStartW: el.width,
      elemStartH: el.height,
      elemStartRot: el.rotation || 0,
      hasMoved: false,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      dragRef.current.hasMoved = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const coords = getSlideCoords(clientX, clientY);

      const { mode, elementId, startX, startY, elemStartX, elemStartY, elemStartW, elemStartH, elemStartRot } =
        dragRef.current;
      const el = slide.elements.find((item) => item.id === elementId);
      if (!el) return;

      const deltaX = coords.x - startX;
      const deltaY = coords.y - startY;

      if (mode === 'move') {
        const rawX = elemStartX + deltaX;
        const rawY = elemStartY + deltaY;

        // Apply Canva-like Autosnap
        const snap = calculateSnap(
          elementId,
          rawX,
          rawY,
          el.width,
          el.height,
          slide.elements,
          snapEnabled,
          gridSnap
        );

        setActiveGuides(snap.guides);
        const updated: SlideElement = {
          ...el,
          x: Math.round(snap.x),
          y: Math.round(snap.y),
        };
        lastUpdatedElRef.current = updated;
        onUpdateElement(updated, false);
      } else if (mode === 'rotate') {
        const centerX = elemStartX + elemStartW / 2;
        const centerY = elemStartY + elemStartH / 2;
        const rad = Math.atan2(coords.y - centerY, coords.x - centerX);
        let deg = Math.round((rad * 180) / Math.PI) + 90;
        if (deg < 0) deg += 360;
        // Snap to 0, 45, 90, 180, 270 degrees
        const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const sa of snapAngles) {
          if (Math.abs(deg - sa) <= 5) {
            deg = sa % 360;
            break;
          }
        }
        const updated: SlideElement = { ...el, rotation: deg };
        lastUpdatedElRef.current = updated;
        onUpdateElement(updated, false);
      } else if (mode && mode.startsWith('resize-')) {
        let newX = elemStartX;
        let newY = elemStartY;
        let newW = elemStartW;
        let newH = elemStartH;

        if (mode.includes('e')) newW = Math.max(30, elemStartW + deltaX);
        if (mode.includes('s')) newH = Math.max(20, elemStartH + deltaY);
        if (mode.includes('w')) {
          const w = Math.max(30, elemStartW - deltaX);
          newX = elemStartX + (elemStartW - w);
          newW = w;
        }
        if (mode.includes('n')) {
          const h = Math.max(20, elemStartH - deltaY);
          newY = elemStartY + (elemStartH - h);
          newH = h;
        }

        // Apply snap to resizing edges
        const snap = calculateSnap(
          elementId,
          newX,
          newY,
          newW,
          newH,
          slide.elements,
          snapEnabled,
          gridSnap
        );
        setActiveGuides(snap.guides);

        const updated: SlideElement = {
          ...el,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        };
        lastUpdatedElRef.current = updated;
        onUpdateElement(updated, false);
      }
    };

    const handlePointerUp = () => {
      if (dragRef.current) {
        if (dragRef.current.hasMoved && lastUpdatedElRef.current) {
          onUpdateElement(lastUpdatedElRef.current, true);
        }
        dragRef.current = null;
        lastUpdatedElRef.current = null;
        setActiveGuides([]);
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [getSlideCoords, onUpdateElement, slide.elements, snapEnabled, gridSnap]);

  // Keyboard navigation & deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return; // Typing in input
      if (!selectedElementId) return;

      const el = slide.elements.find((item) => item.id === selectedElementId);
      if (!el) return;

      const shift = e.shiftKey ? 10 : 1;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onUpdateSlide({
          ...slide,
          elements: slide.elements.filter((item) => item.id !== selectedElementId),
        });
        onSelectElement(null);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateElement({ ...el, y: el.y - shift });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateElement({ ...el, y: el.y + shift });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateElement({ ...el, x: el.x - shift });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateElement({ ...el, x: el.x + shift });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        // Duplicate
        const dup: SlideElement = {
          ...el,
          id: 'el-' + Math.random().toString(36).substring(2, 9),
          x: el.x + 20,
          y: el.y + 20,
          zIndex: slide.elements.length + 1,
        };
        onUpdateSlide({
          ...slide,
          elements: [...slide.elements, dup],
        });
        onSelectElement(dup.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTextId, selectedElementId, slide, onSelectElement, onUpdateElement, onUpdateSlide]);

  return (
    <div
      className="relative flex items-center justify-center w-full h-full p-4 overflow-auto select-none"
      onClick={() => onSelectElement(null)}
      onMouseMove={handleMouseMove}
    >
      {/* 16:9 Presentation Stage */}
      <div
        ref={containerRef}
        id="sen-slide-canvas"
        style={{
          width: `${SLIDE_WIDTH}px`,
          height: `${SLIDE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background:
            slide.background.type === 'color'
              ? slide.background.value
              : slide.background.type === 'gradient'
              ? 'linear-gradient(135deg, #FFE082, #FF8A65)'
              : '#FFFFFF',
        }}
        className={`relative shadow-2xl rounded-2xl overflow-hidden transition-shadow shrink-0 border border-[#E6E0E9] ${
          showGrid === 'dots' ? 'canvas-grid-dots' : showGrid === 'lines' ? 'canvas-grid-lines' : ''
        }`}
      >
        {/* Render Slide Elements */}
        {slide.elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => {
            const isSelected = el.id === selectedElementId;
            const isEditing = el.id === editingTextId;

            return (
              <div
                key={el.id}
                id={`elem-${el.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(el.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (el.type === 'text' || el.type === 'shape' || el.type === 'badge') {
                    setEditingTextId(el.id);
                  }
                }}
                onMouseDown={(e) => handleStartDrag(e, el.id, 'move')}
                onTouchStart={(e) => handleStartDrag(e, el.id, 'move')}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                  opacity: el.opacity ?? 1,
                  zIndex: el.zIndex,
                  cursor: el.locked ? 'default' : 'move',
                }}
                className={`group transition-outline ${
                  isSelected ? 'outline-2 outline-[#EA8600] ring-4 ring-[#EA8600]/15' : 'hover:outline-1 hover:outline-[#6750A4]/40'
                }`}
              >
                {/* Element Inner Content */}
                <ElementRenderer
                  element={el}
                  isEditing={isEditing}
                  onTextChange={(newText) => onUpdateElement({ ...el, text: newText })}
                  onFinishEdit={() => setEditingTextId(null)}
                />

                {/* Selection Handles & Rulers when selected */}
                {isSelected && !el.locked && (
                  <>
                    {/* Rotate Handle */}
                    <div
                      onMouseDown={(e) => handleStartDrag(e, el.id, 'rotate')}
                      onTouchStart={(e) => handleStartDrag(e, el.id, 'rotate')}
                      style={{ top: '-28px', left: '50%', transform: 'translateX(-50%)' }}
                      className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-[#EA8600] shadow-md cursor-grab active:cursor-grabbing z-30 hover:scale-110 transition"
                      title="Rotate object"
                    >
                      <RotateCw className="w-3 h-3 text-[#EA8600]" />
                    </div>
                    <div
                      style={{ top: '-14px', left: '50%', transform: 'translateX(-50%)' }}
                      className="absolute w-0.5 h-3.5 bg-[#EA8600]"
                    />

                    {/* 8 Resize Anchor Points */}
                    {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((anchor) => {
                      const posClass =
                        anchor === 'nw'
                          ? '-top-1.5 -left-1.5 cursor-nwse-resize'
                          : anchor === 'n'
                          ? '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'
                          : anchor === 'ne'
                          ? '-top-1.5 -right-1.5 cursor-nesw-resize'
                          : anchor === 'e'
                          ? 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize'
                          : anchor === 'se'
                          ? '-bottom-1.5 -right-1.5 cursor-nwse-resize'
                          : anchor === 's'
                          ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'
                          : anchor === 'sw'
                          ? '-bottom-1.5 -left-1.5 cursor-nesw-resize'
                          : 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize';

                      return (
                        <div
                          key={anchor}
                          onMouseDown={(e) => handleStartDrag(e, el.id, `resize-${anchor}` as DragMode)}
                          onTouchStart={(e) => handleStartDrag(e, el.id, `resize-${anchor}` as DragMode)}
                          className={`absolute w-3 h-3 bg-white border-2 border-[#EA8600] rounded-xs shadow-xs z-30 hover:scale-125 transition ${posClass}`}
                        />
                      );
                    })}

                    {/* Coordinates & Size badge */}
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#1C1B1F] text-white text-[10px] font-mono rounded-full whitespace-nowrap opacity-80 pointer-events-none shadow-md z-30">
                      {Math.round(el.width)} × {Math.round(el.height)} px
                    </div>
                  </>
                )}
              </div>
            );
          })}

        {/* Canva-style Autosnap Guide Overlay Lines */}
        {activeGuides.map((guide) => (
          <div
            key={guide.id}
            className="pointer-events-none absolute z-40"
            style={
              guide.type === 'vertical'
                ? {
                    left: `${guide.position}px`,
                    top: '0px',
                    width: '1.5px',
                    height: `${SLIDE_HEIGHT}px`,
                    backgroundColor: guide.isCenter ? '#E91E63' : '#FB8C00',
                    boxShadow: guide.isCenter
                      ? '0 0 8px rgba(233,30,99,0.8)'
                      : '0 0 6px rgba(251,140,0,0.6)',
                  }
                : {
                    top: `${guide.position}px`,
                    left: '0px',
                    height: '1.5px',
                    width: `${SLIDE_WIDTH}px`,
                    backgroundColor: guide.isCenter ? '#E91E63' : '#FB8C00',
                    boxShadow: guide.isCenter
                      ? '0 0 8px rgba(233,30,99,0.8)'
                      : '0 0 6px rgba(251,140,0,0.6)',
                  }
            }
          >
            {guide.label && (
              <span
                style={{
                  left: guide.type === 'vertical' ? '4px' : '16px',
                  top: guide.type === 'vertical' ? '16px' : '4px',
                  backgroundColor: guide.isCenter ? '#E91E63' : '#FB8C00',
                  transform: guide.type === 'vertical' ? 'translateX(4px)' : 'translateY(4px)',
                }}
                className="absolute px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow-sm"
              >
                {guide.label}
              </span>
            )}
          </div>
        ))}

        {/* Remote Collaborators Live Cursors */}
        {collaborators
          .filter((c) => c.cursor && c.cursor.slideId === slide.id)
          .map((c) => (
            <div
              key={c.peerId}
              style={{
                left: `${c.cursor!.x}px`,
                top: `${c.cursor!.y}px`,
                transition: 'all 0.08s ease-out',
              }}
              className="absolute pointer-events-none z-50 flex items-start gap-1 select-none"
            >
              {/* Cursor SVG */}
              <svg
                className="w-5 h-5 drop-shadow-md"
                viewBox="0 0 24 24"
                fill={c.color}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              >
                <path d="M5.653 3.123l14.07 9.85c.84.588.614 1.905-.367 2.164l-4.757 1.258 2.656 5.312a1.2 1.2 0 0 1-1.61 1.61l-2.656-5.312-3.155 3.155c-.75.75-2.035.218-2.035-.849V3.882c0-.98.983-1.59 1.854-.759z" />
              </svg>
              {/* User badge */}
              <div
                style={{ backgroundColor: c.color }}
                className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white whitespace-nowrap shadow-md"
              >
                {c.name}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// Subcomponent to render element body
interface ElementRendererProps {
  element: SlideElement;
  isEditing: boolean;
  onTextChange: (val: string) => void;
  onFinishEdit: () => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isEditing,
  onTextChange,
  onFinishEdit,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commonStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: element.fill || 'transparent',
    borderColor: element.stroke || 'transparent',
    borderWidth: element.strokeWidth ? `${element.strokeWidth}px` : undefined,
    borderStyle: element.strokeStyle || 'solid',
    borderRadius:
      element.borderRadius !== undefined
        ? `${element.borderRadius}px`
        : element.shapeType === 'rounded'
        ? '24px'
        : element.shapeType === 'circle'
        ? '50%'
        : undefined,
    boxShadow: element.shadow ? `0 10px 25px ${element.shadowColor || 'rgba(0,0,0,0.12)'}` : undefined,
    color: element.color || '#1C1B1F',
    fontFamily: element.fontFamily || 'inherit',
    fontSize: element.fontSize ? `${element.fontSize}px` : '18px',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.underline ? 'underline' : 'none',
    textAlign: element.textAlign || 'left',
    lineHeight: element.lineHeight || 1.3,
    padding: element.padding ? `${element.padding}px` : '12px',
    overflow: 'hidden',
    wordBreak: 'break-word',
  };

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={element.text || ''}
        onChange={(e) => onTextChange(e.target.value)}
        onBlur={onFinishEdit}
        style={{
          ...commonStyle,
          resize: 'none',
          outline: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          cursor: 'text',
        }}
        className="border-2 border-[#EA8600] rounded-lg shadow-lg"
      />
    );
  }

  // Shapes & Badges
  if (element.type === 'shape' || element.type === 'badge') {
    return (
      <div style={commonStyle}>
        <div className="w-full whitespace-pre-wrap">{element.text}</div>
      </div>
    );
  }

  // Text
  if (element.type === 'text') {
    return (
      <div style={commonStyle}>
        <div className="w-full whitespace-pre-wrap">{element.text}</div>
      </div>
    );
  }

  // Table
  if (element.type === 'table') {
    const data = element.tableData || [
      ['Column 1', 'Column 2'],
      ['Row 1', 'Row 2'],
    ];

    return (
      <div
        style={{
          ...commonStyle,
          padding: 0,
          backgroundColor: element.fill || '#FFFFFF',
        }}
        className="overflow-hidden border border-[#E6E0E9] rounded-2xl shadow-sm"
      >
        <table className="w-full h-full border-collapse">
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx === 0 ? 'bg-[#FFE082]/30 font-bold' : ''}>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="border border-[#E6E0E9] px-3 py-2 text-xs text-[#1C1B1F]"
                  >
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

  // Image
  if (element.type === 'image') {
    return (
      <div style={commonStyle} className="p-0 overflow-hidden">
        {element.imageUrl ? (
          <img
            src={element.imageUrl}
            alt="Slide asset"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
            No image
          </div>
        )}
      </div>
    );
  }

  return <div style={commonStyle}>{element.text}</div>;
};
