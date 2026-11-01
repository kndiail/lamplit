import io, os, glob, subprocess, shutil, sys

ROOT = os.path.abspath('.')
DIST = os.path.join(ROOT, 'dist')
CSC = r'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if not os.path.exists(CSC):
    CSC = r'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe'
if not os.path.exists(CSC):
    print('csc.exe not found'); sys.exit(1)

os.makedirs(DIST, exist_ok=True)

files = ['index.html']
files += glob.glob('css/**/*', recursive=True)
files += glob.glob('js/**/*', recursive=True)
files += glob.glob('assets/**/*', recursive=True)
files = sorted(set(f.replace('\\', '/') for f in files if os.path.isfile(f) and not f.endswith('.map')))

out = os.path.join(DIST, 'Lamplit.exe')
args = [CSC, '/nologo', '/target:winexe', '/optimize+', '/platform:anycpu',
        '/out:' + out,
        '/r:System.Windows.Forms.dll', '/r:System.Drawing.dll']
for f in files:
    res = f.replace('/', '__')
    args.append('/resource:' + os.path.join(ROOT, f) + ',' + res)
args.append(os.path.join(ROOT, 'tools', 'Launcher.cs'))

print('embedding %d files' % len(files))
r = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
if r.returncode != 0:
    print('CSC FAILED', r.returncode)
    print(r.stdout[-4000:])
    print(r.stderr[-2000:])
    sys.exit(1)

cn = os.path.join(DIST, u'提灯者.exe')
shutil.copyfile(out, cn)

readme = u'''提灯者 · LAMPLIT  v4.3
====================================
双击「提灯者.exe」即玩：
  · 程序会在本机 127.0.0.1 上启动内置服务，并自动用默认浏览器打开游戏
  · 首次启动会自动清空一次存档（?reset=1）
  · 关闭浏览器不会退出程序：请在任务栏托盘图标上右键 → 退出
  · 托盘菜单里也可以「重置存档并重开」

操作：
  WASD 移动　Shift 冲刺　E 灯爆　Esc 暂停
  空格 = 确认 / 跳过演出　　1 2 3 = 选卡
  D F J K = 第三层「节拍试炼」音游

注意：
  · 若杀毒软件拦截，请允许本程序监听本机回环地址
  · 存档保存在浏览器 localStorage（按端口区分），换端口即换档
'''
io.open(os.path.join(DIST, u'使用说明.txt'), 'w', encoding='utf-8', newline='\r\n').write(readme)

print('built:', out)
print('built:', cn)
print('size %.1f MB' % (os.path.getsize(out) / 1048576.0))
