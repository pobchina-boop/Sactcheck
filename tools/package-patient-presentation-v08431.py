from pathlib import Path
import json,hashlib,zipfile,shutil
R=Path(__file__).resolve().parents[1];O=R.parent/'release-v08431';O.mkdir(exist_ok=True)
base=json.loads((R/'validation/patient-rollout-v08431/baseline-hashes.json').read_text())['files'];files=[]
for p in sorted(R.rglob('*')):
 if not p.is_file():continue
 rel=p.relative_to(R)
 if any(x.startswith('.') or x in ['_site','_preview31','node_modules','__pycache__'] for x in rel.parts):continue
 if rel.parts[0]=='validation' and (p.suffix=='.png' or p.name.endswith('-log.txt') or (p.name.endswith('-results.json') and p.name!='verified-results.json')):continue
 h=hashlib.sha256(p.read_bytes()).hexdigest()
 if base.get(str(rel))!=h:files.append((p,str(rel),h))
manifest={'release':'0.84.31','requires':'0.84.30','files':{rel:h for _,rel,h in files}}
(O/'manifest-v0.84.31.json').write_text(json.dumps(manifest,indent=2)+'\n')
with zipfile.ZipFile(O/'SACTCheck-v0.84.31-patient-repair.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p,rel,h in files:z.write(p,rel)
 z.write(O/'manifest-v0.84.31.json','validation/patient-rollout-v08431/package-manifest.json')
summary='Restore anatomical patient guides and add complete printable handbooks (v0.84.31)'
description='''Repair 29 recent patient routes, including separate lung dosing schedules and treatment phases. Restore the established anatomical illustration, numbered organ connections, medicine attribution and every authored toxicity description. Remove the older patient-view limit on agent-specific effects.

Provide three-page companions, front/back wallet cards with regimen-specific OncoWiki QR codes, progressive navigation, section printing, full OncoWiki PDFs and complete patient handbooks with contents, page numbers and bookmarks. Preserve formal consent and patient passports. Keep placeholder phone numbers clearly labelled.

Carry forward the focused TC and AC-to-weekly-paclitaxel monitoring/setting corrections into patient and clinician descriptive content. Clinical assessment protocol JSON is unchanged. This is not a new independent clinical approval or a comprehensive re-audit of all treatment rules.

Validation: 260 CI command results pass after final PDF/manifest refresh; 58 companion/card PDFs and 87 QR checks pass; 3,085 reference text blocks are retained across 29 full-reference PDFs, with no out-of-page text in the references or handbooks. Desktop browser inspection confirms eight symptom boxes, eight anchors and eight connector lines on the representative 00568 map, progressive navigation, full medicine explanations and print/download controls. Mobile CSS is present; a separate mobile-device browser run was not completed.

Requires v0.84.30. No new regimen expansion, commit, push or deployment performed. Clinical, pharmacy and patient/PPI review remains pending.
'''
(O/'GITHUB-SUMMARY-v0.84.31.txt').write_text(summary+'\n');(O/'GITHUB-DESCRIPTION-v0.84.31.txt').write_text(description)
(O/'APPLY-v0.84.31.txt').write_text('Requires v0.84.30 first. Extract the ZIP, then copy its CONTENTS into the repository root and accept file replacement. Do not upload the ZIP itself as repository source. Review changed files, use the supplied GitHub summary/description, commit and push. Keep the existing repository files that are not in this update. This package does not include a new deployment configuration.\n')
zip_path=O/'SACTCheck-v0.84.31-patient-repair.zip';(O/'SHA256-v0.84.31.txt').write_text(hashlib.sha256(zip_path.read_bytes()).hexdigest()+'  '+zip_path.name+'\n')
shutil.copyfile(R/'patient/00568/guide.pdf',O/'Corrected-three-page-companion-v0.84.31.pdf');shutil.copyfile(R/'patient/00568/handbook.pdf',O/'Complete-patient-handbook-example-v0.84.31.pdf')
print('Packaged',len(files),'files;',round(zip_path.stat().st_size/1e6,1),'MB')
