#!/usr/bin/env python3
"""We Are Energy: Safe HTML Parser-Based Auto-Tagger & Fact Stamper.

Usage:
  python3 inject_facts.py --dry-run    Preview changes without modifying files
  python3 inject_facts.py              Tag HTML files and update values in-place
"""
import json, re, sys, collections
from pathlib import Path

try:
    from bs4 import BeautifulSoup, NavigableString, Comment
except ImportError:
    sys.exit("Error: 'bs4' library is required. Install with: python3 -m pip install beautifulsoup4 lxml")

root = Path(next((a for a in sys.argv[1:] if not a.startswith('--')), '.'))
dry = '--dry-run' in sys.argv

json_path = root / 'data' / 'ofgem.json'
if not json_path.exists():
    sys.exit(f"Error: {json_path} not found.")

D = json.loads(json_path.read_text(encoding='utf-8'))

KEY_MAPS = {
    'ofgem and gb_average': 'gb_average',
    'wae model basis': 'model_basis'
}

def get_val(path):
    o = D
    for part in path.split('.'):
        if isinstance(o, dict) and part in o:
            o = o[part]
        else:
            return None
    return o

def fmt(v, f=None):
    if v is None: return ''
    if f == 'gbp': return f"£{int(v + 0.5):,}"
    if f == 'pct': return f"{v:g}%"
    if f == 'comma': return f"{int(v + 0.5):,}"
    if f == 'comma_plus': return f"{int(v + 0.5):,}+"
    if f == 'dec1': return f"{v:.1f}"
    if f == 'fix2': return f"{v:.2f}"
    if f == 'gbpm': return f"£{v:g}m"
    if f == 'gbpbn': return f"£{v:g}bn"
    if f == 'mw': return f"{v:g}MW"
    if f == 'gw': return f"{v:g}GW"
    if f == 'gw_plus': return f"{v:g}GW+"
    if f == 'm_plus': return f"{v:g} million"
    if f == 'mtco2': return f"{v:g} MtCO₂e"
    return v if isinstance(v, str) else f"{v:g}"

CHG = collections.Counter()

COUNTER_MAP = {
    '70': 'programme.solar_demand_pct',
    '94': 'programme.untapped_pct',
    '10000': 'programme.upfront_barrier_gbp',
    '570': 'value.bill_savings_bn',
    '2.7': 'value.co2e_mt',
    '18': 'value.network_savings_bn',
    '45': 'programme.apprenticeships_per_year',
    '91': 'programme.jobs_2028',
    '3200': 'programme.jobs_2035',
    '40000': 'programme.jobs_2050',
    '40212': 'programme.jobs_2050',
    '120': 'programme.phase1_mw'
}

PROSE_RULES = [
    (r'\b12\.5\s*million\b', 'programme.total_2051_m', 'dec1'),
    (r'(?<=Over )7\s*million\b|(?<=Over )7\.1\s*million\b', 'programme.members_2051_m', None),
    (r'(?<=over )5\s*million\b|(?<=over )5\.4\s*million\b', 'programme.wholesale_2051_m', None),
    (r'(?:£|&pound;)265m\b', 'programme.dividend_pot_2038_m', 'gbpm'),
    (r'\b120\s*MW\b', 'programme.phase1_mw', 'mw'),
    (r'\b1\.2\s*GW\b', 'programme.phase2_gw', 'gw'),
    (r'\b4\s*GW\+?', 'programme.phase3_gw', 'gw_plus'),
    (r'\b6,385\b', 'programme.members_2030', 'comma'),
    (r'\b400,000\+?', 'programme.members_2035', 'comma_plus'),
    (r'\b412,458\+?', 'programme.members_2035', 'comma_plus'),
    (r'\b3,200\+?', 'programme.jobs_2035', 'comma_plus'),
    (r'\b3,252\+?', 'programme.jobs_2035', 'comma_plus'),
    (r'\b40,000\+?', 'programme.jobs_2051', 'comma_plus'),
    (r'\b40,212\+?', 'programme.jobs_2051', 'comma_plus'),
    (r'\b91\b(?=\s+direct jobs)', 'programme.jobs_2028', None),
    (r'(?:£|&pound;)570bn\b', 'value.bill_savings_bn', 'gbpbn'),
    (r'(?:£|&pound;)18bn\b', 'value.network_savings_bn', 'gbpbn'),
    (r'(?:£|&pound;)0\.55bn\b', 'value.social_carbon_bn', 'gbpbn'),
    (r'\b2\.7\s*MtCO₂e\b|\b2\.7\s*Mt\b', 'value.co2e_mt', 'mtco2'),
    (r'(?<![\d.])50%(?=\s+below|\s+off|\s+discount|\s+saving)?', 'page_stats.bill_saving_pct', 'pct'),
    (r'(?<=Over )70%(?=\s+of UK households)', 'programme.solar_demand_pct', 'pct'),
    (r'(?<=Fewer than )6%|(?<=fewer than )6%', 'programme.solar_penetration_pct', 'pct'),
    (r'(?<![\d.])70%(?=\s+local hiring|\s+local)', 'programme.local_hiring_pct', 'pct'),
    (r'(?<=first )8\s*years\b|(?<=For )8\s*years\b', 'page_stats.term_years', None)
]

