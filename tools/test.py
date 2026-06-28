#!/usr/bin/env python3
"""
tools/test.py --DnDAcademy data integrity tests.

Run manually:   python tools/test.py
Auto-runs from: start-map.bat (before the server starts)

Exit code 0 = all checks passed (warnings are OK).
Exit code 1 = one or more FAIL checks --fix when possible, server still starts.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent  # project root

REQUIRED_FIELDS = ['id', 'name', 'type', 'contentType', 'visibility']
CROSSLINK_RE    = re.compile(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]')


def main():
    passes   = []
    failures = []
    warnings = []

    # ── Registry ──────────────────────────────────────────────────────────────
    index_path = ROOT / 'campaigns' / 'index.json'
    try:
        registry = json.loads(index_path.read_text(encoding='utf-8'))
    except Exception as e:
        failures.append(f'campaigns/index.json: parse error --{e}')
        report(passes, failures, warnings)
        return

    passes.append('campaigns/index.json parsed OK')

    if any(c.get('id') == 'fail-academy' for c in registry):
        failures.append('campaigns/index.json: fail-academy must never appear in the registry')
    else:
        passes.append('campaigns/index.json: fail-academy not in registry ✓')

    # ── Per-campaign ──────────────────────────────────────────────────────────
    for entry in registry:
        check_campaign(ROOT, entry.get('id', '<unknown>'), passes, failures, warnings)

    report(passes, failures, warnings)


def check_campaign(root, cid, passes, failures, warnings):
    base = root / 'campaigns' / cid
    tag  = f'[{cid}]'

    # campaign.json --dmPassHash required
    cfg_path = base / 'campaign.json'
    if not cfg_path.exists():
        warnings.append(f'{tag} campaign.json not found --dmPassHash not verified')
    else:
        try:
            cfg = json.loads(cfg_path.read_text(encoding='utf-8'))
            if cfg.get('dmPassHash', ''):
                passes.append(f'{tag} campaign.json: dmPassHash set')
            else:
                failures.append(f'{tag} campaign.json: dmPassHash is empty --DM view unprotected')
        except Exception as e:
            failures.append(f'{tag} campaign.json: parse error --{e}')

    # data/index.json
    data_dir = base / 'data'
    idx_path = data_dir / 'index.json'
    if not idx_path.exists():
        failures.append(f'{tag} data/index.json: not found')
        return
    try:
        file_list = json.loads(idx_path.read_text(encoding='utf-8'))
    except Exception as e:
        failures.append(f'{tag} data/index.json: parse error --{e}')
        return
    if not isinstance(file_list, list):
        failures.append(f'{tag} data/index.json: expected a JSON array')
        return

    # Load all entity files
    all_entities = []   # list of (filename, entity_dict)
    id_count     = {}   # id ->occurrence count

    for fn in file_list:
        fpath = data_dir / fn
        if not fpath.exists():
            failures.append(f'{tag} data/{fn}: file not found')
            continue
        try:
            entities = json.loads(fpath.read_text(encoding='utf-8'))
        except Exception as e:
            failures.append(f'{tag} data/{fn}: parse error --{e}')
            continue
        if not isinstance(entities, list):
            failures.append(f'{tag} data/{fn}: not a JSON array')
            continue
        passes.append(f'{tag} data/{fn}: {len(entities)} entities loaded')
        for ent in entities:
            all_entities.append((fn, ent))
            eid = ent.get('id')
            if eid:
                id_count[eid] = id_count.get(eid, 0) + 1

    all_ids = set(id_count)

    # Duplicate IDs
    dupes = sorted(eid for eid, n in id_count.items() if n > 1)
    if dupes:
        for d in dupes:
            failures.append(f'{tag} duplicate id: "{d}"')
    else:
        passes.append(f'{tag} ids: {len(all_ids)} unique across all files')

    # Per-entity checks
    schema_errors  = 0
    missing_files  = 0
    broken_related = []
    broken_links   = []

    for fn, ent in all_entities:
        eid = ent.get('id', f'<no id in {fn}>')

        # Required fields
        missing = [f for f in REQUIRED_FIELDS if f not in ent]
        if missing:
            failures.append(f'{tag} {eid}: missing required fields --{", ".join(missing)}')
            schema_errors += 1

        # related[] references resolve within this campaign
        for ref in ent.get('related', []):
            if ref not in all_ids:
                broken_related.append(f'{eid} ->"{ref}"')

        # image contentType requires contentFile
        cf = ent.get('contentFile', '')
        ct = ent.get('contentType', '')
        if ct == 'image' and not cf:
            failures.append(f'{tag} {eid}: contentType "image" requires contentFile')
            schema_errors += 1

        # contentFile exists on disk (skip inline/generated entities)
        if cf and ct not in ('inline',):
            cf_path = base / cf
            if not cf_path.exists():
                failures.append(f'{tag} {eid}: contentFile missing --{cf}')
                missing_files += 1
            elif cf.endswith('.html'):
                # Check [[id]] and [[id|label]] cross-links inside HTML
                try:
                    html = cf_path.read_text(encoding='utf-8')
                    for m in CROSSLINK_RE.finditer(html):
                        ref_id = m.group(1).strip()
                        if ref_id not in all_ids:
                            broken_links.append(f'{eid} ->[[{ref_id}]]')
                except Exception:
                    pass

    if schema_errors == 0:
        passes.append(f'{tag} schema: all entities have required fields')
    if missing_files == 0:
        passes.append(f'{tag} contentFile: all content files exist on disk')

    # Broken related[] ->warning (shows as "no link" in UI, not a crash)
    if broken_related:
        for br in broken_related:
            warnings.append(f'{tag} related[]: unresolved --{br}')
    else:
        passes.append(f'{tag} related[]: all references resolve')

    # Broken [[links]] ->warning (UI shows them as broken, by design)
    if broken_links:
        for bl in broken_links:
            warnings.append(f'{tag} [[links]]: unresolved --{bl}')
    else:
        passes.append(f'{tag} [[links]]: all cross-links resolve')


def report(passes, failures, warnings):
    total = len(passes) + len(failures) + len(warnings)
    width = 59

    print()
    print('-- DnDAcademy Data Tests ' + '-' * (width - 25))

    if failures:
        print()
        for msg in failures:
            print(f'  FAIL  {msg}')
    if warnings:
        print()
        for msg in warnings:
            print(f'  WARN  {msg}')
    if not failures and not warnings:
        print(f'  All {total} checks passed.')
    else:
        print()

    summary = f'  {len(passes)}/{total} passed'
    if failures:
        summary += f'   {len(failures)} FAILED'
    if warnings:
        summary += f'   {len(warnings)} warnings'
    print(summary)
    print('-' * width)
    print()

    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
