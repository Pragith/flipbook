export type ReadingNote = { id: number; page: number; text: string };
export type StorageReader = Pick<Storage, "getItem">;
export type StorageWriter = Pick<Storage, "setItem">;
export const documentKey = (fingerprint: string) =>
  `flipbook:v1:${fingerprint}`;

function read(storage: StorageReader, key: string): unknown {
  try {
    return JSON.parse(storage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function readReadingData(
  storage: StorageReader,
  fingerprint: string,
  count: number,
) {
  const key = documentKey(fingerprint);
  const validPage = (n: unknown): n is number =>
    Number.isInteger(n) && Number(n) >= 0 && Number(n) < count;
  const rawBookmarks = read(storage, `${key}:bookmarks`);
  const rawNotes = read(storage, `${key}:notes`);
  const rawPosition = read(storage, `${key}:position`);
  return {
    bookmarks: Array.isArray(rawBookmarks)
      ? [...new Set(rawBookmarks.filter(validPage))]
      : [],
    notes: Array.isArray(rawNotes)
      ? rawNotes.filter(
          (n): n is ReadingNote =>
            n !== null &&
            typeof n === "object" &&
            Number.isSafeInteger(n.id) &&
            validPage(n.page) &&
            typeof n.text === "string" &&
            n.text.trim().length > 0,
        )
      : [],
    position: validPage(rawPosition) ? rawPosition : 0,
  };
}

export function writeStoredValue(
  storage: StorageWriter,
  key: string,
  value: unknown,
): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
