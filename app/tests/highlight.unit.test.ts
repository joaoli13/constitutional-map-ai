import assert from "node:assert/strict";
import test from "node:test";

import {getHighlightTerms} from "../lib/highlight-terms.ts";

test("plain highlight terms keep free-text words without structured parsing", () => {
  assert.deepEqual(
    getHighlightTerms("liberdade de expressão OR autonomia judicial", "plain"),
    ["liberdade", "expressão", "autonomia", "judicial"],
  );
});

test("structured highlight terms strip boolean syntax", () => {
  assert.deepEqual(
    getHighlightTerms('("supreme court" OR tribunal) AND rights', "structured"),
    ["supreme", "court", "tribunal", "rights"],
  );
});

test("highlight terms remove common Portuguese and Spanish connectors", () => {
  assert.deepEqual(
    getHighlightTerms("autonomia entre poderes pero libertad y justicia", "plain"),
    ["autonomia", "poderes", "libertad", "justicia"],
  );
});

test("highlight terms ignore words with three letters or fewer", () => {
  assert.deepEqual(
    getHighlightTerms("lei paz rio ato direitos", "plain"),
    ["direitos"],
  );
});
