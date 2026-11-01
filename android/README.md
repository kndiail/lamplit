# 提灯者 · Android 壳工程

这是一个零依赖的 WebView 壳，把网页版打进 APK。

## 构建

1. 安装 **JDK 17** 与 **Android Studio**（本机已有 SDK：`%LOCALAPPDATA%\Android\Sdk`，缺少 JDK）。
2. 同步网页资源：
   ```
   python tools/sync_android.py
   ```
3. Android Studio 打开 `android/` 目录，等待 Gradle 同步。
4. `Build → Build Bundle(s)/APK(s) → Build APK(s)`，产物在
   `android/app/build/outputs/apk/debug/app-debug.apk`。

## 说明

- 应用固定横屏、全屏沉浸，WebView 加载 `assets/www/index.html`
- 触屏、摇杆、冲刺/灯爆/暂停按钮、音游四轨点击都已由网页层处理
- `assets/www` 是同步产物，不入库；每次改完网页代码重新执行同步脚本
