#!/usr/bin/env python3
"""We Are Energy: Single-Source-of-Truth Auto-Tagger & Fact Stamper.

Usage:
  python3 inject_facts.py --dry-run    Preview matches and changes (writes nothing)
  python3 inject_facts.py              Tag HTML files and update values in-place
"""
import json, re, sys, collections
from pathlib import Path

root = Path(next((a for a in sys.argv[1:] if not a.startswith('--')), '.'))
dry = '--dry-run' in sys.argv

json_path = root / 'data' / 'ofgem.json'
if not json_path.exists():
    sys.exit(f"Error: {json_path} not found.")

D = json.loads(json_path.read_text(encoding='utf-8'))

# Normalize section names (e.g., 'ofgem and gb_average' -> 'gb_average')
KEY_MAPS = {
    'ofgem and gb_average': 'gb_average',
    'wae model basis': 'model_basis'
}

def flatten_json(d, parent_key=''):
    items = []
    for k, v in d.items():
        if k.startswith('_') or k in ('meta', 'audit', 'notes'):
            continue
        clean_k = KEY_MAPS.get(k, k)
        new_key = f"{parent_key}.{clean_k}" if parent_key else clean_k
        if isinstance(v, dict):
            items.extend(flatten_json(v, new_key).items())
        elif isinstance(v, (int, float)) and v > 0:
            items.append((new_key, v))
    return dict(items)

FACTS = flatten_json(D)

def get_formatting(key, val):
    k = key.lower()
    if 'pct' in k or 'percent' in k:
        return 'pct', f"{val:g}%"
    if 'gbpbn' in k or k.endswith('_bn'):
        return 'gbpbn', f"£{val:g}bn"
    if 'gbpm' in k or k.endswith('_m'):
        return 'gbpm', f"£{val:g}m"
    if 'gbp' in k or 'cost' in k or 'saving' in k or 'barrier' in k:
        return 'gbp', f"£{int(val + 0.5):,}"
    if isinstance(val, float):
        return 'fix2', f"{val:.2f}"
    if isinstance(val, int) and val >= 1000:
        return 'comma', f"{val:,}"
    return None, f"{val:g}"

CHG = collections.Counter()

# Specific known counter data-to mappings for common stats
COUNTER_MAP = {
    '70': 'programme.solar_demand_pct',
    '94': 'programme.untapped_pct',
    '10000': 'programme.upfront_barrier_gbp',
    '570': 'value.bill_savings_bn',
    '2.7': 'value.co2e_mt',
    '18': 'value.network_savings_bn',
    '45': 'programme.apprenticeships_per_year',
    '91': 'programme.jobs_phase1',
    '3200': 'programme.jobs_2035',
    '40000': 'programme.jobs_2050',
    '40212': 'programme.jobs_2050',
    '120': 'programme.phase1_mw'
}

SPLIT = re.compile(r'(<script\b.*?</script>|<style\b.*?</style>|<title\b.*?</title>|<!--.*?-->|<[^>]+>)', re.S)

def process_html(html, page):
    # Phase A: Tag counters with data-fact-to attribute
    def tag_counter(m):
        full_tag = m.group(0)
        to_val = m.group(1)
        if 'data-fact-to' in full_tag:
            return full_tag
        if to_val in COUNTER_MAP:
            target_key = COUNTER_MAP[to_val]
            new_tag = full_tag.replace(f'data-to="{to_val}"', f'data-to="{to_val}" data-fact-to="{target_key}"')
            CHG[(page, f"COUNTER TAGGED: data-to={to_val}", f"data-fact-to={target_key}", target_key)] += 1
            return new_tag
        return full_tag

    html = re.sub(r'<span[^>]*\bclass="counter"[^>]*\bdata-to="([^"]+)"[^>]*>', tag_counter, html)

    # Phase B: Tag explicit prose text (e.g. "£570bn", "£18bn")
    parts = SPLIT.split(html)
    for i, p in enumerate(parts):
        if i % 2 or not p.strip() or 'data-fact' in p:
            continue
        
        # Tag £570bn
        if '£570bn' in p:
            p = p.replace('£570bn', '<span data-fact="value.bill_savings_bn" data-fmt="gbpbn">£570bn</span>')
            CHG[(page, "TEXT TAGGED: £570bn", "data-fact=value.bill_savings_bn", "value.bill_savings_bn")] += 1

        # Tag £18bn
        if '£18bn' in p:
            p = p.replace('£18bn', '<span data-fact="value.network_savings_bn" data-fmt="gbpbn">£18bn</span>')
            CHG[(page, "TEXT TAGGED: £18bn", "data-fact=value.network_savings_bn", "value.network_savings_bn")] += 1

        parts[i] = p

    return ''.join(parts)

# Process HTML files
for f in sorted(root.glob('*.html')):
    old = f.read_text(encoding='utf-8')
    page = f.stem
    new = process_html(old, page)
    
    n = len(re.findall(r'data-fact(?:-to)?=', new))
    print('%-28s %3d facts active/tagged %s' % (f.name, n, '(changed)' if new != old else '(no change)'))
    if new != old and not dry:
        f.write_text(new, encoding='utf-8')

print('\nChanges preview:')
for (pg, o, n, k), c in sorted(CHG.items()):
    print('  %-16s %-32s -> %-30s x%d  (%s)' % (pg, o, n, c, k))

print('\nDry run completed. Nothing written.' if dry else '\nDone! Review all changes with `git diff`.')