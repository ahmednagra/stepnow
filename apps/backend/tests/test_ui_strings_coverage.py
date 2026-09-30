# apps/backend/tests/test_ui_strings_coverage.py
# Dictionary integrity: every UI-string key the frontend resolves must be seeded (DE + EN), every
# seeded key must be used somewhere, and the frontend's last-resort CRITICAL_FALLBACKS must match
# the seed word for word. Pure static analysis of apps/frontend/src — no database.
#
# Only modules reachable from the Next entry points are scanned (dead modules don't keep keys alive).
# A key counts as "used" when it appears as a string literal whose first segment is an i18n
# namespace (so t("…"), pickT(t, "…"), resolve(t, "…"), titleKey: "…", arrays of keys and zod
# messages are all caught), or in any t(/pickT( call / *Key: property regardless of namespace.
# Template-literal keys (`pricing.unit.${item.price_unit}`) must be registered in
# TEMPLATE_EXPANSIONS with the values they can take; an unregistered template fails the suite.
#
# Run directly for a report: python -m tests.test_ui_strings_coverage

import re
from functools import lru_cache
from pathlib import Path

import pytest

from scripts.seeders.seed_pricing import PRICING_DATA
from scripts.seeders.seed_services import SERVICES
from scripts.seeders.seed_ui_strings import UI_STRINGS

FRONTEND_SRC = Path(__file__).resolve().parents[2] / "frontend" / "src"
CRITICAL_FILE = FRONTEND_SRC / "constants" / "critical-ui-strings.ts"
PRICING_SECTIONS = "components/features/pricing/PricingSections.tsx"

KEY = r"[a-z0-9_]+(?:\.[A-Za-z0-9_-]+)+"
LITERAL = re.compile(r"""(["'])(""" + KEY + r""")\1""")
IN_CALL = re.compile(r"""(?:\bt\(\s*|\bpickT\(\s*\w+\s*,\s*|\b\w*Key\s*:\s*)(["'])(""" + KEY + r""")\1""")
TEMPLATE = re.compile(r"`([a-z0-9_]+\.(?:[A-Za-z0-9_.-]|\$\{[^}`]+\})*\$\{[^}`]+\}(?:[A-Za-z0-9_.-]|\$\{[^}`]+\})*)`")
CRITICAL_ENTRY = re.compile(
    r'^\s*"(' + KEY + r')":\s*\{\s*de:\s*"((?:[^"\\]|\\.)*)",\s*en:\s*"((?:[^"\\]|\\.)*)",?\s*\},?\s*$', re.M
)


def _ts_const_values(rel_path: str, name: str) -> list[str]:
    # The `key:` values (or bare strings) of a `const NAME … = [ … ];` array in a frontend file.
    body = re.search(rf"const {name}\b[^=]*=\s*\[(.*?)\](?:\s*as const)?;", (FRONTEND_SRC / rel_path).read_text(encoding="utf-8"), re.S)
    assert body, f"{name} not found in {rel_path} — update TEMPLATE_EXPANSIONS"
    keyed = re.findall(r'\bkey:\s*"([^"]+)"', body.group(1))
    return keyed or re.findall(r'"([^"]+)"', body.group(1))


def _service_slugs() -> list[str]:
    return [s[f"slug_{lang}"] for s in SERVICES for lang in ("de", "en")]


def _price_units() -> list[str]:
    return sorted({i["price_unit"] for cats in PRICING_DATA.values() for c in cats for i in c["items"] if i.get("price_unit")})


# Template literal (exactly as written in the source) → the values its single placeholder takes.
TEMPLATE_EXPANSIONS = {
    "pricing.tab.${service.slug}.tagline": _service_slugs,
    "pricing.unit.${item.price_unit}": _price_units,
    "pricing.included.${row.key}.label": lambda: _ts_const_values(PRICING_SECTIONS, "INCLUDED_ROWS"),
    "pricing.included.${row.key}.desc": lambda: _ts_const_values(PRICING_SECTIONS, "INCLUDED_ROWS"),
    "pricing.excluded.${item.key}": lambda: _ts_const_values(PRICING_SECTIONS, "EXCLUDED_ITEMS"),
    "pricing.discounts.${key}.label": lambda: _ts_const_values(PRICING_SECTIONS, "DISCOUNT_ROWS"),
    "pricing.discounts.${key}.desc": lambda: _ts_const_values(PRICING_SECTIONS, "DISCOUNT_ROWS"),
    "pricing.comparison.${key}.label": lambda: _ts_const_values(PRICING_SECTIONS, "COMPARISON_ROW_KEYS"),
    "pricing.comparison.${key}.stepnow": lambda: _ts_const_values(PRICING_SECTIONS, "COMPARISON_ROW_KEYS"),
    "pricing.comparison.${key}.taxi": lambda: _ts_const_values(PRICING_SECTIONS, "COMPARISON_ROW_KEYS"),
    "pricing.payment.${key}": lambda: _ts_const_values(PRICING_SECTIONS, "PAYMENT_METHODS"),
}

# Seeded keys no source literal names, each with the reason it must stay. Keep this empty unless a
# key is genuinely resolved at runtime from data the static scan cannot see.
DYNAMIC_ALLOWLIST: dict[str, str] = {}

# Modules scanned although no layout imports them yet, each with the reason.
EXTRA_ENTRY_POINTS: dict[str, str] = {}

SEEDED = {row[0]: row for row in UI_STRINGS}
NAMESPACES = {key.split(".")[0] for key in SEEDED}


