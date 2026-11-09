#!/usr/bin/env python3
"""Independently verify the original v44 clauses in current canonical HTML.

Reads the frozen historical review directly, not the transformer's generated
plan or change log. --stage permits review of staged candidate HTML.
"""
from pathlib import Path
import argparse
import gzip
import hashlib
import json
import re
import subprocess
import unicodedata
from lxml import html as LH

HERE=Path(__file__).resolve()
ROOT=next(p for p in HERE.parents if (p/'package.json').is_file() and (p/'tools/patient-editorial-v08444.cjs').is_file())

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage',type=Path)
    parser.add_argument('--report',required=True,type=Path)
    args=parser.parse_args()
    audit=ROOT/'validation/patient-design-v08444/companion-content-retention.json.gz'
    data=json.loads(gzip.decompress(audit.read_bytes()))
    terms=json.loads(subprocess.check_output(['node','-e','process.stdout.write(JSON.stringify(require("./tools/patient-editorial-v08444.cjs").TERMS))'],cwd=ROOT))
    raw=lambda value:re.sub(r'[^\w]','',unicodedata.normalize('NFKC',value).replace('\u00ad','')).casefold()
    pairs=sorted([(raw(full+short),raw(short)) for short,full in terms],key=lambda x:-len(x[0]))
    def norm(value):
        result=raw(value)
        for a,b in pairs:result=result.replace(a,b)
        return result
    results=[];errors=[];texts={}
    for unit in data['units']:
        if unit['status']!='missing':continue
        route=unit['route'];file=(args.stage or ROOT/'patient')/route/'knowledge.html'
        if route not in texts:
            tree=LH.fromstring(file.read_text())
            for element in tree.xpath('//script | //style | //svg'):element.drop_tree()
            texts[route]=(tree,norm(tree.text_content()))
        tree,text=texts[route]
        related=(unit.get('deduplication') or {}).get('supply_gap_covered_by_group_id')
        target=None
        if related is not None:
            matches=[x for x in data['units'] if x['route']==route and x.get('group_id')==related and x['status']=='missing']
            assert len(matches)==1
            target=matches[0]
            assert (target.get('deduplication') or {}).get('canonical_for_related_supply_gap_group_id')==unit['group_id']
        for index,clause in enumerate(unit['missing_clauses']):
            variants=(target.get('display_clauses') or target['missing_clauses']) if target else [clause,(unit.get('display_clauses') or unit['missing_clauses'])[index]]
            found=any(norm(value) in text for value in variants)
            # Conditions remain in a visible source heading near each restored
            # paragraph; matching words elsewhere is insufficient for a new clause.
            nearby=True
            if not target:
                candidates=tree.xpath('//p[@data-book44-source-unit="'+unit['source_sha256']+'"]')
                matching=[p for p in candidates if any(norm(value) in norm(p.text_content()) for value in variants)]
                nearby=bool(matching) and any(norm(unit['source_heading']) in norm(p.getparent().text_content()) for p in matching)
            row={'route':route,'source_file':unit['source_file'],'source_xpath':unit['source_xpath'],'source_clause_sha256':hashlib.sha256(norm(clause).encode()).hexdigest(),'retained':found,'source_heading_retained_nearby':nearby,'reviewed_cross_unit_equivalence':bool(target)}
            results.append(row)
            if not found or not nearby:errors.append(row)
    report={'schema_version':1,'status':'failed' if errors else 'pass','audit_sha256':hashlib.sha256(audit.read_bytes()).hexdigest(),'routes_checked':len(texts),'clauses_checked':len(results),'errors':errors,'results':results}
    args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({key:report[key] for key in ['status','routes_checked','clauses_checked','errors']}))
    if errors:raise SystemExit(1)

if __name__=='__main__':main()
