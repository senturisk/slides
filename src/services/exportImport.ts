import pptxgen from 'pptxgenjs';
import JSZip from 'jszip';
import { Presentation, Slide, SlideElement, SlideLayout } from '../types';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from './autosnap';

/**
 * Export presentation to .sen (JSON) file download
 */
export function exportToSenFile(presentation: Presentation) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(presentation, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const cleanTitle = presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadAnchor.setAttribute('download', `${cleanTitle || 'presentation'}.sen.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export presentation to native PowerPoint (.pptx)
 */
export async function exportToPPTX(presentation: Presentation): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pptx.author = presentation.author || 'Senturisk';
  pptx.title = presentation.title;

  // 1280x720 canvas: 1 inch = 128px
  const PX_TO_INCH = 1 / 128;

  for (const slide of presentation.slides) {
    const pptSlide = pptx.addSlide();

    // Background color
    if (slide.background.type === 'color' && slide.background.value) {
      const hex = slide.background.value.replace('#', '');
      pptSlide.background = { color: hex };
    } else {
      pptSlide.background = { color: 'FFFFFF' };
    }

    // Speaker notes
    if (slide.notes && slide.notes.trim()) {
      pptSlide.addNotes(slide.notes);
    }

    // Sort elements by zIndex
    const sorted = [...slide.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    for (const el of sorted) {
      const x = el.x * PX_TO_INCH;
      const y = el.y * PX_TO_INCH;
      const w = Math.max(0.2, el.width * PX_TO_INCH);
      const h = Math.max(0.2, el.height * PX_TO_INCH);

      if (el.type === 'text' || el.type === 'badge') {
        const isBold = el.fontWeight === 'bold' || el.fontWeight === '800' || el.fontWeight === '700';
        const textColor = (el.color || '#1C1B1F').replace('#', '');
        const fillColor = el.fill ? el.fill.replace('#', '') : undefined;

        pptSlide.addText(el.text || '', {
          x,
          y,
          w,
          h,
          fontSize: Math.max(8, Math.round((el.fontSize || 20) * 0.75)),
          bold: isBold,
          italic: el.fontStyle === 'italic',
          underline: el.underline ? { style: 'sng' } : undefined,
          color: textColor,
          align: el.textAlign || 'left',
          valign: 'middle',
          rotate: el.rotation || 0,
          fill: fillColor ? { color: fillColor } : undefined,
        });
      } else if (el.type === 'shape') {
        let shapeType = pptx.ShapeType.rect;
        if (el.shapeType === 'circle') shapeType = pptx.ShapeType.ellipse;
        else if (el.shapeType === 'rounded') shapeType = pptx.ShapeType.roundRect;
        else if (el.shapeType === 'star') shapeType = pptx.ShapeType.star5;

        const fillColor = (el.fill || '#EA8600').replace('#', '');
        const strokeColor = el.stroke ? el.stroke.replace('#', '') : undefined;

        pptSlide.addShape(shapeType, {
          x,
          y,
          w,
          h,
          fill: { color: fillColor },
          line: strokeColor ? { color: strokeColor, width: el.strokeWidth || 1 } : undefined,
          rotate: el.rotation || 0,
        });

        if (el.text) {
          pptSlide.addText(el.text, {
            x,
            y,
            w,
            h,
            fontSize: Math.max(8, Math.round((el.fontSize || 16) * 0.75)),
            color: (el.color || '#FFFFFF').replace('#', ''),
            align: el.textAlign || 'center',
            valign: 'middle',
          });
        }
      } else if (el.type === 'image' && el.imageUrl) {
        pptSlide.addImage({
          data: el.imageUrl,
          x,
          y,
          w,
          h,
          rotate: el.rotation || 0,
        });
      } else if (el.type === 'table' && el.tableData) {
        const rows = el.tableData.map((row, rIdx) =>
          row.map((cell) => ({
            text: cell,
            options: {
              bold: rIdx === 0,
              fill: rIdx === 0 ? { color: 'F3EDF7' } : undefined,
              color: rIdx === 0 ? '6750A4' : '1C1B1F',
              fontSize: 10,
            },
          }))
        );
        pptSlide.addTable(rows, {
          x,
          y,
          w,
          h,
          border: { pt: 1, color: 'E6E0E9' },
        });
      }
    }
  }

  const cleanTitle = presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  await pptx.writeFile({ fileName: `${cleanTitle || 'presentation'}.pptx` });
}

/**
 * Export presentation to OpenDocument Presentation (.odp)
 */
export async function exportToODP(presentation: Presentation): Promise<void> {
  const zip = new JSZip();

  // 1. mimetype (must be uncompressed as first file in archive per ODF specification)
  zip.file('mimetype', 'application/vnd.oasis.opendocument.presentation', { compression: 'STORE' });

  // 2. META-INF/manifest.xml
  const manifestXML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;
  zip.file('META-INF/manifest.xml', manifestXML);

  // 3. meta.xml
  const metaXML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" office:version="1.2">
  <office:meta>
    <dc:title>${escapeXML(presentation.title)}</dc:title>
    <dc:creator>${escapeXML(presentation.author || 'Senturisk')}</dc:creator>
    <meta:creation-date>${new Date(presentation.createdAt || Date.now()).toISOString()}</meta:creation-date>
  </office:meta>
</office:document-meta>`;
  zip.file('meta.xml', metaXML);

  // 4. styles.xml
  const stylesXML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.2">
  <office:styles>
    <style:default-style style:family="graphic">
      <style:graphic-properties fo:stroke-color="#000000" fo:fill-color="#ffffff"/>
    </style:default-style>
  </office:styles>
</office:document-styles>`;
  zip.file('styles.xml', stylesXML);

  // 5. content.xml
  // Conversion: 1280x720 -> 28cm x 15.75cm (approx ratio)
  const CM_PER_PX = 28 / 1280;

  let pagesXML = '';
  presentation.slides.forEach((slide, sIdx) => {
    let framesXML = '';
    slide.elements.forEach((el, eIdx) => {
      const xCm = (el.x * CM_PER_PX).toFixed(2);
      const yCm = (el.y * CM_PER_PX).toFixed(2);
      const wCm = Math.max(0.5, el.width * CM_PER_PX).toFixed(2);
      const hCm = Math.max(0.5, el.height * CM_PER_PX).toFixed(2);
      const safeText = escapeXML(el.text || '');

      framesXML += `
      <draw:frame draw:name="Element_${eIdx}" svg:x="${xCm}cm" svg:y="${yCm}cm" svg:width="${wCm}cm" svg:height="${hCm}cm">
        <draw:text-box>
          <text:p>${safeText}</text:p>
        </draw:text-box>
      </draw:frame>`;
    });

    const notesXML = slide.notes
      ? `<presentation:notes><draw:page-thumbnail/><text:p>${escapeXML(slide.notes)}</text:p></presentation:notes>`
      : '';

    pagesXML += `
    <draw:page draw:name="Slide_${sIdx + 1}" draw:id="page_${sIdx + 1}">
      ${framesXML}
      ${notesXML}
    </draw:page>`;
  });

  const contentXML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:body>
    <office:presentation>
      ${pagesXML}
    </office:presentation>
  </office:body>
</office:document-content>`;
  zip.file('content.xml', contentXML);

  const blob = await zip.generateAsync({ type: 'blob' });
  const cleanTitle = presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadBlob(blob, `${cleanTitle || 'presentation'}.odp`);
}

/**
 * Universal Presentation Importer
 * Automatically handles .pptx, .odp, .ppt, .sen, and .json files
 */
export async function importPresentationFile(file: File): Promise<Presentation> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pptx')) {
    return importFromPPTX(file);
  } else if (fileName.endsWith('.odp')) {
    return importFromODP(file);
  } else if (fileName.endsWith('.ppt')) {
    return importFromPPT(file);
  } else {
    // Default to JSON / .sen
    return importFromSenFile(file);
  }
}

