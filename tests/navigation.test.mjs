import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stackRange,
  stackTarget,
  thumbnailSpreads,
} from "../src/book-navigation.ts";
test("cover on the right, facing pairs, unmatched back cover on the left", () => {
  assert.deepEqual(thumbnailSpreads(6), [
    [null, 0],
    [1, 2],
    [3, 4],
    [5, null],
  ]);
  assert.deepEqual(thumbnailSpreads(5), [
    [null, 0],
    [1, 2],
    [3, 4],
  ]);
  assert.deepEqual(thumbnailSpreads(1), [[null, 0]]);
  assert.deepEqual(thumbnailSpreads(0), []);
});
test("every document sheet appears exactly once in the thumbnail pane", () => {
  for (const count of [1, 2, 3, 4, 5, 68, 125])
    assert.deepEqual(
      thumbnailSpreads(count)
        .flat()
        .filter((n) => n !== null),
      Array.from({ length: count }, (_, n) => n),
    );
});
test("stack navigation remains monotonic and excludes the visible spread", () => {
  for (const count of [1, 2, 3, 4, 5, 68, 125])
    for (let current = 0; current < count; current++)
      for (const side of ["left", "right"]) {
        let last = -1;
        for (let step = -1; step <= 101; step++) {
          const n = stackTarget(side, current, count, step / 100);
          if (n === null) continue;
          assert.ok(n >= 0 && n < count && n >= last);
          last = n;
          assert.ok(side === "left" ? n < current : n > current + 1);
        }
      }
});
test("stack endpoints reach the first/last hidden sheet", () => {
  assert.equal(stackTarget("left", 33, 68, 0), 0);
  assert.equal(stackTarget("left", 33, 68, 1), 32);
  assert.equal(stackTarget("right", 33, 68, 0), 35);
  assert.equal(stackTarget("right", 33, 68, 1), 67);
  assert.equal(stackTarget("right", 33, 68, NaN), 35);
  assert.equal(stackRange("right", 65, 67), null);
  assert.equal(stackRange("left", 0, 68), null);
});
