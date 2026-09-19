import React, { useState, useRef, useEffect } from 'react';
import { SlideElement } from '../types';
import { 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon, 
  Table as TableIcon, 
  Bookmark, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Layers, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  Magnet, 
  Grid, 
  ZoomIn, 
  ZoomOut, 
  ChevronDown, 
  Palette,
  Sparkles,
  ArrowRight,
  Star,
  MessageSquare,
  Undo,
  Redo
} from 'lucide-react';

interface ToolbarProps {
  selectedElement: SlideElement | null;
  onUpdateElement: (element: SlideElement) => void;
  onAddElement: (element: SlideElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (element: SlideElement) => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  gridSnap: boolean;
  onToggleGridSnap: () => void;
  showGrid: 'none' | 'dots' | 'lines';
  onCycleGrid: () => void;
  scale: number;
  onSetScale: (scale: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const M3_PALETTES = [
  '#1C1B1F', // Dark Charcoal
  '#6750A4', // Material Primary Iris
  '#EA8600', // Slides Amber Gold
  '#0B57D0', // Google Blue
  '#386A20', // Sage Green
  '#B3261E', // Crimson Red
  '#7D5260', // Rose Mauve
  '#FFFFFF', // White
  '#FFF8E1', // Pastel Cream
  '#F6F2FF', // Pastel Violet
  '#F0F7FF', // Pastel Cyan
  '#F1F5E9', // Pastel Sage
];

const FONTS = [
  { name: 'Plus Jakarta Sans', label: 'Jakarta' },
  { name: 'Outfit', label: 'Outfit' },
  { name: 'Playfair Display', label: 'Playfair' },
  { name: 'Fira Code', label: 'Fira Code' },
  { name: 'Roboto', label: 'Roboto' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedElement,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
  onDuplicateElement,
  snapEnabled,
  onToggleSnap,
  gridSnap,
  onToggleGridSnap,
  showGrid,
  onCycleGrid,
  scale,
  onSetScale,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [textMenuOpen, setTextMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState<'text' | 'fill' | 'stroke' | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close open dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setShapeMenuOpen(false);
        setTextMenuOpen(false);
        setColorMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to create basic slide elements
  const createNewElement = (type: SlideElement['type'], extraProps: Partial<SlideElement> = {}): SlideElement => {
    return {
      id: 'el-' + Math.random().toString(36).substring(2, 9),
      type,
      x: 400,
      y: 260,
      width: 320,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      ...extraProps,
    };
  };

  const handleAddText = (variant: 'title' | 'heading' | 'body') => {
    let el: SlideElement;
    if (variant === 'title') {
      el = createNewElement('text', {
        text: 'Title Heading',
        fontSize: 48,
        fontWeight: '800',
        width: 600,
        height: 90,
        x: 340,
        y: 280,
      });
    } else if (variant === 'heading') {
      el = createNewElement('text', {
        text: 'Section Subtitle',
        fontSize: 28,
        fontWeight: '700',
        width: 480,
        height: 60,
        x: 400,
        y: 300,
      });
    } else {
      el = createNewElement('text', {
        text: 'Click here or double-click to edit body text paragraph.',
        fontSize: 18,
        fontWeight: 'normal',
        width: 420,
        height: 80,
        x: 430,
        y: 320,
      });
    }
    onAddElement(el);
    setTextMenuOpen(false);
  };

  const handleAddShape = (shapeType: SlideElement['shapeType']) => {
    let fill = '#6750A4';
    let text = '';
    let width = 200;
    let height = 200;
    let borderRadius = 0;

    if (shapeType === 'rounded') {
      fill = '#EA8600';
      borderRadius = 28;
      width = 240;
      height = 140;
    } else if (shapeType === 'circle') {
      fill = '#0B57D0';
      borderRadius = 9999;
      width = 180;
      height = 180;
    } else if (shapeType === 'star') {
      fill = '#FBBC04';
      text = '★ STAR';
    } else if (shapeType === 'speech-bubble') {
      fill = '#F6F2FF';
      borderRadius = 20;
      text = 'Quote or Speech Bubble';
    }

    const el = createNewElement('shape', {
      shapeType,
      fill,
      color: '#FFFFFF',
      width,
      height,
      borderRadius,
      text,
      x: 500,
      y: 240,
    });
    onAddElement(el);
    setShapeMenuOpen(false);
  };

  const handleAddTable = () => {
    const el = createNewElement('table', {
      width: 500,
      height: 200,
      x: 390,
      y: 250,
      fill: '#FFFFFF',
      tableData: [
        ['Metric', 'Target', 'Status'],
        ['Engagement', '85%', 'Exceeded'],
        ['Retention', '92%', 'On Track'],
      ],
    });
    onAddElement(el);
  };

  const handleAddBadge = () => {
    const el = createNewElement('badge', {
      text: '✨ FEATURED BADGE',
      fontSize: 14,
      fontWeight: 'bold',
      width: 240,
      height: 42,
      fill: '#FFE082',
      color: '#B06000',
      borderRadius: 9999,
      stroke: '#FBBC04',
      strokeWidth: 1,
      x: 520,
      y: 300,
    });
    onAddElement(el);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const el = createNewElement('image', {
          imageUrl: dataUrl,
          width: 380,
          height: 260,
          x: 450,
          y: 220,
          borderRadius: 20,
        });
        onAddElement(el);
      };
      reader.readAsDataURL(file);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div
      ref={toolbarRef}
      className="w-full bg-[#F3EDF7] border-b border-[#E6E0E9] px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 relative z-30 overflow-visible text-xs select-none"
    >
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Left section: Undo/Redo & Insert Element Tools */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Undo / Redo controls */}
        <div className="flex items-center gap-0.5 bg-white border border-[#CAC4D0] rounded-full p-0.5 shadow-2xs">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-full text-[#49454F] hover:bg-[#ECE6F0] disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-full text-[#49454F] hover:bg-[#ECE6F0] disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-px bg-[#CAC4D0] shrink-0" />

        {/* Text Insert Dropdown */}
        <div className="relative">
          <button
            onClick={() => setTextMenuOpen(!textMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-[#1C1B1F] border border-[#CAC4D0] hover:bg-[#ECE6F0] transition font-medium shadow-2xs"
            title="Insert text box"
          >
            <Type className="w-3.5 h-3.5 text-[#6750A4]" />
            <span className="hidden md:inline">Text</span>
            <ChevronDown className="w-3 h-3 text-[#79747E]" />
          </button>
          {textMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#CAC4D0] rounded-2xl shadow-2xl p-1.5 z-[60] animate-fade-in">
              <button
                onClick={() => handleAddText('title')}
                className="w-full px-2.5 py-2 text-left hover:bg-[#F3EDF7] rounded-xl font-bold text-sm"
              >
                Title Heading
              </button>
              <button
                onClick={() => handleAddText('heading')}
                className="w-full px-2.5 py-2 text-left hover:bg-[#F3EDF7] rounded-xl font-semibold text-xs"
              >
                Section Subtitle
              </button>
              <button
                onClick={() => handleAddText('body')}
                className="w-full px-2.5 py-2 text-left hover:bg-[#F3EDF7] rounded-xl text-xs"
              >
                Body Paragraph
              </button>
            </div>
          )}
        </div>

        {/* Shape Insert Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShapeMenuOpen(!shapeMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-[#1C1B1F] border border-[#CAC4D0] hover:bg-[#ECE6F0] transition font-medium shadow-2xs"
            title="Insert shapes & icons"
          >
            <Square className="w-3.5 h-3.5 text-[#EA8600]" />
            <span className="hidden md:inline">Shape</span>
            <ChevronDown className="w-3 h-3 text-[#79747E]" />
          </button>
          {shapeMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#CAC4D0] rounded-2xl shadow-2xl p-1.5 z-[60] animate-fade-in grid grid-cols-2 gap-1">
              <button
                onClick={() => handleAddShape('rounded')}
                className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-[#F3EDF7] rounded-xl text-left"
              >
                <div className="w-4 h-4 rounded-md bg-[#EA8600]" />
                <span>Rounded</span>
              </button>
              <button
                onClick={() => handleAddShape('circle')}
                className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-[#F3EDF7] rounded-xl text-left"
              >
                <div className="w-4 h-4 rounded-full bg-[#0B57D0]" />
                <span>Circle</span>
              </button>
              <button
                onClick={() => handleAddShape('rectangle')}
                className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-[#F3EDF7] rounded-xl text-left"
              >
                <div className="w-4 h-4 rounded-none bg-[#6750A4]" />
                <span>Square</span>
              </button>
              <button
                onClick={() => handleAddShape('star')}
                className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-[#F3EDF7] rounded-xl text-left"
              >
                <Star className="w-4 h-4 text-[#FBBC04] fill-[#FBBC04]" />
                <span>Star</span>
              </button>
              <button
                onClick={() => handleAddShape('speech-bubble')}
                className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-[#F3EDF7] rounded-xl text-left col-span-2"
              >
                <MessageSquare className="w-4 h-4 text-[#7D5260]" />
                <span>Callout Bubble</span>
              </button>
            </div>
          )}
        </div>

        {/* Image Upload */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-[#1C1B1F] border border-[#CAC4D0] hover:bg-[#ECE6F0] transition font-medium shadow-2xs"
          title="Upload image from computer"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#386A20]" />
          <span className="hidden md:inline">Image</span>
        </button>

        {/* Table Insert */}
        <button
          onClick={handleAddTable}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-[#1C1B1F] border border-[#CAC4D0] hover:bg-[#ECE6F0] transition font-medium shadow-2xs"
          title="Insert data table"
        >
          <TableIcon className="w-3.5 h-3.5 text-[#0B57D0]" />
          <span className="hidden md:inline">Table</span>
        </button>

        {/* Pill Badge */}
        <button
          onClick={handleAddBadge}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-[#1C1B1F] border border-[#CAC4D0] hover:bg-[#ECE6F0] transition font-medium shadow-2xs hidden lg:flex"
          title="Insert highlight badge pill"
        >
          <Bookmark className="w-3.5 h-3.5 text-[#B06000]" />
          <span>Badge</span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-[#CAC4D0] shrink-0" />

      {/* Middle Section: Contextual Formatting for Selected Element */}
      {selectedElement ? (
        <div className="flex items-center gap-1.5 shrink-0 animate-fade-in">
          {/* Font Family */}
          <select
            value={selectedElement.fontFamily || 'Plus Jakarta Sans'}
            onChange={(e) => onUpdateElement({ ...selectedElement, fontFamily: e.target.value })}
            className="bg-white border border-[#CAC4D0] rounded-lg px-2 py-1 text-xs text-[#1C1B1F] outline-none"
          >
            {FONTS.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Font Size controls */}
          <div className="flex items-center bg-white border border-[#CAC4D0] rounded-lg overflow-hidden">
            <button
              onClick={() => {
                const cur = selectedElement.fontSize || 18;
                onUpdateElement({ ...selectedElement, fontSize: Math.max(10, cur - 2) });
              }}
              className="px-1.5 py-1 hover:bg-gray-100 text-[#49454F]"
            >
              -
            </button>
            <span className="px-1.5 text-xs font-mono font-bold text-[#1C1B1F]">
              {selectedElement.fontSize || 18}
            </span>
            <button
              onClick={() => {
                const cur = selectedElement.fontSize || 18;
                onUpdateElement({ ...selectedElement, fontSize: Math.min(120, cur + 2) });
              }}
              className="px-1.5 py-1 hover:bg-gray-100 text-[#49454F]"
            >
              +
            </button>
          </div>

          {/* Bold, Italic, Underline */}
          <div className="flex items-center bg-white border border-[#CAC4D0] rounded-lg p-0.5">
            <button
              onClick={() =>
                onUpdateElement({
                  ...selectedElement,
                  fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                })
              }
              className={`p-1 rounded-sm transition ${
                selectedElement.fontWeight === 'bold' ? 'bg-[#EADDFF] text-[#21005D]' : 'text-[#49454F] hover:bg-gray-100'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onUpdateElement({
                  ...selectedElement,
                  fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
              className={`p-1 rounded-sm transition ${
                selectedElement.fontStyle === 'italic' ? 'bg-[#EADDFF] text-[#21005D]' : 'text-[#49454F] hover:bg-gray-100'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onUpdateElement({
                  ...selectedElement,
                  underline: !selectedElement.underline,
                })
              }
              className={`p-1 rounded-sm transition ${
                selectedElement.underline ? 'bg-[#EADDFF] text-[#21005D]' : 'text-[#49454F] hover:bg-gray-100'
              }`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Color Picker */}
          <div className="relative">
            <button
              onClick={() => setColorMenuOpen(colorMenuOpen === 'text' ? null : 'text')}
              className="flex items-center gap-1 p-1.5 rounded-lg bg-white border border-[#CAC4D0] hover:bg-gray-100"
              title="Text Color"
            >
              <div
                className="w-3.5 h-3.5 rounded-sm border border-black/20"
                style={{ backgroundColor: selectedElement.color || '#1C1B1F' }}
              />
            </button>
            {colorMenuOpen === 'text' && (
              <ColorPaletteDropdown
                selectedColor={selectedElement.color || '#1C1B1F'}
                onSelectColor={(col) => {
                  onUpdateElement({ ...selectedElement, color: col });
                  setColorMenuOpen(null);
                }}
              />
            )}
          </div>

          {/* Fill Color Picker */}
          <div className="relative">
            <button
              onClick={() => setColorMenuOpen(colorMenuOpen === 'fill' ? null : 'fill')}
              className="flex items-center gap-1 p-1.5 rounded-lg bg-white border border-[#CAC4D0] hover:bg-gray-100"
              title="Fill / Background Color"
            >
              <Palette className="w-3.5 h-3.5 text-[#49454F]" />
              <div
                className="w-3 h-3 rounded-full border border-black/20"
                style={{ backgroundColor: selectedElement.fill || 'transparent' }}
              />
            </button>
            {colorMenuOpen === 'fill' && (
              <ColorPaletteDropdown
                selectedColor={selectedElement.fill || '#FFFFFF'}
                onSelectColor={(col) => {
                  onUpdateElement({ ...selectedElement, fill: col });
                  setColorMenuOpen(null);
                }}
              />
            )}
          </div>

          {/* Alignment */}
          <div className="flex items-center bg-white border border-[#CAC4D0] rounded-lg p-0.5 hidden sm:flex">
            <button
              onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'left' })}
              className={`p-1 rounded-sm ${selectedElement.textAlign === 'left' ? 'bg-[#EADDFF]' : ''}`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'center' })}
              className={`p-1 rounded-sm ${selectedElement.textAlign === 'center' ? 'bg-[#EADDFF]' : ''}`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateElement({ ...selectedElement, textAlign: 'right' })}
              className={`p-1 rounded-sm ${selectedElement.textAlign === 'right' ? 'bg-[#EADDFF]' : ''}`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Layer order */}
          <button
            onClick={() => onUpdateElement({ ...selectedElement, zIndex: selectedElement.zIndex + 1 })}
            className="p-1.5 rounded-lg bg-white border border-[#CAC4D0] text-[#49454F] hover:bg-gray-100"
            title="Bring to front"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate & Delete */}
          <button
            onClick={() => onDuplicateElement(selectedElement)}
            className="p-1.5 rounded-lg bg-white border border-[#CAC4D0] text-[#49454F] hover:bg-gray-100"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1.5 rounded-lg bg-white border border-[#CAC4D0] text-[#B3261E] hover:bg-red-50"
            title="Delete (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Lock */}
          <button
            onClick={() => onUpdateElement({ ...selectedElement, locked: !selectedElement.locked })}
            className={`p-1.5 rounded-lg bg-white border border-[#CAC4D0] ${
              selectedElement.locked ? 'text-[#B3261E] bg-red-50' : 'text-[#49454F]'
            }`}
            title={selectedElement.locked ? 'Unlock element' : 'Lock element position'}
          >
            {selectedElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <div className="text-xs text-[#79747E] italic hidden md:inline truncate">
          Select any element to adjust formatting & properties
        </div>
      )}

      {/* Right section: Snap & Grid & Zoom Toggles */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Canva Smart Snap Toggle */}
        <button
          onClick={onToggleSnap}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition font-medium ${
            snapEnabled
              ? 'bg-[#EADDFF] border-[#6750A4] text-[#21005D]'
              : 'bg-white border-[#CAC4D0] text-[#79747E]'
          }`}
          title="Canva-like Smart Autosnap Alignment Guides (magnetic guides)"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Autosnap</span>
        </button>

        {/* Grid Overlay Toggle */}
        <button
          onClick={onCycleGrid}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition font-medium ${
            showGrid !== 'none'
              ? 'bg-[#EADDFF] border-[#6750A4] text-[#21005D]'
              : 'bg-white border-[#CAC4D0] text-[#79747E]'
          }`}
          title="Toggle Canvas Grid Pattern (Dots / Lines / Off)"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">
            {showGrid === 'dots' ? 'Dots' : showGrid === 'lines' ? 'Lines' : 'Grid'}
          </span>
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center bg-white border border-[#CAC4D0] rounded-full overflow-hidden px-1">
          <button
            onClick={() => onSetScale(Math.max(0.3, scale - 0.1))}
            className="p-1 text-[#49454F] hover:bg-gray-100 rounded-full"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[11px] font-mono px-1 font-bold text-[#1C1B1F]">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => onSetScale(Math.min(1.8, scale + 0.1))}
            className="p-1 text-[#49454F] hover:bg-gray-100 rounded-full"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Color Swatch Dropdown
const ColorPaletteDropdown: React.FC<{
  selectedColor: string;
  onSelectColor: (col: string) => void;
}> = ({ selectedColor, onSelectColor }) => {
  return (
    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#CAC4D0] rounded-2xl shadow-2xl p-2.5 z-[60] animate-fade-in">
      <div className="text-[10px] font-bold text-[#79747E] uppercase tracking-wider mb-1.5">
        Material Colors
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {M3_PALETTES.map((color) => (
          <button
            key={color}
            onClick={() => onSelectColor(color)}
            style={{ backgroundColor: color }}
            className={`w-8 h-8 rounded-lg border transition hover:scale-110 ${
              selectedColor === color ? 'border-2 border-[#EA8600] scale-105' : 'border-black/15'
            }`}
          />
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onSelectColor(e.target.value)}
          className="w-6 h-6 rounded-md cursor-pointer border-0 p-0"
        />
        <span className="text-[11px] text-gray-500 font-mono">Custom Color</span>
      </div>
    </div>
  );
};
