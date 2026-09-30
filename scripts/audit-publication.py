"""Bounded audit of this repository's reachable blobs and intended ZIPs.
Only filenames, rule names and hashes are recorded; never matching values.
Heuristic scanning is one review layer, not a proof that secrets cannot exist.
"""
from pathlib import Path
import subprocess, re, json, hashlib, zipfile
root=Path(__file__).resolve().parents[1]
rules={
 'credential':rb'(?i)(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{25,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)',
 'machine-path':rb'(?i)(?:[A-Z]:[\\/](?:Users|Codex-Projects|xampp|Python314|maxima)[^\r\n"<>]*)',
 'private-evidence':rb'(?i)(?:9d7a2c8fb5ff4564ba2753a8ff7ae7db|DESKTOP-1TG2EVG|192\.168\.8\.8)',
 'email':rb'[A-Za-z0-9_.+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
}
def scan(data):return [name for name,pattern in rules.items() if re.search(pattern,data)]
objects=subprocess.check_output(['git','rev-list','--objects','--all'],cwd=root,text=True).splitlines()
findings=[];count=0
for line in objects:
 parts=line.split(' ',1);oid=parts[0];name=parts[1] if len(parts)>1 else '(commit/tree)'
 kind=subprocess.check_output(['git','cat-file','-t',oid],cwd=root,text=True).strip()
 if kind not in ('blob','commit'):continue
 data=subprocess.check_output(['git','cat-file',kind,oid],cwd=root);count+=1
 hits=scan(data)
 if hits:findings.append({'object':oid,'path':name,'rules':hits})
archives=[]
for archive in (root/'artifacts/release').glob('*.zip'):
 issues=[]
 with zipfile.ZipFile(archive) as z:
  for name in z.namelist():
   hits=scan(z.read(name))
   if hits:issues.append({'path':name,'rules':hits})
 archives.append({'archive':archive.name,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'findings':issues})
out=root/'artifacts/pok-history-audit.json';out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps({'scope':'all reachable local Git blobs and commit metadata; preserved HIL release ZIPs','objectsScanned':count,'findings':findings,'archives':archives,'decision':'Retain private local history; publish separately sanitized history. Review findings, including legitimate third-party contact notices.'},indent=2))
print(json.dumps({'objectsScanned':count,'flaggedObjects':len(findings),'oldArchives':len(archives),'report':out.name}))
