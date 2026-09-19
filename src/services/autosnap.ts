import { SlideElement, SnapGuide } from '../types';

export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;
const SNAP_THRESHOLD = 8; // Snap distance in slide coordinate pixels

interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

export function calculateSnap(
  currentElementId: string,
  proposedX: number,
  proposedY: number,
  width: number,
  height: number,
  allElements: SlideElement[],
  snapEnabled: boolean = true,
  gridSnap: boolean = false,
  gridSize: number = 20
): SnapResult {
  if (!snapEnabled) {
    if (gridSnap) {
      return {
        x: Math.round(proposedX / gridSize) * gridSize,
        y: Math.round(proposedY / gridSize) * gridSize,
        guides: [],
      };
    }
    return { x: proposedX, y: proposedY, guides: [] };
  }

  let finalX = proposedX;
  let finalY = proposedY;
  const guides: SnapGuide[] = [];

  const elemLeft = proposedX;
  const elemRight = proposedX + width;
  const elemCenterX = proposedX + width / 2;

  const elemTop = proposedY;
  const elemBottom = proposedY + height;
  const elemCenterY = proposedY + height / 2;

  // 1. Slide Center Snapping (Vertical Line at X = 640)
  const slideCenterX = SLIDE_WIDTH / 2;
  if (Math.abs(elemCenterX - slideCenterX) <= SNAP_THRESHOLD) {
    finalX = slideCenterX - width / 2;
    guides.push({
      id: 'guide-slide-center-x',
      type: 'vertical',
      position: slideCenterX,
      start: 0,
      end: SLIDE_HEIGHT,
      label: 'Center',
      isCenter: true,
    });
  }

  // Slide Center Snapping (Horizontal Line at Y = 360)
  const slideCenterY = SLIDE_HEIGHT / 2;
  if (Math.abs(elemCenterY - slideCenterY) <= SNAP_THRESHOLD) {
    finalY = slideCenterY - height / 2;
    guides.push({
      id: 'guide-slide-center-y',
      type: 'horizontal',
      position: slideCenterY,
      start: 0,
      end: SLIDE_WIDTH,
      label: 'Center',
      isCenter: true,
    });
  }

  // Slide Margins (Safe Area Snapping: 60px and 100px)
  const marginsX = [60, 100, SLIDE_WIDTH - 100, SLIDE_WIDTH - 60];
  marginsX.forEach((m) => {
    if (Math.abs(elemLeft - m) <= SNAP_THRESHOLD) {
      finalX = m;
      guides.push({
        id: `guide-margin-x-${m}`,
        type: 'vertical',
        position: m,
        start: 0,
        end: SLIDE_HEIGHT,
        label: 'Margin',
      });
    } else if (Math.abs(elemRight - m) <= SNAP_THRESHOLD) {
      finalX = m - width;
      guides.push({
        id: `guide-margin-x-${m}`,
        type: 'vertical',
        position: m,
        start: 0,
        end: SLIDE_HEIGHT,
        label: 'Margin',
      });
    }
  });

  const marginsY = [60, 100, SLIDE_HEIGHT - 100, SLIDE_HEIGHT - 60];
  marginsY.forEach((m) => {
    if (Math.abs(elemTop - m) <= SNAP_THRESHOLD) {
      finalY = m;
      guides.push({
        id: `guide-margin-y-${m}`,
        type: 'horizontal',
        position: m,
        start: 0,
        end: SLIDE_WIDTH,
        label: 'Margin',
      });
    } else if (Math.abs(elemBottom - m) <= SNAP_THRESHOLD) {
      finalY = m - height;
      guides.push({
        id: `guide-margin-y-${m}`,
        type: 'horizontal',
        position: m,
        start: 0,
        end: SLIDE_WIDTH,
        label: 'Margin',
      });
    }
  });

  // 2. Element-to-Element Snapping
  const otherElements = allElements.filter((el) => el.id !== currentElementId);

  let bestDiffX = SNAP_THRESHOLD + 1;
  let bestXSnap: { x: number; guide: SnapGuide } | null = null;

  let bestDiffY = SNAP_THRESHOLD + 1;
  let bestYSnap: { y: number; guide: SnapGuide } | null = null;

  for (const other of otherElements) {
    const oLeft = other.x;
    const oRight = other.x + other.width;
    const oCenterX = other.x + other.width / 2;

    const oTop = other.y;
    const oBottom = other.y + other.height;
    const oCenterY = other.y + other.height / 2;

    // X-Alignments:
    // 1. Center to Center
    const diffCenterX = Math.abs(elemCenterX - oCenterX);
    if (diffCenterX < bestDiffX) {
      bestDiffX = diffCenterX;
      bestXSnap = {
        x: oCenterX - width / 2,
        guide: {
          id: `snap-x-center-${other.id}`,
          type: 'vertical',
          position: oCenterX,
          start: Math.min(elemTop, oTop) - 20,
          end: Math.max(elemBottom, oBottom) + 20,
          label: 'Align Center',
          isCenter: true,
        },
      };
    }

    // 2. Left to Left
    const diffLeftLeft = Math.abs(elemLeft - oLeft);
    if (diffLeftLeft < bestDiffX) {
      bestDiffX = diffLeftLeft;
      bestXSnap = {
        x: oLeft,
        guide: {
          id: `snap-x-left-left-${other.id}`,
          type: 'vertical',
          position: oLeft,
          start: Math.min(elemTop, oTop) - 20,
          end: Math.max(elemBottom, oBottom) + 20,
          label: 'Align Left',
        },
      };
    }

    // 3. Right to Right
    const diffRightRight = Math.abs(elemRight - oRight);
    if (diffRightRight < bestDiffX) {
      bestDiffX = diffRightRight;
      bestXSnap = {
        x: oRight - width,
        guide: {
          id: `snap-x-right-right-${other.id}`,
          type: 'vertical',
          position: oRight,
          start: Math.min(elemTop, oTop) - 20,
          end: Math.max(elemBottom, oBottom) + 20,
          label: 'Align Right',
        },
      };
    }

    // 4. Left to Right
    const diffLeftRight = Math.abs(elemLeft - oRight);
    if (diffLeftRight < bestDiffX) {
      bestDiffX = diffLeftRight;
      bestXSnap = {
        x: oRight,
        guide: {
          id: `snap-x-left-right-${other.id}`,
          type: 'vertical',
          position: oRight,
          start: Math.min(elemTop, oTop) - 20,
          end: Math.max(elemBottom, oBottom) + 20,
          label: 'Snap Adjacent',
        },
      };
    }

    // 5. Right to Left
    const diffRightLeft = Math.abs(elemRight - oLeft);
    if (diffRightLeft < bestDiffX) {
      bestDiffX = diffRightLeft;
      bestXSnap = {
        x: oLeft - width,
        guide: {
          id: `snap-x-right-left-${other.id}`,
          type: 'vertical',
          position: oLeft,
          start: Math.min(elemTop, oTop) - 20,
          end: Math.max(elemBottom, oBottom) + 20,
          label: 'Snap Adjacent',
        },
      };
    }

    // Y-Alignments:
    // 1. Center to Center
    const diffCenterY = Math.abs(elemCenterY - oCenterY);
    if (diffCenterY < bestDiffY) {
      bestDiffY = diffCenterY;
      bestYSnap = {
        y: oCenterY - height / 2,
        guide: {
          id: `snap-y-center-${other.id}`,
          type: 'horizontal',
          position: oCenterY,
          start: Math.min(elemLeft, oLeft) - 20,
          end: Math.max(elemRight, oRight) + 20,
          label: 'Align Middle',
          isCenter: true,
        },
      };
    }

    // 2. Top to Top
    const diffTopTop = Math.abs(elemTop - oTop);
    if (diffTopTop < bestDiffY) {
      bestDiffY = diffTopTop;
      bestYSnap = {
        y: oTop,
        guide: {
          id: `snap-y-top-top-${other.id}`,
          type: 'horizontal',
          position: oTop,
          start: Math.min(elemLeft, oLeft) - 20,
          end: Math.max(elemRight, oRight) + 20,
          label: 'Align Top',
        },
      };
    }

    // 3. Bottom to Bottom
    const diffBottomBottom = Math.abs(elemBottom - oBottom);
    if (diffBottomBottom < bestDiffY) {
      bestDiffY = diffBottomBottom;
      bestYSnap = {
        y: oBottom - height,
        guide: {
          id: `snap-y-bottom-bottom-${other.id}`,
          type: 'horizontal',
          position: oBottom,
          start: Math.min(elemLeft, oLeft) - 20,
          end: Math.max(elemRight, oRight) + 20,
          label: 'Align Bottom',
        },
      };
    }

    // 4. Top to Bottom
    const diffTopBottom = Math.abs(elemTop - oBottom);
    if (diffTopBottom < bestDiffY) {
      bestDiffY = diffTopBottom;
      bestYSnap = {
        y: oBottom,
        guide: {
          id: `snap-y-top-bottom-${other.id}`,
          type: 'horizontal',
          position: oBottom,
          start: Math.min(elemLeft, oLeft) - 20,
          end: Math.max(elemRight, oRight) + 20,
          label: 'Snap Adjacent',
        },
      };
    }

    // 5. Bottom to Top
    const diffBottomTop = Math.abs(elemBottom - oTop);
    if (diffBottomTop < bestDiffY) {
      bestDiffY = diffBottomTop;
      bestYSnap = {
        y: oTop - height,
        guide: {
          id: `snap-y-bottom-top-${other.id}`,
          type: 'horizontal',
          position: oTop,
          start: Math.min(elemLeft, oLeft) - 20,
          end: Math.max(elemRight, oRight) + 20,
          label: 'Snap Adjacent',
        },
      };
    }
  }

  if (bestXSnap && bestDiffX <= SNAP_THRESHOLD) {
    finalX = bestXSnap.x;
    guides.push(bestXSnap.guide);
  }

  if (bestYSnap && bestDiffY <= SNAP_THRESHOLD) {
    finalY = bestYSnap.y;
    guides.push(bestYSnap.guide);
  }

  if (gridSnap && guides.length === 0) {
    finalX = Math.round(finalX / gridSize) * gridSize;
    finalY = Math.round(finalY / gridSize) * gridSize;
  }

  return {
    x: finalX,
    y: finalY,
    guides,
  };
}
