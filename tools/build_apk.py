# -*- coding: utf-8 -*-
"""不依赖 Gradle 的 APK 打包脚本：aapt2 链接资源 + 手工写入 assets/dex + zipalign + apksigner"""
import os, sys, shutil, subprocess, zipfile, glob

WORK = os.environ.get('APK_WORK', r'D:\lamplit-build')
SRC = os.environ.get('APK_SRC', r'D:\项目\像素游戏')
SDK = os.environ.get('ANDROID_SDK', os.path.join(os.environ['LOCALAPPDATA'], 'Android', 'Sdk'))
BT = os.path.join(SDK, 'build-tools', 'android-14')
AJ = os.path.join(SDK, 'platforms', 'android-34', 'android.jar')
JDK = os.environ.get('APK_JDK', os.path.join(WORK, '.tools', 'jdk-17.0.21.0.2+1'))

MANIFEST = os.path.join(WORK, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')
ASSETS = os.path.join(WORK, 'android', 'app', 'src', 'main', 'assets')
RES = os.path.join(WORK, 'android', 'app', 'src', 'main', 'res')
BUILD = os.path.join(WORK, 'build')

os.makedirs(BUILD, exist_ok=True)


def run(args, label):
    print('>>', label)
    r = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        print(r.stdout[-3000:])
        print(r.stderr[-3000:])
        raise SystemExit('FAILED: ' + label)
    return r


def step_compile_res():
    flat = os.path.join(BUILD, 'flat')
    if os.path.isdir(flat):
        shutil.rmtree(flat)
    os.makedirs(flat)
    run([os.path.join(BT, 'aapt2.exe'), 'compile', '--dir', RES, '-o', flat + os.sep],
        'aapt2 compile')


def step_link():
    """--no-compress-asset 关掉自动打包，assets 稍后手工写入（避免 Windows 反斜杠条目）"""
    base = os.path.join(BUILD, 'base.apk')
    if os.path.exists(base):
        os.remove(base)
    gen = os.path.join(BUILD, 'gen')
    if os.path.isdir(gen):
        shutil.rmtree(gen)
    os.makedirs(gen)
    flats = sorted(glob.glob(os.path.join(BUILD, 'flat', '*.flat')))
    run([os.path.join(BT, 'aapt2.exe'), 'link', '-o', base, '-I', AJ,
         '--manifest', MANIFEST, '--java', gen,
         '--min-sdk-version', '23', '--target-sdk-version', '34',
         '--version-code', '2', '--version-name', '4.5'] + flats, 'aapt2 link')
    return base


def step_pack(base):
    """写入 assets（正斜杠）与 classes.dex"""
    out = os.path.join(BUILD, 'unsigned.apk')
    shutil.copyfile(base, out)
    assets_root = os.path.join(ASSETS, 'www')
    count = 0
    with zipfile.ZipFile(out, 'a', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for dirpath, _dirnames, filenames in os.walk(assets_root):
            for fn in filenames:
                full = os.path.join(dirpath, fn)
                # APK 内 assets 目录对应 assets/ 前缀
                rel = 'assets/' + os.path.relpath(full, ASSETS).replace(os.sep, '/')
                z.write(full, rel)
                count += 1
        dex = os.path.join(BUILD, 'dex', 'classes.dex')
        if not os.path.exists(dex):
            raise SystemExit('缺少 classes.dex：' + dex)
        z.write(dex, 'classes.dex')
    print('   写入资源文件:', count)
    return out


def step_align(src):
    out = os.path.join(BUILD, 'aligned.apk')
    if os.path.exists(out):
        os.remove(out)
    run([os.path.join(BT, 'zipalign.exe'), '-f', '-p', '4', src, out], 'zipalign')
    return out


def step_sign(src):
    out = os.path.join(BUILD, 'lamplit.apk')
    if os.path.exists(out):
        os.remove(out)
    ks = os.path.join(BUILD, 'lamplit.keystore')
    if not os.path.exists(ks):
        raise SystemExit('缺少 keystore：' + ks)
    run([os.path.join(BT, 'apksigner.bat'), 'sign',
         '--ks', ks, '--ks-pass', 'pass:lamplit2026', '--key-pass', 'pass:lamplit2026',
         '--ks-key-alias', 'lamplit', '--min-sdk-version', '23', '--out', out, src], 'apksigner sign')
    run([os.path.join(BT, 'apksigner.bat'), 'verify', out], 'apksigner verify')
    return out


def check(apk):
    """确认资源路径合法、关键文件存在、内容是新版"""
    with zipfile.ZipFile(apk) as z:
        bad = [n for n in z.namelist() if '\\' in n]
        print('   反斜杠条目:', len(bad))
        if bad:
            raise SystemExit('条目路径非法: ' + bad[0])
        need = ['assets/www/index.html', 'assets/www/js/game.js',
                'assets/www/js/lib.js', 'assets/www/js/rhythm.js', 'classes.dex']
        for n in need:
            if n not in z.namelist():
                raise SystemExit('缺少条目: ' + n)
        lib = z.read('assets/www/js/lib.js').decode('utf-8')
        game = z.read('assets/www/js/game.js').decode('utf-8')
        print('   条目总数:', len(z.namelist()))
        print('   layout():', lib.count('layout()'))
        print('   magnetT:', game.count('magnetT'))
        print('   BACK_BTN:', game.count('BACK_BTN'))
    print('   APK 大小: %.2f MB' % (os.path.getsize(apk) / 1048576.0))


if __name__ == '__main__':
    step_compile_res()
    base = step_link()
    unsigned = step_pack(base)
    aligned = step_align(unsigned)
    signed = step_sign(aligned)
    check(signed)
    dst = os.path.join(SRC, 'dist', 'android', '提灯者-4.5.apk')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(signed, dst)
    print('DONE ->', dst)