/**
 * Import presentation from JSON / .sen file
 */
export function importFromSenFile(file: File): Promise<Presentation> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.slides || !Array.isArray(parsed.slides)) {
          throw new Error('Invalid Sen Slides file format');
        }
        resolve(parsed as Presentation);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Import from PowerPoint (.pptx) file via JSZip and XML parsing
 */
async function importFromPPTX(file: File): Promise<Presentation> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const presentationTitle = file.name.replace(/\.[^/.]+$/, '') || 'Imported PowerPoint';
  const parser = new DOMParser();

  // Find all slide XML files
  const slideFileNames = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)![0], 10);
      const numB = parseInt(b.match(/\d+/)![0], 10);
      return numA - numB;
    });

  if (slideFileNames.length === 0) {
    throw new Error('No slides found in the PowerPoint presentation.');
  }

  // Get slide dimensions if available in presentation.xml
  let scaleX = 1280 / 9144000; // default 16:9 EMUs
  let scaleY = 720 / 5143500;
  const presFile = zip.file('ppt/presentation.xml');
  if (presFile) {
    const presText = await presFile.async('text');
    const presDoc = parser.parseFromString(presText, 'application/xml');
    const sldSz = presDoc.querySelector('sldSz');
    if (sldSz) {
      const cx = parseInt(sldSz.getAttribute('cx') || '9144000', 10);
      const cy = parseInt(sldSz.getAttribute('cy') || '5143500', 10);
      if (cx && cy) {
        scaleX = 1280 / cx;
        scaleY = 720 / cy;
      }
    }
  }

  const slides: Slide[] = [];

  for (let idx = 0; idx < slideFileNames.length; idx++) {
    const slideFileName = slideFileNames[idx];
    const xmlContent = await zip.file(slideFileName)!.async('text');
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    const slideId = 'slide-' + Math.random().toString(36).substring(2, 9);
    let slideTitle = `Slide ${idx + 1}`;
    let notes = '';

    // Check for matching notes slide
    const slideNum = slideFileName.match(/\d+/)![0];
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`);
    if (notesFile) {
      const notesText = await notesFile.async('text');
      const notesDoc = parser.parseFromString(notesText, 'application/xml');
      const noteParas = Array.from(notesDoc.querySelectorAll('p\\:sp, sp'))
        .map((sp) => sp.textContent?.trim())
        .filter((t) => t && !t.includes('Slide '));
      if (noteParas.length > 0) notes = noteParas.join('\n');
    }

    const elements: SlideElement[] = [];

    // Parse shapes and text frames
    const shapeNodes = Array.from(doc.querySelectorAll('p\\:sp, sp'));

    shapeNodes.forEach((sp, sIdx) => {
      // Coordinates
      const offNode = sp.querySelector('a\\:off, off');
      const extNode = sp.querySelector('a\\:ext, ext');

      let x = 100 + (sIdx % 3) * 40;
      let y = 100 + Math.floor(sIdx / 3) * 120;
      let width = 600;
      let height = 80;

      if (offNode && extNode) {
        const rawX = parseInt(offNode.getAttribute('x') || '0', 10);
        const rawY = parseInt(offNode.getAttribute('y') || '0', 10);
        const rawW = parseInt(extNode.getAttribute('cx') || '0', 10);
        const rawH = parseInt(extNode.getAttribute('cy') || '0', 10);

        x = Math.max(20, Math.min(1240, Math.round(rawX * scaleX)));
        y = Math.max(20, Math.min(680, Math.round(rawY * scaleY)));
        width = Math.max(40, Math.min(1240, Math.round(rawW * scaleX)));
        height = Math.max(20, Math.min(680, Math.round(rawH * scaleY)));
      }

      // Extract text
      const pNodes = Array.from(sp.querySelectorAll('a\\:p, p'));
      const textLines = pNodes
        .map((p) => {
          const tNodes = Array.from(p.querySelectorAll('a\\:t, t'));
          return tNodes.map((t) => t.textContent || '').join('');
        })
        .filter((line) => line.trim().length > 0);

      const text = textLines.join('\n');
      if (!text && !sp.querySelector('a\\:solidFill, solidFill')) return;

      // Detect font size and bold from first run
      const rPr = sp.querySelector('a\\:rPr, rPr');
      let fontSize = 22;
      let isBold = false;
      let color = '#1C1B1F';

      if (rPr) {
        const sz = rPr.getAttribute('sz');
        if (sz) fontSize = Math.max(12, Math.round(parseInt(sz, 10) / 100));
        isBold = rPr.getAttribute('b') === '1';

        const srgbClr = rPr.querySelector('a\\:srgbClr, srgbClr');
        if (srgbClr && srgbClr.getAttribute('val')) {
          color = '#' + srgbClr.getAttribute('val');
        }
      }

      // Detect fill color
      let fill: string | undefined;
      const solidFill = sp.querySelector('a\\:solidFill, solidFill');
      if (solidFill) {
        const fillClr = solidFill.querySelector('a\\:srgbClr, srgbClr');
        if (fillClr && fillClr.getAttribute('val')) {
          fill = '#' + fillClr.getAttribute('val');
        }
      }

      // Is this title placeholder?
      const ph = sp.querySelector('p\\:ph, ph');
      const phType = ph?.getAttribute('type');
      if (phType === 'title' || phType === 'ctrTitle') {
        slideTitle = text.split('\n')[0] || slideTitle;
        fontSize = Math.max(36, fontSize);
        isBold = true;
      }

      const el: SlideElement = {
        id: 'el-' + Math.random().toString(36).substring(2, 9),
        type: fill && !text ? 'shape' : 'text',
        shapeType: 'rounded',
        x,
        y,
        width,
        height,
        rotation: 0,
        zIndex: sIdx + 10,
        text,
        fontSize,
        fontWeight: isBold ? 'bold' : 'normal',
        color,
        fill,
        borderRadius: fill ? 12 : undefined,
      };

      elements.push(el);
    });

    slides.push({
      id: slideId,
      title: slideTitle,
      layout: idx === 0 ? 'title' : 'title-body',
      layoutType: idx === 0 ? 'title' : 'title-body',
      background: { type: 'color', value: '#FFFFFF' },
      notes,
      elements,
    });
  }

  return {
    id: 'pres-' + Math.random().toString(36).substring(2, 9),
    title: presentationTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    themeId: 'material-amber',
    aspectRatio: '16:9',
    author: 'Imported from PowerPoint',
    slides,
  };
}

/**
 * Import from OpenDocument Presentation (.odp)
 */
async function importFromODP(file: File): Promise<Presentation> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const contentFile = zip.file('content.xml');
  if (!contentFile) {
    throw new Error('Invalid ODP file: content.xml not found');
  }

  const contentXML = await contentFile.async('text');
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentXML, 'application/xml');

  const pageNodes = Array.from(doc.querySelectorAll('draw\\:page, page'));
  if (pageNodes.length === 0) {
    throw new Error('No slides found in the OpenDocument presentation.');
  }

  const slides: Slide[] = [];
  const CM_TO_PX = 1280 / 28;

  pageNodes.forEach((page, pIdx) => {
    const slideId = 'slide-' + Math.random().toString(36).substring(2, 9);
    let slideTitle = `Slide ${pIdx + 1}`;
    let notes = '';

    const notesNode = page.querySelector('presentation\\:notes, notes');
    if (notesNode) {
      notes = notesNode.textContent?.trim() || '';
    }

    const elements: SlideElement[] = [];
    const frameNodes = Array.from(page.querySelectorAll('draw\\:frame, frame'));

    frameNodes.forEach((frame, fIdx) => {
      const xStr = frame.getAttribute('svg:x') || '2cm';
      const yStr = frame.getAttribute('svg:y') || '2cm';
      const wStr = frame.getAttribute('svg:width') || '15cm';
      const hStr = frame.getAttribute('svg:height') || '3cm';

      const x = Math.round(parseFloat(xStr) * CM_TO_PX);
      const y = Math.round(parseFloat(yStr) * CM_TO_PX);
      const width = Math.round(parseFloat(wStr) * CM_TO_PX);
      const height = Math.round(parseFloat(hStr) * CM_TO_PX);

      const pNodes = Array.from(frame.querySelectorAll('text\\:p, p'));
      const text = pNodes.map((p) => p.textContent || '').join('\n').trim();

      if (!text) return;

      if (fIdx === 0 && !slideTitle.startsWith('Slide ')) {
        slideTitle = text.split('\n')[0];
      }

      elements.push({
        id: 'el-' + Math.random().toString(36).substring(2, 9),
        type: 'text',
        x: Math.max(20, Math.min(1200, x)),
        y: Math.max(20, Math.min(680, y)),
        width: Math.max(60, width),
        height: Math.max(30, height),
        rotation: 0,
        zIndex: fIdx + 10,
        text,
        fontSize: fIdx === 0 ? 36 : 20,
        fontWeight: fIdx === 0 ? 'bold' : 'normal',
        color: '#1C1B1F',
      });
    });

    slides.push({
      id: slideId,
      title: slideTitle,
      layout: pIdx === 0 ? 'title' : 'title-body',
      layoutType: pIdx === 0 ? 'title' : 'title-body',
      background: { type: 'color', value: '#FFFFFF' },
      notes,
      elements,
    });
  });

  return {
    id: 'pres-' + Math.random().toString(36).substring(2, 9),
    title: file.name.replace(/\.[^/.]+$/, '') || 'Imported OpenDocument Presentation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    themeId: 'material-amber',
    aspectRatio: '16:9',
    author: 'Imported from ODP',
    slides,
  };
}

/**
 * Import from legacy PowerPoint 97-2003 (.ppt) binary file
 * Recovers slide text atoms from binary stream
 */
async function importFromPPT(file: File): Promise<Presentation> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Extract ASCII and UTF-16 text chunks from PPT binary stream
  const extractedParagraphs: string[] = [];
  let currentString = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Printable ASCII
    if (byte >= 32 && byte <= 126) {
      currentString += String.fromCharCode(byte);
    } else if (byte === 10 || byte === 13) {
      if (currentString.trim().length > 3) {
        extractedParagraphs.push(currentString.trim());
      }
      currentString = '';
    } else {
      if (currentString.trim().length > 4) {
        // Filter out binary junk metadata
        if (!/^[a-zA-Z0-9_\-\s.,:;!?()"'%$/]+$/.test(currentString)) {
          currentString = '';
        } else {
          extractedParagraphs.push(currentString.trim());
          currentString = '';
        }
      } else {
        currentString = '';
      }
    }
  }

  // Deduplicate and filter noise
  const cleanTexts = Array.from(new Set(extractedParagraphs)).filter(
    (t) => t.length > 3 && !t.includes('Microsoft') && !t.includes('PowerPoint') && !t.includes('Font')
  );

  if (cleanTexts.length === 0) {
    throw new Error('Unable to extract slide content from binary PPT file. Please convert to .pptx or save as .odp.');
  }

  // Group texts into slides (4-6 items per slide)
  const slides: Slide[] = [];
  const chunkSize = 4;

  for (let i = 0; i < cleanTexts.length; i += chunkSize) {
    const chunk = cleanTexts.slice(i, i + chunkSize);
    const slideId = 'slide-' + Math.random().toString(36).substring(2, 9);
    const title = chunk[0];
    const elements: SlideElement[] = [
      {
        id: 'el-title-' + i,
        type: 'text',
        x: 100,
        y: 80,
        width: 1080,
        height: 70,
        rotation: 0,
        zIndex: 10,
        text: title,
        fontSize: 38,
        fontWeight: 'bold',
        color: '#1C1B1F',
      },
    ];

    if (chunk.length > 1) {
      elements.push({
        id: 'el-body-' + i,
        type: 'text',
        x: 100,
        y: 190,
        width: 1080,
        height: 440,
        rotation: 0,
        zIndex: 11,
        text: chunk.slice(1).join('\n\n'),
        fontSize: 22,
        fontWeight: 'normal',
        color: '#49454F',
      });
    }

    slides.push({
      id: slideId,
      title,
      layout: i === 0 ? 'title' : 'title-body',
      layoutType: i === 0 ? 'title' : 'title-body',
      background: { type: 'color', value: '#FFFFFF' },
      notes: 'Recovered from legacy PowerPoint 97-2003 binary file',
      elements,
    });
  }

  return {
    id: 'pres-' + Math.random().toString(36).substring(2, 9),
    title: file.name.replace(/\.[^/.]+$/, '') || 'Imported PowerPoint (.ppt)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    themeId: 'material-amber',
    aspectRatio: '16:9',
    author: 'Imported from .ppt',
    slides,
  };
}

/**
 * Export current slide as PNG image using Canvas rendering
 */
export function exportSlideAsPNG(slide: Slide, title: string = 'slide'): Promise<void> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = SLIDE_WIDTH;
    canvas.height = SLIDE_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve();
      return;
    }

    // 1. Draw Slide Background
    if (slide.background.type === 'color') {
      ctx.fillStyle = slide.background.value;
      ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    } else if (slide.background.type === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
      grad.addColorStop(0, '#FFE082');
      grad.addColorStop(1, '#FF8A65');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    }

    // 2. Draw elements sorted by zIndex
    const sorted = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);

    sorted.forEach((el) => {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      // Handle rotation
      if (el.rotation) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      // Render shapes
      if (el.type === 'shape' || el.type === 'badge') {
        renderShapeOnCanvas(ctx, el);
      } else if (el.type === 'text') {
        renderTextOnCanvas(ctx, el);
      } else if (el.type === 'table') {
        renderTableOnCanvas(ctx, el);
      }

      ctx.restore();
    });

    // Discreet brand watermark
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Created with Sen Slides by Senturisk', 20, SLIDE_HEIGHT - 16);
    ctx.restore();

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    resolve();
  });
}

function renderShapeOnCanvas(ctx: CanvasRenderingContext2D, el: SlideElement) {
  ctx.beginPath();
  const radius = el.borderRadius ?? (el.shapeType === 'rounded' ? 24 : el.shapeType === 'circle' ? el.width / 2 : 0);

  if (el.shapeType === 'circle') {
    ctx.arc(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, 0, Math.PI * 2);
  } else {
    ctx.roundRect(el.x, el.y, el.width, el.height, radius);
  }

  if (el.shadow) {
    ctx.shadowColor = el.shadowColor || 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = el.shadowBlur || 12;
  }

  if (el.fill) {
    ctx.fillStyle = el.fill;
    ctx.fill();
  }

  if (el.stroke && el.strokeWidth) {
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.strokeWidth;
    ctx.stroke();
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  if (el.text) {
    ctx.fillStyle = el.color || '#1C1B1F';
    ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize || 16}px ${el.fontFamily || 'sans-serif'}`;
    ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'center';
    ctx.textBaseline = 'middle';

    const textX = el.textAlign === 'left' ? el.x + 20 : el.textAlign === 'right' ? el.x + el.width - 20 : el.x + el.width / 2;
    ctx.fillText(el.text, textX, el.y + el.height / 2);
  }
}