def process_html_file(file_path):
    html_content = file_path.read_text(encoding='utf-8')
    soup = BeautifulSoup(html_content, 'html.parser')
    page = file_path.stem

    # Phase 1: Update existing data-fact elements safely
    for span in soup.find_all('span', attrs={'data-fact': True}):
        path = span.get('data-fact')
        fmt_type = span.get('data-fmt')
        val = get_val(path)
        if val is not None:
            new_text = fmt(val, fmt_type)
            if span.string != new_text:
                CHG[(page, str(span.string), new_text, path)] += 1
                span.string = new_text

    # Phase 2: Tag animated scroll counters (.counter)
    for span in soup.find_all('span', class_='counter'):
        if span.get('data-fact-to'):
            continue
        to_val = span.get('data-to')
        if to_val in COUNTER_MAP:
            target_key = COUNTER_MAP[to_val]
            span['data-fact-to'] = target_key
            CHG[(page, f"COUNTER TAGGED: data-to={to_val}", f"data-fact-to={target_key}", target_key)] += 1

    # Phase 3: Tag plain text nodes (IGNORE Comments, script, style, title, or existing tagged elements)
    for text_node in list(soup.find_all(string=True)):
        if isinstance(text_node, Comment) or not isinstance(text_node, NavigableString) or not text_node.strip():
            continue
        
        parent = text_node.parent
        if parent and (parent.name in ['script', 'style', 'title', 'head'] or 
                      parent.get('data-fact') or 
                      parent.get('data-fact-to') or 
                      'counter' in parent.get('class', [])):
            continue

        # Loop until all matches within this text node are tagged
        while True:
            node_text = str(text_node)
            matched = False

            for pattern, key, fmt_type in PROSE_RULES:
                match = re.search(pattern, node_text)
                if match:
                    matched_str = match.group(0)
                    before_text = node_text[:match.start()]
                    after_text = node_text[match.end():]

                    new_span = soup.new_tag('span', **{'data-fact': key})
                    if fmt_type:
                        new_span['data-fmt'] = fmt_type
                    new_span.string = matched_str

                    nodes_to_insert = []
                    if before_text:
                        nodes_to_insert.append(NavigableString(before_text))
                    nodes_to_insert.append(new_span)
                    if after_text:
                        nodes_to_insert.append(NavigableString(after_text))

                    text_node.replace_with(*nodes_to_insert)
                    CHG[(page, f"TEXT TAGGED: {matched_str}", f"data-fact={key}", key)] += 1
                    
                    # Point text_node to the remaining tail text to check for further matches
                    if after_text and isinstance(nodes_to_insert[-1], NavigableString):
                        text_node = nodes_to_insert[-1]
                        matched = True
                    break

            if not matched:
                break

    new_html = str(soup)
    n = len(soup.find_all(attrs={'data-fact': True})) + len(soup.find_all(attrs={'data-fact-to': True}))
    print('%-28s %3d facts active/tagged %s' % (file_path.name, n, '(changed)' if new_html != html_content else '(no change)'))

    if new_html != html_content and not dry:
        file_path.write_text(new_html, encoding='utf-8')

# Run processing
for f in sorted(root.glob('*.html')):
    process_html_file(f)

print('\nChanges preview:')
for (pg, o, n, k), c in sorted(CHG.items()):
    print('  %-16s %-36s -> %-32s x%d  (%s)' % (pg, o, n, c, k))

print('\nDry run completed. Nothing written.' if dry else '\nDone! Review all changes with `git diff`.')