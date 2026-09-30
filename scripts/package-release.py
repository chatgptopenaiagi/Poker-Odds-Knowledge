"""Create portable public website and tracked-source ZIPs; no environment/history upload."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
OUT = ROOT / 'artifacts' / 'release'
OUT.mkdir(parents=True, exist_ok=True)
assert (DIST / 'index.html').is_file(), 'Build before packaging'
commit = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip()
tracked = subprocess.check_output(['git', '-C', str(ROOT), 'ls-files', '-z']).decode().split('\0')
allowed = {'.html', '.js', '.css', '.svg', '.png', '.ico', '.txt', '.json'}
assets = sorted(path for path in DIST.rglob('*') if path.is_file())
assert all(path.suffix in allowed or path.name == '.htaccess' for path in assets)
assert not any(part in {'.git', 'node_modules', '.venv'} for path in assets for part in path.parts)
website = OUT / 'Holdem-Insight-Lab-website-1.0.0.zip'
with zipfile.ZipFile(website, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in assets:
        archive.write(file, file.relative_to(DIST).as_posix())
source = OUT / 'Holdem-Insight-Lab-source-1.0.0.zip'
with zipfile.ZipFile(source, 'w', zipfile.ZIP_DEFLATED) as archive:
    for relative in sorted(filter(None, tracked)):
        assert not relative.startswith(('.git/', '.venv/', 'node_modules/', 'artifacts/'))
        assert Path(relative).name != 'CODEX_MISSION.txt'
        archive.write(ROOT / relative, relative)
records = []
unit = json.loads((ROOT / 'artifacts' / 'unit-results.json').read_text(encoding='utf-8'))
summary = {key: unit.get(key) for key in ['numTotalTests', 'numPassedTests', 'numFailedTests', 'numPendingTests', 'success', 'startTime']}
(ROOT / 'artifacts' / 'unit-summary.json').write_text(json.dumps(summary, indent=2)+'\n', encoding='utf-8')
evidence = OUT / 'Holdem-Insight-Lab-evidence-1.0.0.zip'
evidence_files = [ROOT / 'TEST_REPORT.md', ROOT / 'DELIVERY_MANIFEST.md', ROOT / 'CLA_ACCEPTANCE.md', ROOT / 'tests/fixtures/math-v1.json']
evidence_files += [ROOT / 'artifacts' / name for name in ['unit-summary.json', 'browser-measurements.json', 'evaluator-census.json', 'equity-node-benchmark.json', 'oracle-result.json', 'deployment-checks.json']]
evidence_files += sorted((ROOT / 'artifacts/screenshots').glob('*.png'))
with zipfile.ZipFile(evidence, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in evidence_files:
        assert file.is_file(), f'Missing actual evidence: {file.name}'
        archive.write(file, file.relative_to(ROOT).as_posix())
for file in (website, source, evidence):
    with zipfile.ZipFile(file) as archive:
        assert archive.testzip() is None
    records.append({'file': file.name, 'bytes': file.stat().st_size, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
(OUT / 'SHA256SUMS.txt').write_text(''.join(f"{r['sha256']}  {r['file']}\n" for r in records), encoding='utf-8')
(OUT / 'release.json').write_text(json.dumps({'product': "Hold'em Insight Lab", 'version':'1.0.0', 'sourceCommit':commit, 'archives':records, 'publicAssetCount':len(assets)}, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'sourceCommit':commit,'publicAssets':len(assets),'archives':records},indent=2))
