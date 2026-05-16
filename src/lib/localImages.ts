export type LocalImageType = "category" | "inventory";

export const LOCAL_IMAGE_UPDATED = "dukan-local-image-updated";

const DB_NAME = "dukan-manager-images";
const DB_VERSION = 1;
const STORE = "images";

function storageKey(userId: string, type: LocalImageType, entityId: string) {
  return `${userId}:${type}:${entityId}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

/** Resize & compress so images stay small in browser storage */
export async function compressImageFile(file: File, maxWidth = 800): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function saveLocalImage(
  userId: string,
  type: LocalImageType,
  entityId: string,
  file: File
): Promise<void> {
  const dataUrl = await compressImageFile(file);
  const db = await openDb();
  const key = storageKey(userId, type, entityId);

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  notifyLocalImageUpdated();
}

export async function getLocalImage(
  userId: string,
  type: LocalImageType,
  entityId: string
): Promise<string | null> {
  const db = await openDb();
  const key = storageKey(userId, type, entityId);

  const result = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error);
  });

  db.close();
  return result;
}

export async function removeLocalImage(
  userId: string,
  type: LocalImageType,
  entityId: string
): Promise<void> {
  const db = await openDb();
  const key = storageKey(userId, type, entityId);

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  notifyLocalImageUpdated();
}

export function notifyLocalImageUpdated() {
  window.dispatchEvent(new CustomEvent(LOCAL_IMAGE_UPDATED));
}
