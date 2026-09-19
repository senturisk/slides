import { Presentation } from '../types';
import { createDefaultPresentation } from '../data/defaultPresentation';

const DB_NAME = 'SenSlidesDB';
const DB_VERSION = 1;
const STORE_PRESENTATIONS = 'presentations';
const KEY_ACTIVE_ID = 'sen_slides_active_id';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PRESENTATIONS)) {
        db.createObjectStore(STORE_PRESENTATIONS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPresentations(): Promise<Presentation[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PRESENTATIONS], 'readonly');
      const store = transaction.objectStore(STORE_PRESENTATIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as Presentation[];
        if (!results || results.length === 0) {
          // Initialize with default
          const defaultPres = createDefaultPresentation();
          savePresentation(defaultPres).then(() => resolve([defaultPres]));
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // LocalStorage fallback
    const raw = localStorage.getItem('sen_slides_presentations');
    if (raw) {
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {
        // ignore
      }
    }
    const defaultPres = createDefaultPresentation();
    localStorage.setItem('sen_slides_presentations', JSON.stringify([defaultPres]));
    return [defaultPres];
  }
}

export async function getPresentation(id: string): Promise<Presentation | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PRESENTATIONS], 'readonly');
      const store = transaction.objectStore(STORE_PRESENTATIONS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    const raw = localStorage.getItem('sen_slides_presentations');
    if (raw) {
      try {
        const list = JSON.parse(raw) as Presentation[];
        const found = list.find((p) => p.id === id);
        return found || null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function savePresentation(presentation: Presentation): Promise<void> {
  const updated = {
    ...presentation,
    updatedAt: Date.now(),
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_PRESENTATIONS], 'readwrite');
      const store = transaction.objectStore(STORE_PRESENTATIONS);
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // LocalStorage fallback
  }

  // Also sync to localStorage list for quick access & redundancy
  try {
    const raw = localStorage.getItem('sen_slides_presentations');
    let list: Presentation[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((p) => p.id === updated.id);
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    localStorage.setItem('sen_slides_presentations', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function deletePresentation(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_PRESENTATIONS], 'readwrite');
      const store = transaction.objectStore(STORE_PRESENTATIONS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem('sen_slides_presentations');
    if (raw) {
      const list = JSON.parse(raw) as Presentation[];
      const filtered = list.filter((p) => p.id !== id);
      localStorage.setItem('sen_slides_presentations', JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }
}

export function getActivePresentationId(): string | null {
  return localStorage.getItem(KEY_ACTIVE_ID);
}

export function setActivePresentationId(id: string): void {
  localStorage.setItem(KEY_ACTIVE_ID, id);
}

export async function loadPresentation(): Promise<Presentation> {
  const activeId = getActivePresentationId();
  if (activeId) {
    const found = await getPresentation(activeId);
    if (found) return found;
  }
  const all = await getAllPresentations();
  if (all.length > 0) return all[0];
  return createDefaultPresentation();
}

export function createBlankPresentation(title: string = 'Untitled Presentation'): Presentation {
  const id = 'pres-' + Math.random().toString(36).substring(2, 9);
  const slideId = 'slide-' + Math.random().toString(36).substring(2, 9);
  return {
    id,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    themeId: 'material-amber',
    aspectRatio: '16:9',
    author: 'by Senturisk',
    slides: [
      {
        id: slideId,
        title: 'Slide 1',
        layoutType: 'title',
        layout: 'title',
        background: { type: 'color', value: '#FFFFFF' },
        notes: '',
        elements: [
          {
            id: 'el-title',
            type: 'text',
            x: 240,
            y: 260,
            width: 800,
            height: 100,
            rotation: 0,
            opacity: 1,
            zIndex: 10,
            text: title,
            fontSize: 52,
            fontWeight: '800',
            textAlign: 'center',
            color: '#1C1B1F',
          },
        ],
      },
    ],
  };
}
