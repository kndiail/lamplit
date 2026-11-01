using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using System.Diagnostics;

class Launcher
{
    static Dictionary<string, byte[]> files = new Dictionary<string, byte[]>();
    static int port = 18080;
    static string baseUrl = "";
    static bool firstRun = false;
    static bool noOpen = false;

    [STAThread]
    static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        noOpen = Array.IndexOf(args, "--no-open") >= 0;
        bool forceReset = Array.IndexOf(args, "--reset") >= 0;
        for (int i = 0; i < args.Length - 1; i++)
            if (args[i] == "--port") int.TryParse(args[i + 1], out port);

        LoadResources();

        string markerDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Lamplit");
        try { Directory.CreateDirectory(markerDir); } catch (Exception) { }
        string flag = Path.Combine(markerDir, "started.flag");
        firstRun = forceReset || !File.Exists(flag);

        TcpListener listener = null;
        for (int i = 0; i < 60; i++)
        {
            try
            {
                TcpListener l = new TcpListener(IPAddress.Loopback, port + i);
                l.Start();
                listener = l;
                port = port + i;
                break;
            }
            catch (SocketException) { }
        }
        if (listener == null)
        {
            MessageBox.Show("无法启动内置服务（端口被占用）。", "提灯者 · LAMPLIT");
            return;
        }
        baseUrl = "http://127.0.0.1:" + port + "/";

        Thread t = new Thread(new ThreadStart(delegate { AcceptLoop(listener); }));
        t.IsBackground = true;
        t.Start();

        if (!noOpen) Open(baseUrl + (firstRun ? "?reset=1" : ""));
        if (firstRun)
        {
            try { File.WriteAllText(flag, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")); }
            catch (Exception) { }
        }

        NotifyIcon tray = new NotifyIcon();
        tray.Icon = SystemIcons.Application;
        tray.Text = "提灯者 · LAMPLIT";
        ContextMenu menu = new ContextMenu();
        menu.MenuItems.Add("打开游戏", delegate { Open(baseUrl); });
        menu.MenuItems.Add("重置存档并重开", delegate { Open(baseUrl + "?reset=1"); });
        menu.MenuItems.Add("-");
        menu.MenuItems.Add("退出", delegate { tray.Visible = false; Application.Exit(); });
        tray.ContextMenu = menu;
        tray.Visible = true;
        tray.DoubleClick += delegate { Open(baseUrl); };
        if (!noOpen)
            tray.ShowBalloonTip(3000, "提灯者 · LAMPLIT",
                "已在浏览器中打开。退出请右键托盘图标。", ToolTipIcon.Info);
        Application.Run();
    }

    static void Open(string url)
    {
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
        catch (Exception)
        {
            try { Process.Start("cmd", "/c start " + url); } catch (Exception) { }
        }
    }

    static void LoadResources()
    {
        Assembly asm = Assembly.GetExecutingAssembly();
        foreach (string name in asm.GetManifestResourceNames())
        {
            Stream s = null;
            try { s = asm.GetManifestResourceStream(name); }
            catch (Exception) { }
            if (s == null) continue;
            using (s)
            {
                using (MemoryStream ms = new MemoryStream())
                {
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = s.Read(buf, 0, buf.Length)) > 0) ms.Write(buf, 0, n);
                    files["/" + name.Replace("__", "/")] = ms.ToArray();
                }
            }
        }
    }

    static string MimeFor(string path)
    {
        string p = path.ToLowerInvariant();
        if (p.EndsWith(".html")) return "text/html; charset=utf-8";
        if (p.EndsWith(".css")) return "text/css; charset=utf-8";
        if (p.EndsWith(".js")) return "application/javascript; charset=utf-8";
        if (p.EndsWith(".json")) return "application/json; charset=utf-8";
        if (p.EndsWith(".woff2")) return "font/woff2";
        if (p.EndsWith(".woff")) return "font/woff";
        if (p.EndsWith(".png")) return "image/png";
        if (p.EndsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    static void AcceptLoop(TcpListener listener)
    {
        while (true)
        {
            try
            {
                TcpClient c = listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(delegate(object o) { Handle((TcpClient)o); }, c);
            }
            catch (Exception) { break; }
        }
    }

    static void Handle(TcpClient client)
    {
        try
        {
            using (client)
            {
                client.ReceiveTimeout = 8000;
                client.SendTimeout = 8000;
                NetworkStream ns = client.GetStream();
                StreamReader reader = new StreamReader(ns, Encoding.ASCII);
                string line = reader.ReadLine();
                if (line == null) return;
                while (true)
                {
                    string h = reader.ReadLine();
                    if (h == null || h.Length == 0) break;
                }
                string[] parts = line.Split(' ');
                string path = parts.Length > 1 ? parts[1] : "/";
                int q = path.IndexOf('?');
                if (q >= 0) path = path.Substring(0, q);
                if (path == "/") path = "/index.html";

                byte[] body = null;
                string mime = "application/octet-stream";
                if (path == "/__health")
                {
                    string json = "{\"ok\":true,\"port\":" + port + ",\"firstRun\":" +
                        (firstRun ? "true" : "false") + ",\"files\":" + files.Count + "}";
                    body = Encoding.UTF8.GetBytes(json);
                    mime = "application/json; charset=utf-8";
                }
                else if (files.ContainsKey(path))
                {
                    body = files[path];
                    mime = MimeFor(path);
                }

                if (body == null)
                {
                    Write(ns, "404 Not Found", "text/plain; charset=utf-8",
                        Encoding.UTF8.GetBytes("404"));
                    return;
                }
                Write(ns, "200 OK", mime, body);
            }
        }
        catch (Exception) { }
    }

    static void Write(NetworkStream ns, string status, string mime, byte[] body)
    {
        string head = "HTTP/1.1 " + status + "\r\n" +
            "Content-Type: " + mime + "\r\n" +
            "Content-Length: " + body.Length + "\r\n" +
            "Cache-Control: no-store\r\n" +
            "Server: Lamplit\r\n" +
            "Connection: close\r\n\r\n";
        byte[] hb = Encoding.ASCII.GetBytes(head);
        ns.Write(hb, 0, hb.Length);
        ns.Write(body, 0, body.Length);
        ns.Flush();
    }
}
