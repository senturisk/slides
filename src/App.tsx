import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Presentation, 
  Slide, 
  SlideElement, 
  SlideLayout, 
  PresentationTheme, 
  Collaborator 
} from './types';
import { DEFAULT_PRESENTATION } from './data/defaultPresentation';
import { THEMES } from './data/themes';
import { 
  loadPresentation, 
  savePresentation, 
  createBlankPresentation 
} from './services/storage';
import { collabService } from './services/peerCollab';
import { importPresentationFile } from './services/exportImport';

const deepClone = <T,>(obj: T): T => {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
};

import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { SlideFilmstrip } from './components/SlideFilmstrip';
import { SlideCanvas } from './components/SlideCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { PresentationMode } from './components/PresentationMode';
import { CollaborationModal } from './components/CollaborationModal';
import { PresentationListModal } from './components/PresentationListModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MobileLayout } from './components/MobileLayout';

export const App: React.FC = () => {
  const [presentation, setPresentation] = useState<Presentation>(DEFAULT_PRESENTATION);
  const [activeSlideId, setActiveSlideId] = useState<string>(DEFAULT_PRESENTATION.slides[0].id);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Autosnap & Grid states
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [gridSnap, setGridSnap] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<'none' | 'dots' | 'lines'>('dots');

  // Canvas zoom & layout state
  const [canvasScale, setCanvasScale] = useState<number>(0.75);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState<boolean>(false);
  const [isDeckListModalOpen, setIsDeckListModalOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Real-time collaborators state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Undo / Redo history
  const [history, setHistory] = useState<Presentation[]>([DEFAULT_PRESENTATION]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const historyRef = useRef<Presentation[]>([DEFAULT_PRESENTATION]);
  const historyIndexRef = useRef<number>(0);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive mobile detector
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsInspectorOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize presentation from local IndexedDB
  useEffect(() => {
    const initStorage = async () => {
      try {
        const stored = await loadPresentation();
        if (stored && stored.slides && stored.slides.length > 0) {
          const clean = deepClone(stored);
          setPresentation(clean);
          setActiveSlideId(clean.slides[0].id);
          const initialHist = [clean];
          setHistory(initialHist);
          historyRef.current = initialHist;
          setHistoryIndex(0);
          historyIndexRef.current = 0;
        } else {
          const initial = deepClone(DEFAULT_PRESENTATION);
          await savePresentation(initial);
          setPresentation(initial);
          const initialHist = [initial];
          setHistory(initialHist);
          historyRef.current = initialHist;
          setHistoryIndex(0);
          historyIndexRef.current = 0;
        }
      } catch (err) {
        console.error('Storage initialization failed, using default presentation:', err);
      }
    };
    initStorage();
  }, []);

  // Connect Collab service listeners
  useEffect(() => {
    collabService.onCollaboratorsChange = (list) => {
      setCollaborators(list);
    };

    collabService.onRemotePresentationUpdate = (remotePres) => {
      setPresentation(remotePres);
    };

    return () => {
      collabService.onCollaboratorsChange = null;
      collabService.onRemotePresentationUpdate = null;
    };
  }, []);

  // Debounced Autosave to IndexedDB
  const triggerAutosave = useCallback((updated: Presentation) => {
    setIsSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        await savePresentation(updated);
      } finally {
        setIsSaving(false);
      }
    }, 600);
  }, []);

  // Update presentation with history record (snapshot immutable copies)
  const updatePresentationWithHistory = useCallback((
    updater: (prev: Presentation) => Presentation,
    recordHistory = true
  ) => {
    setPresentation((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      if (!next || !next.slides || next.slides.length === 0) return prev;
      next.updatedAt = Date.now();

      if (recordHistory) {
        const snapshot = deepClone(next);
        const currentIdx = historyIndexRef.current;
        const currentHist = historyRef.current;
        const trimmed = currentHist.slice(0, Math.min(currentIdx + 1, currentHist.length));
        const newHistory = [...trimmed, snapshot];
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        const newIdx = newHistory.length - 1;
        historyRef.current = newHistory;
        historyIndexRef.current = newIdx;
        setHistory(newHistory);
        setHistoryIndex(newIdx);
      }

      // Broadcast changes to peers if connected
      collabService.broadcastPresentationUpdate(next);

      // Trigger debounced storage save
      triggerAutosave(next);

      return next;
    });
  }, [triggerAutosave]);

  // Safe Undo / Redo actions
  const handleUndo = useCallback(() => {
    const curIdx = historyIndexRef.current;
    const hist = historyRef.current;
    if (curIdx <= 0 || !hist[curIdx - 1]) return;

    const targetIdx = curIdx - 1;
    const target = deepClone(hist[targetIdx]);
    if (!target || !target.slides || target.slides.length === 0) return;

    historyIndexRef.current = targetIdx;
    setHistoryIndex(targetIdx);
    setPresentation(target);

    // Keep activeSlideId valid
    setActiveSlideId((prevId) => {
      const slideExists = target.slides.some((s) => s.id === prevId);
      if (!slideExists) {
        setSelectedElementId(null);
        return target.slides[0].id;
      }
      return prevId;
    });

    // Keep selectedElementId valid
    setSelectedElementId((prevElId) => {
      if (!prevElId) return null;
      const slide = target.slides.find((s) => s.id === activeSlideId) || target.slides[0];
      const elExists = slide?.elements.some((el) => el.id === prevElId);
      return elExists ? prevElId : null;
    });

    triggerAutosave(target);
    collabService.broadcastPresentationUpdate(target);
  }, [activeSlideId, triggerAutosave]);

  const handleRedo = useCallback(() => {
    const curIdx = historyIndexRef.current;
    const hist = historyRef.current;
    if (curIdx >= hist.length - 1 || !hist[curIdx + 1]) return;

    const targetIdx = curIdx + 1;
    const target = deepClone(hist[targetIdx]);
    if (!target || !target.slides || target.slides.length === 0) return;

    historyIndexRef.current = targetIdx;
    setHistoryIndex(targetIdx);
    setPresentation(target);

    // Keep activeSlideId valid
    setActiveSlideId((prevId) => {
      const slideExists = target.slides.some((s) => s.id === prevId);
      if (!slideExists) {
        setSelectedElementId(null);
        return target.slides[0].id;
      }
      return prevId;
    });

    // Keep selectedElementId valid
    setSelectedElementId((prevElId) => {
      if (!prevElId) return null;
      const slide = target.slides.find((s) => s.id === activeSlideId) || target.slides[0];
      const elExists = slide?.elements.some((el) => el.id === prevElId);
      return elExists ? prevElId : null;
    });

    triggerAutosave(target);
    collabService.broadcastPresentationUpdate(target);
  }, [activeSlideId, triggerAutosave]);

  // Current active slide
  const currentSlide = presentation.slides.find((s) => s.id === activeSlideId) || presentation.slides[0];
  const currentSlideIndex = Math.max(0, presentation.slides.findIndex((s) => s.id === activeSlideId));
  const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId) || null;

  // Slide element manipulations
  const handleUpdateElement = useCallback((updated: SlideElement, recordHistory = true) => {
    updatePresentationWithHistory((prev) => ({
      ...prev,
      slides: prev.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) => (el.id === updated.id ? updated : el)),
            }
          : s
      ),
    }), recordHistory);
  }, [activeSlideId, updatePresentationWithHistory]);

  const handleAddElement = useCallback((element: SlideElement) => {
    updatePresentationWithHistory((prev) => ({
      ...prev,
      slides: prev.slides.map((s) =>
        s.id === activeSlideId
          ? { ...s, elements: [...s.elements, element] }
          : s
      ),
    }));
    setSelectedElementId(element.id);
  }, [activeSlideId, updatePresentationWithHistory]);

  const handleDeleteElement = useCallback((id: string) => {
    updatePresentationWithHistory((prev) => ({
      ...prev,
      slides: prev.slides.map((s) =>
        s.id === activeSlideId
          ? { ...s, elements: s.elements.filter((el) => el.id !== id) }
          : s
      ),
    }));
    setSelectedElementId(null);
  }, [activeSlideId, updatePresentationWithHistory]);

  const handleDuplicateElement = useCallback((element: SlideElement) => {
    const duplicate: SlideElement = {
      ...element,
      id: 'el-' + Math.random().toString(36).substring(2, 9),
      x: element.x + 24,
      y: element.y + 24,
      zIndex: (element.zIndex || 10) + 1,
    };
    handleAddElement(duplicate);
  }, [handleAddElement]);

  // Slide CRUD
  const handleUpdateSlide = useCallback((updatedSlide: Slide) => {
    updatePresentationWithHistory((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => (s.id === updatedSlide.id ? updatedSlide : s)),
    }));
  }, [updatePresentationWithHistory]);

  const handleAddSlide = useCallback((layout: SlideLayout = 'title-body') => {
    const newSlideId = 'slide-' + Math.random().toString(36).substring(2, 9);
    const newSlide: Slide = {
      id: newSlideId,
      title: layout === 'title' ? 'Title Slide' : 'Slide Title',
      layout,
      background: { type: 'color', value: '#FFFFFF' },
      elements: [],
      notes: '',
    };

    if (layout === 'title') {
      newSlide.elements = [
        {
          id: 'el-title',
          type: 'text',
          x: 240,
          y: 260,
          width: 800,
          height: 100,
          rotation: 0,
          zIndex: 10,
          text: 'Title of Your Presentation',
          fontSize: 52,
          fontWeight: '800',
          textAlign: 'center',
          color: '#1C1B1F',
        },
        {
          id: 'el-sub',
          type: 'text',
          x: 340,
          y: 380,
          width: 600,
          height: 60,
          rotation: 0,
          zIndex: 10,
          text: 'Subtitle or Presenter Name',
          fontSize: 24,
          textAlign: 'center',
          color: '#49454F',
        },
      ];
    } else if (layout === 'metrics') {
      newSlide.elements = [
        {
          id: 'el-heading',
          type: 'text',
          x: 100,
          y: 90,
          width: 600,
          height: 60,
          zIndex: 10,
          text: 'Key Performance Indicators',
          fontSize: 36,
          fontWeight: '800',
        },
        {
          id: 'card-1',
          type: 'shape',
          shapeType: 'rounded',
          x: 100,
          y: 220,
          width: 320,
          height: 320,
          fill: '#F6F2FF',
          borderRadius: 24,
          stroke: '#EADDFF',
          strokeWidth: 2,
          text: '99.9%\n\nOffline Reliability with IndexedDB',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#21005D',
          textAlign: 'center',
          zIndex: 10,
        },
        {
          id: 'card-2',
          type: 'shape',
          shapeType: 'rounded',
          x: 480,
          y: 220,
          width: 320,
          height: 320,
          fill: '#FFF8E1',
          borderRadius: 24,
          stroke: '#FFE082',
          strokeWidth: 2,
          text: '< 15ms\n\nReal-time PeerJS WebRTC Latency',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#EA8600',
          textAlign: 'center',
          zIndex: 10,
        },
        {
          id: 'card-3',
          type: 'shape',
          shapeType: 'rounded',
          x: 860,
          y: 220,
          width: 320,
          height: 320,
          fill: '#F1F5E9',
          borderRadius: 24,
          stroke: '#C4EED0',
          strokeWidth: 2,
          text: '100%\n\nClient-Side Export to PNG & .sen',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#386A20',
          textAlign: 'center',
          zIndex: 10,
        },
      ];
    } else if (layout === 'title-body') {
      newSlide.elements = [
        {
          id: 'el-heading',
          type: 'text',
          x: 100,
          y: 90,
          width: 700,
          height: 60,
          zIndex: 10,
          text: 'Topic Overview',
          fontSize: 40,
          fontWeight: '800',
        },
        {
          id: 'el-body',
          type: 'text',
          x: 100,
          y: 190,
          width: 800,
          height: 300,
          zIndex: 10,
          text: '• Point 1: Double-click to customize this text block\n• Point 2: Snap guides ensure perfect Canva-style alignment\n• Point 3: All slides persist offline in your browser',
          fontSize: 22,
          lineHeight: 1.6,
        },
      ];
    }

    updatePresentationWithHistory((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setActiveSlideId(newSlideId);
    setSelectedElementId(null);
  }, [updatePresentationWithHistory]);

  const handleDuplicateSlide = useCallback((id: string) => {
    const target = presentation.slides.find((s) => s.id === id);
    if (!target) return;

    const duplicateSlide: Slide = {
      ...target,
      id: 'slide-' + Math.random().toString(36).substring(2, 9),
      title: `${target.title} (Copy)`,
      elements: target.elements.map((el) => ({
        ...el,
        id: 'el-' + Math.random().toString(36).substring(2, 9),
      })),
    };

    updatePresentationWithHistory((prev) => {
      const idx = prev.slides.findIndex((s) => s.id === id);
      const newSlides = [...prev.slides];
      newSlides.splice(idx + 1, 0, duplicateSlide);
      return { ...prev, slides: newSlides };
    });
    setActiveSlideId(duplicateSlide.id);
  }, [presentation.slides, updatePresentationWithHistory]);

  const handleDeleteSlide = useCallback((id: string) => {
    if (presentation.slides.length <= 1) {
      alert('Cannot delete the only slide in the presentation.');
      return;
    }

    updatePresentationWithHistory((prev) => {
      const newSlides = prev.slides.filter((s) => s.id !== id);
      return { ...prev, slides: newSlides };
    });

    if (activeSlideId === id) {
      const remaining = presentation.slides.filter((s) => s.id !== id);
      setActiveSlideId(remaining[0].id);
    }
  }, [activeSlideId, presentation.slides, updatePresentationWithHistory]);

  const handleMoveSlide = useCallback((index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= presentation.slides.length) return;

    updatePresentationWithHistory((prev) => {
      const copy = [...prev.slides];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return { ...prev, slides: copy };
    });
  }, [presentation.slides.length, updatePresentationWithHistory]);

  // Theme application
  const handleSelectTheme = useCallback((theme: PresentationTheme) => {
    updatePresentationWithHistory((prev) => ({
      ...prev,
      themeId: theme.id,
      slides: prev.slides.map((s) => ({
        ...s,
        background: { type: 'color', value: theme.background },
      })),
    }));
  }, [updatePresentationWithHistory]);

  // Title Update
  const handleUpdateTitle = useCallback((title: string) => {
    updatePresentationWithHistory((prev) => ({ ...prev, title }));
  }, [updatePresentationWithHistory]);

  // Create New Presentation
  const handleNewPresentation = useCallback(async () => {
    const blank = createBlankPresentation('Untitled Presentation');
    await savePresentation(blank);
    setPresentation(blank);
    setActiveSlideId(blank.slides[0].id);
    setSelectedElementId(null);
    const initialHist = [deepClone(blank)];
    setHistory(initialHist);
    historyRef.current = initialHist;
    setHistoryIndex(0);
    historyIndexRef.current = 0;
  }, []);

  // Import file (.pptx, .odp, .ppt, .sen, .json)
  const handleImportPresentation = useCallback(async (file: File) => {
    try {
      const imported = await importPresentationFile(file);
      await savePresentation(imported);
      setPresentation(imported);
      setActiveSlideId(imported.slides[0].id);
      setSelectedElementId(null);
      const initialHist = [deepClone(imported)];
      setHistory(initialHist);
      historyRef.current = initialHist;
      setHistoryIndex(0);
      historyIndexRef.current = 0;
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to import presentation');
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If user is typing in an input or textarea, skip global shortcuts
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === 'input' || tag === 'textarea' || isEditable) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z
      else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Delete selected element: Delete or Backspace
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        handleDeleteElement(selectedElementId);
      }
      // Duplicate element: Ctrl+D / Cmd+D
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedElement) {
        e.preventDefault();
        handleDuplicateElement(selectedElement);
      }
      // Launch Presentation: F5 or Ctrl+Enter
      else if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        e.preventDefault();
        setIsPresentationMode(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo, selectedElementId, selectedElement, handleDeleteElement, handleDuplicateElement]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FEF7FF] overflow-hidden text-[#1C1B1F] font-sans antialiased">
      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* Desktop or Mobile Header */}
      {!isMobile ? (
        <Header
          presentation={presentation}
          currentSlide={currentSlide}
          onUpdateTitle={handleUpdateTitle}
          onNewPresentation={handleNewPresentation}
          onOpenPresentationList={() => setIsDeckListModalOpen(true)}
          onImportPresentation={handleImportPresentation}
          onPresent={() => setIsPresentationMode(true)}
          onOpenCollab={() => setIsCollabModalOpen(true)}
          collaboratorCount={collaborators.length}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
          isInspectorOpen={isInspectorOpen}
          isSaving={isSaving}
        />
      ) : null}

      {/* Desktop Toolbar */}
      {!isMobile && (
        <Toolbar
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onAddElement={handleAddElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled((prev) => !prev)}
          gridSnap={gridSnap}
          onToggleGridSnap={() => setGridSnap((prev) => !prev)}
          showGrid={showGrid}
          onCycleGrid={() =>
            setShowGrid((prev) => (prev === 'none' ? 'dots' : prev === 'dots' ? 'lines' : 'none'))
          }
          scale={canvasScale}
          onSetScale={setCanvasScale}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      )}

      {/* Mobile Top and Navigation Controls */}
      {isMobile && (
        <MobileLayout
          presentation={presentation}
          currentSlide={currentSlide}
          activeSlideIndex={currentSlideIndex}
          onSelectSlide={setActiveSlideId}
          onAddSlide={handleAddSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onAddElement={handleAddElement}
          onDeleteElement={handleDeleteElement}
          onUpdateSlide={handleUpdateSlide}
          onPresent={() => setIsPresentationMode(true)}
          onOpenCollab={() => setIsCollabModalOpen(true)}
          onOpenSavedDecks={() => setIsDeckListModalOpen(true)}
          onSelectTheme={handleSelectTheme}
          collaboratorCount={collaborators.length}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled((prev) => !prev)}
          showGrid={showGrid}
          onCycleGrid={() =>
            setShowGrid((prev) => (prev === 'none' ? 'dots' : prev === 'dots' ? 'lines' : 'none'))
          }
        />
      )}

      {/* Main Workspace Area */}
      <div className={`flex-1 flex overflow-hidden relative z-10 ${isMobile ? 'pb-16' : ''}`}>
        {/* Desktop Left Slide Filmstrip */}
        {!isMobile && (
          <SlideFilmstrip
            slides={presentation.slides}
            activeSlideId={activeSlideId}
            onSelectSlide={(id) => {
              setActiveSlideId(id);
              setSelectedElementId(null);
            }}
            onAddSlide={handleAddSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onMoveSlide={handleMoveSlide}
          />
        )}

        {/* Center Interactive Slide Canvas */}
        <SlideCanvas
          slide={currentSlide}
          onUpdateSlide={handleUpdateSlide}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleUpdateElement}
          onAddElement={handleAddElement}
          onDeleteElement={handleDeleteElement}
          collaborators={collaborators}
          snapEnabled={snapEnabled}
          gridSnap={gridSnap}
          showGrid={showGrid}
          scale={canvasScale}
          onSetScale={setCanvasScale}
        />

        {/* Desktop Right Inspector Panel */}
        {!isMobile && (
          <InspectorPanel
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            slide={currentSlide}
            onUpdateSlide={handleUpdateSlide}
            currentThemeId={presentation.themeId}
            onSelectTheme={handleSelectTheme}
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
          />
        )}
      </div>

      {/* Fullscreen Presentation Slideshow Mode */}
      {isPresentationMode && (
        <PresentationMode
          presentation={presentation}
          initialSlideIndex={currentSlideIndex}
          onExit={() => setIsPresentationMode(false)}
        />
      )}

      {/* Real-time Collaboration Modal */}
      <CollaborationModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        collaborators={collaborators}
        presentation={presentation}
        onApplyRemotePresentation={setPresentation}
      />

      {/* Stored Presentations List (Offline Database) */}
      <PresentationListModal
        isOpen={isDeckListModalOpen}
        onClose={() => setIsDeckListModalOpen(false)}
        currentPresentationId={presentation.id}
        onSelectPresentation={(p) => {
          const clean = deepClone(p);
          setPresentation(clean);
          setActiveSlideId(clean.slides[0]?.id || '');
          setSelectedElementId(null);
          const initialHist = [clean];
          setHistory(initialHist);
          historyRef.current = initialHist;
          setHistoryIndex(0);
          historyIndexRef.current = 0;
        }}
        onNewPresentation={handleNewPresentation}
      />
    </div>
  );
};

export default App;
