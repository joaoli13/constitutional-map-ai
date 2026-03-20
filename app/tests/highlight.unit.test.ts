import assert from "node:assert/strict";
import test from "node:test";

import {getHighlightTerms} from "../lib/highlight-terms.ts";

test("plain highlight terms keep free-text words without structured parsing", () => {
  assert.deepEqual(
    getHighlightTerms("liberdade de expressão OR autonomia judicial", "plain"),
    ["liberdade", "de", "expressão", "autonomia", "judicial"],
  );
});

test("structured highlight terms strip boolean syntax", () => {
  assert.deepEqual(
    getHighlightTerms('("supreme court" OR tribunal) AND rights', "structured"),
    ["supreme", "court", "tribunal", "rights"],
  );
});