COMMENT_LINE = re.compile(r"^\s*(?://|/?\*).*$", re.M)
IMPORT_FROM = re.compile(r"""(?:\bfrom\s*|\bimport\s*\(?\s*)["']((?:@/|\.)[^"']+)["']""")


def _resolve(importer: Path, spec: str) -> Path | None:
    base = FRONTEND_SRC / spec[2:] if spec.startswith("@/") else (importer.parent / spec).resolve()
    for candidate in (base, *(base.with_name(base.name + ext) for ext in (".ts", ".tsx")), base / "index.ts", base / "index.tsx"):
        if candidate.is_file() and candidate.suffix in (".ts", ".tsx"):
            return candidate
    return None


@lru_cache(maxsize=1)
def _sources() -> dict[str, str]:
    # Modules reachable from the Next entry points (everything under app/ + middleware.ts) via
    # static/dynamic imports and barrel re-exports. A key only in an unreachable (dead) module is
    # not "used". Whole-line comments are blanked so a key quoted in a doc comment does not count.
    raw = {p.resolve(): p.read_text(encoding="utf-8") for p in FRONTEND_SRC.rglob("*") if p.suffix in (".ts", ".tsx")}
    app_dir = (FRONTEND_SRC / "app").resolve()
    pending = [p for p in raw if app_dir in p.parents or p.name == "middleware.ts"]
    pending += [(FRONTEND_SRC / rel).resolve() for rel in EXTRA_ENTRY_POINTS]
    reachable: set[Path] = set()
    while pending:
        path = pending.pop()
        if path in reachable:
            continue
        reachable.add(path)
        pending.extend(t for spec in IMPORT_FROM.findall(raw[path]) if (t := _resolve(path, spec)) and t in raw)
    return {
        p.relative_to(FRONTEND_SRC.resolve()).as_posix(): COMMENT_LINE.sub("", raw[p])
        for p in sorted(reachable)
        if p != CRITICAL_FILE.resolve()
    }


@lru_cache(maxsize=1)
def used_keys() -> dict[str, str]:
    # key → first file that references it.
    used: dict[str, str] = {}
    for path, text in _sources().items():
        for m in LITERAL.finditer(text):
            if m.group(2).split(".")[0] in NAMESPACES:
                used.setdefault(m.group(2), path)
        for m in IN_CALL.finditer(text):
            used.setdefault(m.group(2), path)
        for m in TEMPLATE.finditer(text):
            template = m.group(1)
            if template.split(".")[0] not in NAMESPACES:
                continue
            expand = TEMPLATE_EXPANSIONS.get(template)
            if expand is None:
                used.setdefault(f"<unregistered template> {template}", path)
                continue
            placeholder = re.search(r"\$\{[^}]+\}", template).group(0)
            for value in expand():
                used.setdefault(template.replace(placeholder, value), path)
    return used


def critical_fallbacks() -> dict[str, tuple[str, str]]:
    text = CRITICAL_FILE.read_text(encoding="utf-8")
    return {m.group(1): (m.group(2).replace('\\"', '"'), m.group(3).replace('\\"', '"')) for m in CRITICAL_ENTRY.finditer(text)}


pytestmark = pytest.mark.skipif(not FRONTEND_SRC.is_dir(), reason="frontend sources not checked out")


def test_every_template_key_is_registered():
    unregistered = sorted(k for k in used_keys() if k.startswith("<unregistered template>"))
    assert not unregistered, f"register these in TEMPLATE_EXPANSIONS: {unregistered}"


def test_every_used_key_is_seeded():
    missing = sorted(f"{k} ({f})" for k, f in used_keys().items() if k not in SEEDED and not k.startswith("<"))
    assert not missing, f"{len(missing)} UI-string keys used by the frontend are not seeded: {missing}"


def test_every_seeded_key_is_used():
    unused = sorted(set(SEEDED) - set(used_keys()) - set(DYNAMIC_ALLOWLIST))
    assert not unused, f"{len(unused)} seeded UI-string keys are never used (dead dictionary entries): {unused}"


def test_seeded_values_are_complete():
    blank = sorted(k for k, (_, _, de, en, *_rest) in SEEDED.items() if not de.strip() or not en.strip())
    assert not blank, f"seeded keys without a DE or EN value: {blank}"


def test_critical_fallbacks_parse_completely():
    declared = set(re.findall(r'^\s*"(' + KEY + r')":', CRITICAL_FILE.read_text(encoding="utf-8"), re.M))
    assert declared == set(critical_fallbacks()), f"entries the parity check cannot read: {sorted(declared - set(critical_fallbacks()))}"


def test_critical_fallbacks_match_the_seed():
    drift = {
        key: {"fallback": (de, en), "seed": SEEDED[key][2:4] if key in SEEDED else None}
        for key, (de, en) in critical_fallbacks().items()
        if key not in SEEDED or SEEDED[key][2:4] != (de, en)
    }
    assert not drift, f"CRITICAL_FALLBACKS differ from seed_ui_strings: {drift}"


def test_critical_fallbacks_are_used():
    unused = sorted(set(critical_fallbacks()) - set(used_keys()))
    assert not unused, f"critical fallbacks for keys no component uses: {unused}"


if __name__ == "__main__":
    used = used_keys()
    missing = sorted(k for k in used if k not in SEEDED)
    unused = sorted(set(SEEDED) - set(used) - set(DYNAMIC_ALLOWLIST))
    print(f"used={len(used)} seeded={len(SEEDED)} missing={len(missing)} unused={len(unused)} critical={len(critical_fallbacks())}")
    print("MISSING:", *missing, sep="\n  ")
    print("UNUSED:", *unused, sep="\n  ")
