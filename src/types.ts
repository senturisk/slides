/**
 * @license
 * Sen Slides - by Senturisk
 * Core Type Definitions
 */

export type ElementType = 'text' | 'shape' | 'image' | 'icon' | 'badge' | 'line' | 'table';

export type ShapeType = 
  | 'rectangle' 
  | 'rounded' 
  | 'circle' 
  | 'triangle' 
  | 'arrow-right' 
  | 'arrow-left' 
  | 'star' 
  | 'diamond' 
  | 'speech-bubble';

export interface SlideElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex: number;
  locked?: boolean;
  
  // Content
  text?: string;
  shapeType?: ShapeType;
  imageUrl?: string;
  iconName?: string;
  tableData?: string[][];

  // Text styling
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | '500' | '600' | '700' | 'bold' | '800' | string;
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  lineHeight?: number;

  // Box styling
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  padding?: number;
}

export type SlideLayout = 
  | 'title' 
  | 'title-body' 
  | 'section' 
  | 'two-columns' 
  | 'blank' 
  | 'quote' 
  | 'metrics';

export type SlideTransition = 'none' | 'fade' | 'slide' | 'zoom' | 'flip';

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image';
  value: string;
}

export interface Slide {
  id: string;
  title: string;
  background: SlideBackground;
  elements: SlideElement[];
  notes: string;
  layoutType?: SlideLayout;
  layout?: SlideLayout;
  transition?: SlideTransition;
}

export interface PresentationTheme {
  id: string;
  name: string;
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  textColor: string;
  accent: string;
  fontFamily: string;
  headingFont: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
  themeId: string;
  aspectRatio: '16:9' | '4:3';
  author: string;
}

export interface SnapGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
  label?: string;
  isCenter?: boolean;
}

export interface Collaborator {
  peerId: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number; slideId: string };
  selectedElementId?: string | null;
  lastActive: number;
}

export type CollabMessage = 
  | { type: 'join'; name: string; color: string }
  | { type: 'welcome'; presentation: Presentation; collaborators: Collaborator[] }
  | { type: 'cursor'; x: number; y: number; slideId: string; selectedElementId?: string | null }
  | { type: 'update_slide'; slide: Slide }
  | { type: 'update_presentation'; presentation: Presentation }
  | { type: 'change_slide'; slideId: string }
  | { type: 'user_left'; peerId: string };
