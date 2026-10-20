import { test } from "node:test";
import assert from "node:assert/strict";
import {
  documentKey,
  readReadingData,
  writeStoredValue,
} from "../src/reading-storage.ts";
const memory = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};
test("reopening a fingerprint restores notes, bookmarks and progress independently of URL or file name", () => {
  const storage = memory();
  const key = documentKey("original-pdf");
  const note = { id: 123, page: 4, text: "Remember this passage" };
  assert.equal(writeStoredValue(storage, `${key}:notes`, [note]), true);
  writeStoredValue(storage, `${key}:bookmarks`, [2, 8]);
  writeStoredValue(storage, `${key}:position`, 8);
  assert.deepEqual(readReadingData(storage, "original-pdf", 24), {
    notes: [note],
    bookmarks: [2, 8],
    position: 8,
  });
  assert.deepEqual(readReadingData(storage, "different-pdf", 124), {
    notes: [],
    bookmarks: [],
    position: 0,
  });
  assert.equal(readReadingData(storage, "original-pdf", 24).position, 8);
});
test("corrupt JSON and valid JSON of the wrong shape cannot break the reader", () => {
  const storage = memory();
  const key = documentKey("pdf");
  storage.setItem(`${key}:notes`, "{broken");
  storage.setItem(`${key}:bookmarks`, '{"unexpected":true}');
  storage.setItem(`${key}:position`, '"ten"');
  assert.deepEqual(readReadingData(storage, "pdf", 10), {
    notes: [],
    bookmarks: [],
    position: 0,
  });
});
test("invalid pages and malformed notes are filtered; bookmarks are deduplicated", () => {
  const storage = memory();
  const key = documentKey("pdf");
  writeStoredValue(storage, `${key}:bookmarks`, [0, 0, -1, 3.5, "2", 99, 9]);
  const good = { id: 1, page: 9, text: "Keep me" };
  writeStoredValue(storage, `${key}:notes`, [
    null,
    {},
    good,
    { id: 2, page: 10, text: "Invalid" },
    { id: 3, page: 1, text: " " },
  ]);
  writeStoredValue(storage, `${key}:position`, -5);
  assert.deepEqual(readReadingData(storage, "pdf", 10), {
    bookmarks: [0, 9],
    notes: [good],
    position: 0,
  });
});
test("quota and blocked storage failures are reported to the caller", () => {
  const blocked = {
    setItem() {
      throw new Error("QuotaExceededError");
    },
    getItem() {
      throw new Error("SecurityError");
    },
  };
  assert.equal(writeStoredValue(blocked, "notes", []), false);
  assert.deepEqual(readReadingData(blocked, "pdf", 10), {
    bookmarks: [],
    notes: [],
    position: 0,
  });
});
