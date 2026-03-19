"""Country-specific overrides and general pre-processing for the segmenter."""

from __future__ import annotations

import re
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# General: Schedule / Annex boundary
# ---------------------------------------------------------------------------

# Matches lines that open a numbered schedule at the end of a constitution,
# e.g. "FIRST SCHEDULE.", "THE SECOND SCHEDULE", "TWELFTH SCHEDULE".
# Uses ^ (MULTILINE) so mid-sentence references like "the First Schedule" that
# begin mid-line are never matched.
_SCHEDULE_BOUNDARY_RE = re.compile(
    r"""(?m)^
    (?:THE\s+)?
    (?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|
       ELEVENTH|TWELFTH|THIRTEENTH|FOURTEENTH|FIFTEENTH)
    \s+SCHEDULE\b
    """,
    re.VERBOSE | re.IGNORECASE,
)


def strip_schedules(text: str) -> tuple[str, bool]:
    """Truncate *text* at the first schedule boundary.

    Returns:
        (stripped_text, was_truncated)
    """
    m = _SCHEDULE_BOUNDARY_RE.search(text)
    if m:
        return text[: m.start()].rstrip(), True
    return text, False


# ---------------------------------------------------------------------------
# India-specific: article header detection
# ---------------------------------------------------------------------------

# Article headers in the Indian constitution are preceded by a blank line and
# have the form:
#
#   N[LETTERS]. Title starting with uppercase
#
# where N is the base article number, LETTERS is an optional uppercase suffix
# (e.g. "A", "ZT") that marks articles inserted by constitutional amendments.
# Genuine article titles are short phrases; numbered clauses within an article
# body look similar but the overall sequence is shorter.
#
# The pattern anchors on the blank-line separator (\n\n) to reduce false
# positives from numbered clauses that also start with digits.

_IND_ARTICLE_RE = re.compile(
    r"\n\n"                    # blank line before header
    r"(\d+)([A-Z]*)"           # base number + optional uppercase suffix
    r"\.[ \t]+"                # period + whitespace separator
    r"([A-Z][^\n]{2,200})"     # title: starts uppercase, up to 200 chars
    r"\n",                     # end of header line
)


@dataclass(frozen=True)
class _IndiaCandidate:
    base: int        # numeric part of the article number
    suffix: str      # letter suffix, e.g. '' | 'A' | 'ZT'
    match_start: int # position of the leading '\n\n' in the *padded* text
    body_start: int  # position right after the trailing '\n' of the header
    identifier: str  # full identifier string, e.g. '226A'


def split_india_articles(text: str) -> list[tuple[str, str]]:
    """Split an Indian constitutional text into article-level segments.

    Strategy
    --------
    1. Prepend a newline so the first article can match the ``\\n\\n`` anchor.
    2. Collect all candidate matches of the India article-header pattern.
    3. Run a longest-increasing-subsequence (LIS) pass on the compound key
       ``(base, suffix)`` — this distinguishes the genuine article sequence
       (1 → 2 → 2A → 3 → … → 395) from shorter runs of numbered sub-clauses
       inside article bodies.
    4. Build and return ``(identifier, body)`` pairs from the winning chain.
    """
    padded = "\n" + text  # prepend so first article triggers \n\n

    candidates: list[_IndiaCandidate] = []
    for m in _IND_ARTICLE_RE.finditer(padded):
        base_str, suffix = m.group(1), m.group(2)
        candidates.append(
            _IndiaCandidate(
                base=int(base_str),
                suffix=suffix,
                match_start=m.start(),
                body_start=m.end(),
                identifier=f"{base_str}{suffix}",
            )
        )

    if not candidates:
        return []

    chain = _lis_india(candidates)
    if not chain:
        return []

    segments: list[tuple[str, str]] = []

    # Preamble: text before the first article's \n\n (undo the prepended \n)
    first_pos_in_text = chain[0].match_start + 1  # +1 accounts for prepended \n
    preamble = text[:first_pos_in_text].strip()
    if preamble:
        segments.append(("Preamble", preamble))

    for idx, cand in enumerate(chain):
        body_start = cand.body_start - 1  # -1 for prepended \n
        if idx + 1 < len(chain):
            # body ends where the next article's \n\n begins in original text
            next_pos = chain[idx + 1].match_start + 1
            body = text[body_start:next_pos].strip()
        else:
            body = text[body_start:].strip()
        if body:
            segments.append((cand.identifier, body))

    return segments


def _lis_india(candidates: list[_IndiaCandidate]) -> list[_IndiaCandidate]:
    """Longest strictly increasing subsequence on the ``(base, suffix)`` key.

    Suffix comparison is lexicographic on the uppercase letter string, which
    correctly orders e.g. '' < 'A' < 'B' < 'Z' < 'ZA' < 'ZT'.

    Among chains of equal length, prefer the one that starts at article 1.
    """
    n = len(candidates)
    best_lengths = [1] * n
    next_indexes = [-1] * n

    # Backward DP pass.
    # Tie-breaking rule: when two successor candidates j produce the same chain
    # length, prefer the one appearing LATER in the text (larger match_start).
    # Rationale: genuine article headers always appear after any sub-clauses of
    # the preceding article that share the same base number, so preferring the
    # later match selects the true article boundary over an internal sub-clause.
    for i in range(n - 1, -1, -1):
        key_i = (candidates[i].base, candidates[i].suffix)
        for j in range(i + 1, n):
            key_j = (candidates[j].base, candidates[j].suffix)
            if key_j <= key_i:
                continue
            proposed = best_lengths[j] + 1
            is_longer = proposed > best_lengths[i]
            is_tie_later = (
                proposed == best_lengths[i]
                and next_indexes[i] != -1
                and candidates[j].match_start > candidates[next_indexes[i]].match_start
            )
            if is_longer or is_tie_later:
                best_lengths[i] = proposed
                next_indexes[i] = j

    # Choose best starting index
    best_start = max(
        range(n),
        key=lambda i: (
            best_lengths[i],
            candidates[i].base == 1 and candidates[i].suffix == "",
            -candidates[i].match_start,
        ),
    )

    # Reconstruct chain
    chain: list[_IndiaCandidate] = []
    cur = best_start
    while cur != -1:
        chain.append(candidates[cur])
        cur = next_indexes[cur]
    return chain
