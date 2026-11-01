import os, shutil, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DST = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'www')

FILES = ['index.html', 'manifest.webmanifest', 'sw.js']
DIRS = ['css', 'js', 'assets']

if os.path.isdir(DST):
    shutil.rmtree(DST)
os.makedirs(DST, exist_ok=True)
for f in FILES:
    src = os.path.join(ROOT, f)
    if os.path.exists(src):
        shutil.copyfile(src, os.path.join(DST, f))
for d in DIRS:
    src = os.path.join(ROOT, d)
    if os.path.isdir(src):
        shutil.copytree(src, os.path.join(DST, d))
print('synced ->', DST)