function renderTextOnCanvas(ctx: CanvasRenderingContext2D, el: SlideElement) {
  ctx.fillStyle = el.color || '#1C1B1F';
  ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize || 24}px ${el.fontFamily || 'sans-serif'}`;
  ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left';
  ctx.textBaseline = 'top';

  const lines = (el.text || '').split('\n');
  const lineHeight = (el.fontSize || 24) * (el.lineHeight || 1.25);

  let posX = el.x;
  if (el.textAlign === 'center') posX = el.x + el.width / 2;
  else if (el.textAlign === 'right') posX = el.x + el.width;

  lines.forEach((line, idx) => {
    ctx.fillText(line, posX, el.y + idx * lineHeight);
  });
}

function renderTableOnCanvas(ctx: CanvasRenderingContext2D, el: SlideElement) {
  if (!el.tableData || el.tableData.length === 0) return;
  const rows = el.tableData.length;
  const cols = el.tableData[0].length;
  const cellW = el.width / cols;
  const cellH = el.height / rows;

  ctx.fillStyle = el.fill || '#FFFFFF';
  ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius || 16);
  ctx.fill();
  if (el.stroke) {
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.strokeWidth || 1;
    ctx.stroke();
  }

  el.tableData.forEach((row, r) => {
    row.forEach((cell, c) => {
      const cx = el.x + c * cellW;
      const cy = el.y + r * cellH;

      if (r === 0) {
        ctx.fillStyle = 'rgba(234,134,0,0.08)';
        ctx.fillRect(cx, cy, cellW, cellH);
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.strokeRect(cx, cy, cellW, cellH);

      ctx.fillStyle = r === 0 ? '#B06000' : '#1C1B1F';
      ctx.font = r === 0 ? 'bold 15px sans-serif' : '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell, cx + 12, cy + cellH / 2);
    });
  });
}

/**
 * Export presentation as standalone single-file interactive HTML presentation
 */
export function exportStandaloneHTML(presentation: Presentation) {
  const jsonString = JSON.stringify(presentation);
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(presentation.title)} - Sen Slides (by Senturisk)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #121212; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    #stage-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
    #slide-frame { width: 1280px; height: 720px; position: relative; background: #fff; transform-origin: center center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden; }
    .element { position: absolute; }
    #toolbar { position: fixed; bottom: 20px; background: rgba(30,30,30,0.85); backdrop-filter: blur(12px); border-radius: 9999px; padding: 8px 20px; display: flex; gap: 16px; align-items: center; font-size: 14px; border: 1px solid rgba(255,255,255,0.15); z-index: 1000; }
    .btn { background: #EA8600; color: #fff; border: none; padding: 6px 14px; border-radius: 9999px; cursor: pointer; font-weight: bold; }
    .btn:hover { background: #FFA000; }
    #brand { color: #aaa; font-size: 12px; margin-left: 12px; }
  </style>
</head>
<body>
  <div id="stage-container">
    <div id="slide-frame"></div>
  </div>
  <div id="toolbar">
    <button class="btn" onclick="prevSlide()">◀ Prev</button>
    <span id="counter">1 / 1</span>
    <button class="btn" onclick="nextSlide()">Next ▶</button>
    <button class="btn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
    <span id="brand">Sen Slides by Senturisk</span>
  </div>

  <script>
    const data = ${jsonString};
    let currentIndex = 0;
    const frame = document.getElementById('slide-frame');
    const counter = document.getElementById('counter');

    function renderSlide(idx) {
      if (idx < 0) idx = 0;
      if (idx >= data.slides.length) idx = data.slides.length - 1;
      currentIndex = idx;
      counter.innerText = (currentIndex + 1) + ' / ' + data.slides.length;

      const slide = data.slides[currentIndex];
      frame.style.background = slide.background?.value || '#FFFFFF';
      frame.innerHTML = '';

      slide.elements.forEach(el => {
        const div = document.createElement('div');
        div.className = 'element';
        div.style.left = el.x + 'px';
        div.style.top = el.y + 'px';
        div.style.width = el.width + 'px';
        div.style.height = el.height + 'px';
        div.style.zIndex = el.zIndex;
        if (el.opacity !== undefined) div.style.opacity = el.opacity;
        if (el.rotation) div.style.transform = 'rotate(' + el.rotation + 'deg)';
        if (el.fill) div.style.backgroundColor = el.fill;
        if (el.borderRadius) div.style.borderRadius = el.borderRadius + 'px';
        if (el.stroke) div.style.border = (el.strokeWidth || 1) + 'px solid ' + el.stroke;
        if (el.shadow) div.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        if (el.color) div.style.color = el.color;
        if (el.fontSize) div.style.fontSize = el.fontSize + 'px';
        if (el.fontFamily) div.style.fontFamily = el.fontFamily;
        if (el.fontWeight) div.style.fontWeight = el.fontWeight;
        if (el.textAlign) div.style.textAlign = el.textAlign;
        if (el.lineHeight) div.style.lineHeight = el.lineHeight;

        if (el.type === 'text' || el.type === 'shape' || el.type === 'badge') {
          div.style.display = 'flex';
          div.style.flexDirection = 'column';
          div.style.justifyContent = 'center';
          div.style.whiteSpace = 'pre-wrap';
          div.innerText = el.text || '';
        }

        frame.appendChild(div);
      });
    }

    function scaleFrame() {
      const availW = window.innerWidth;
      const availH = window.innerHeight;
      const scale = Math.min((availW - 40) / 1280, (availH - 90) / 720, 1.2);
      frame.style.transform = 'scale(' + scale + ')';
    }

    function prevSlide() { renderSlide(currentIndex - 1); }
    function nextSlide() { renderSlide(currentIndex + 1); }
    function toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }

    window.addEventListener('resize', scaleFrame);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    });

    renderSlide(0);
    scaleFrame();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${cleanTitle || 'presentation'}_standalone.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeXML(str: string) {
  return (str || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function escapeHTML(str: string) {
  return (str || '').replace(/[&<>'"]/g, (tag) => {
    return (
      {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      }[tag] || tag
    );
  });
}
