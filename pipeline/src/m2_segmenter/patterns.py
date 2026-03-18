"""Regex patterns for constitutional segment detection."""

from __future__ import annotations

import re
from dataclasses import dataclass
from re import Pattern

_ARTICLE_NUMBER = r"\d+[A-Za-z]?(?:[.\-]\d+[A-Za-z]?)?"
_NUMERIC_NUMBER = r"\d+(?:\.\d+)*\."
_ROMAN_OR_NUMBER = r"(?:[IVXLCDM]+|\d+)"


@dataclass(frozen=True)
class SegmentPattern:
    name: str
    regex: Pattern[str]
    fallback: bool = False


PATTERNS: list[SegmentPattern] = [
    SegmentPattern(
        name="article",
        regex=re.compile(
            rf"^(?P<identifier>Article\b\.?\s*{_ARTICLE_NUMBER})(?:[ \t]*[.:-][ \t]*.*)?$",
            re.IGNORECASE | re.MULTILINE,
        ),
    ),
    SegmentPattern(
        name="art",
        regex=re.compile(
            rf"^(?P<identifier>Art\b\.?\s*{_ARTICLE_NUMBER})(?:[ \t]*[.:-][ \t]*.*)?$",
            re.IGNORECASE | re.MULTILINE,
        ),
    ),
    SegmentPattern(
        name="section",
        regex=re.compile(
            rf"^(?P<identifier>Section\b\s+{_ARTICLE_NUMBER})(?:[.:][ \t]*.*)?$",
            re.IGNORECASE | re.MULTILINE,
        ),
    ),
    SegmentPattern(
        name="symbol",
        regex=re.compile(
            rf"^(?P<identifier>§\s*{_ARTICLE_NUMBER})(?:[ \t]+.*)?$",
            re.IGNORECASE | re.MULTILINE,
        ),
    ),
    SegmentPattern(
        name="numeric",
        regex=re.compile(
            rf"^(?P<identifier>{_NUMERIC_NUMBER}(?:\s+[A-Z][^\n]{{0,80}})?)$",
            re.MULTILINE,
        ),
    ),
    SegmentPattern(
        name="chapter",
        regex=re.compile(
            rf"^(?P<identifier>Chapter\b\s+{_ROMAN_OR_NUMBER}(?:[.:][ \t]*.*)?)$",
            re.IGNORECASE | re.MULTILINE,
        ),
        fallback=True,
    ),
    SegmentPattern(
        name="part",
        regex=re.compile(
            rf"^(?P<identifier>Part\b\s+{_ROMAN_OR_NUMBER}(?:[.:][ \t]*.*)?)$",
            re.IGNORECASE | re.MULTILINE,
        ),
        fallback=True,
    ),
]

PRIMARY_PATTERNS = [pattern for pattern in PATTERNS if not pattern.fallback]
FALLBACK_PATTERNS = [pattern for pattern in PATTERNS if pattern.fallback]
