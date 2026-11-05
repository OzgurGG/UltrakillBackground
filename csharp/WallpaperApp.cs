using System;
using System.IO;
using System.Drawing;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;

public class SettingsWebForm : Form {
    private WebView2 webView;

    public SettingsWebForm(Icon appIcon) {
        this.Text = "UltrakillBackground Ayarlar";
        this.ClientSize = new Size(420, 560);
        this.FormBorderStyle = FormBorderStyle.FixedDialog;
        this.MaximizeBox = false;
        this.StartPosition = FormStartPosition.CenterScreen;
        this.TopMost = true;
        this.BackColor = Color.FromArgb(7, 7, 10);
        if (appIcon != null) this.Icon = appIcon;

        webView = new WebView2();
        webView.Dock = DockStyle.Fill;
        webView.DefaultBackgroundColor = Color.FromArgb(7, 7, 10);
        this.Controls.Add(webView);

        this.Shown += async (s, e) => {
            try {
                string settingsUserData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "UltrakillBackground_Settings");
                if (!Directory.Exists(settingsUserData)) Directory.CreateDirectory(settingsUserData);

                var settingsEnv = await CoreWebView2Environment.CreateAsync(null, settingsUserData, null);
                await webView.EnsureCoreWebView2Async(settingsEnv);

                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;

                string distFolder = WallpaperApp.FindDistFolder();
                WallpaperApp.Log("Settings distFolder: " + distFolder + " exists: " + Directory.Exists(distFolder));
                if (!Directory.Exists(distFolder) || !File.Exists(Path.Combine(distFolder, "index.html"))) {
                    MessageBox.Show("Ayar dosyalari eksik!\n'dist' klasoru bulunamadi: " + distFolder, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    this.Close();
                    return;
                }
                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "switch.local",
                    distFolder,
                    CoreWebView2HostResourceAccessKind.Allow
                );

                webView.CoreWebView2.WindowCloseRequested += (ws, we) => {
                    this.Close();
                };

                // Ayarlar penceresinden gelen canli yapilandirmayi arka plandaki duvarkagidina gonder
                webView.CoreWebView2.WebMessageReceived += (ws, we) => {
                    try {
                        string json = we.TryGetWebMessageAsString();
                        if (string.IsNullOrEmpty(json)) json = we.WebMessageAsJson;
                        if (!string.IsNullOrEmpty(json)) {
                            WallpaperApp.SendConfigToWallpaper(json);
                            WallpaperApp.SaveConfigFile(json);
                        }
                    } catch (Exception exMsg) {
                        WallpaperApp.Log("SettingsWebForm WebMessageReceived error: " + exMsg);
                    }
                };

                webView.NavigationCompleted += (ws, we) => {
                    // Kaydedilmis mevcut ayarlari arayuz yuklendiginde aktar
                    string saved = WallpaperApp.LoadConfigFile();
                    if (!string.IsNullOrEmpty(saved)) {
                        webView.CoreWebView2.ExecuteScriptAsync(
                            "window.setSwitchConfig && window.setSwitchConfig(" + saved + ");"
                        );
                    }
                };

                webView.CoreWebView2.Navigate("https://switch.local/index.html?mode=settings");
            } catch (Exception ex) {
                WallpaperApp.Log("SettingsWebForm error: " + ex);
                MessageBox.Show("Ayarlar arayüzü başlatılırken hata oluştu: " + ex.Message, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        };
    }

    protected override void OnFormClosing(FormClosingEventArgs e) {
        if (webView != null) {
            webView.Dispose();
            webView = null;
        }
        base.OnFormClosing(e);
    }
}

public static class TaskbarStyleManager {
    private static bool originalCaptured = false;
    private static int origSystemUsesLightTheme = 1;
    private static int origColorPrevalence = 0;
    private static int origAccentColor = 0;

    public static void CaptureOriginals() {
        if (originalCaptured) return;
        try {
            using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize", false)) {
                if (key != null) {
                    object vLight = key.GetValue("SystemUsesLightTheme");
                    if (vLight is int) origSystemUsesLightTheme = (int)vLight;
                    object vPrev = key.GetValue("ColorPrevalence");
                    if (vPrev is int) origColorPrevalence = (int)vPrev;
                }
            }
            using (var dwm = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\DWM", false)) {
                if (dwm != null) {
                    object vAcc = dwm.GetValue("AccentColor");
                    if (vAcc is int) origAccentColor = (int)vAcc;
                }
            }
            originalCaptured = true;
            WallpaperApp.Log("Captured original taskbar: Light=" + origSystemUsesLightTheme + " Prev=" + origColorPrevalence);
        } catch {}
    }

    public static void RestoreOriginals() {
        if (!originalCaptured) return;
        try {
            using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize", true)) {
                if (key != null) {
                    key.SetValue("SystemUsesLightTheme", origSystemUsesLightTheme, Microsoft.Win32.RegistryValueKind.DWord);
                    key.SetValue("ColorPrevalence", origColorPrevalence, Microsoft.Win32.RegistryValueKind.DWord);
                }
            }
            using (var dwm = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\DWM", true)) {
                if (dwm != null) {
                    dwm.SetValue("ColorPrevalence", origColorPrevalence, Microsoft.Win32.RegistryValueKind.DWord);
                    if (origAccentColor != 0) dwm.SetValue("AccentColor", origAccentColor, Microsoft.Win32.RegistryValueKind.DWord);
                }
            }
            BroadcastSettingsChange();
            WallpaperApp.Log("Restored original taskbar settings");
        } catch {}
    }

    public static void ApplyTaskbar(string styleMode, string themeId, string customHex = null) {
        CaptureOriginals();
        try {
            if (styleMode == "default") {
                RestoreOriginals();
                return;
            }

            bool isDark = true;
            bool useAccent = (styleMode == "theme");

            using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize", true)) {
                if (key != null) {
                    key.SetValue("SystemUsesLightTheme", isDark ? 0 : 1, Microsoft.Win32.RegistryValueKind.DWord);
                    key.SetValue("ColorPrevalence", useAccent ? 1 : 0, Microsoft.Win32.RegistryValueKind.DWord);
                }
            }

            if (useAccent) {
                int abgr = GetThemeColorABGR(themeId, customHex);
                using (var dwm = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\DWM", true)) {
                    if (dwm != null) {
                        dwm.SetValue("ColorizationColor", abgr, Microsoft.Win32.RegistryValueKind.DWord);
                        dwm.SetValue("AccentColor", abgr, Microsoft.Win32.RegistryValueKind.DWord);
                        dwm.SetValue("ColorPrevalence", 1, Microsoft.Win32.RegistryValueKind.DWord);
                    }
                }
            } else if (!useAccent) {
                using (var dwm = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\DWM", true)) {
                    if (dwm != null) {
                        dwm.SetValue("ColorPrevalence", 0, Microsoft.Win32.RegistryValueKind.DWord);
                    }
                }
            }

            BroadcastSettingsChange();
            WallpaperApp.Log("Taskbar style applied: " + styleMode + " theme: " + themeId + " custom: " + customHex);
        } catch (Exception ex) {
            WallpaperApp.Log("ApplyTaskbar error: " + ex);
        }
    }

    private static long lastBroadcastTick = 0;
    private static void BroadcastSettingsChange() {
        long now = DateTime.UtcNow.Ticks;
        // Windows Explorer ve acik pencereleri kitlememek icin en az 400ms mesafe koy
        if (now - lastBroadcastTick < TimeSpan.FromMilliseconds(400).Ticks) {
            return;
        }
        lastBroadcastTick = now;
        ThreadPool.QueueUserWorkItem((state) => {
            try {
                IntPtr res;
                WallpaperApp.SendMessageTimeout(new IntPtr(0xffff), 0x001A, IntPtr.Zero, "ImmersiveColorSet", 2, 250, out res);
                WallpaperApp.SendMessageTimeout(new IntPtr(0xffff), 0x001A, IntPtr.Zero, "ThemeChange", 2, 250, out res);
            } catch {}
        });
    }

    private static int HexToABGR(int r, int g, int b) {
        uint ur = (uint)(r & 0xFF);
        uint ug = (uint)(g & 0xFF);
        uint ub = (uint)(b & 0xFF);
        uint val = 0xFF000000u | (ub << 16) | (ug << 8) | ur;
        return unchecked((int)val);
    }

    private static int GetThemeColorABGR(string themeId, string customHex = null) {
        if (!string.IsNullOrEmpty(customHex) && customHex.StartsWith("#") && (customHex.Length == 7 || customHex.Length == 4)) {
            try {
                string h = customHex.Substring(1);
                if (h.Length == 3) {
                    h = "" + h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
                }
                int r = Convert.ToInt32(h.Substring(0, 2), 16);
                int g = Convert.ToInt32(h.Substring(2, 2), 16);
                int b = Convert.ToInt32(h.Substring(4, 2), 16);
                return HexToABGR(r, g, b);
            } catch {}
        }
        if (string.IsNullOrEmpty(themeId)) themeId = "cyan";
        switch (themeId.ToLowerInvariant()) {
            case "cyan":
                return HexToABGR(0x00, 0xF0, 0xFF);
            case "amber":
                return HexToABGR(0xFF, 0xAA, 0x00);
            case "red":
                return HexToABGR(0xFF, 0x22, 0x33);
            case "green":
                return HexToABGR(0x39, 0xFF, 0x14);
            case "purple":
                return HexToABGR(0xFF, 0x00, 0x7F);
            default:
                return HexToABGR(0x00, 0xF0, 0xFF);
        }
    }
}

public class WallpaperApp : Form {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool DestroyIcon(IntPtr hIcon);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    static extern IntPtr GetShellWindow();

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtr", SetLastError = true)]
    static extern IntPtr GetWindowLongPtr64(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", EntryPoint = "GetWindowLong", SetLastError = true)]
    static extern int GetWindowLong32(IntPtr hWnd, int nIndex);

    static IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex) {
        return (IntPtr.Size == 8) ? GetWindowLongPtr64(hWnd, nIndex) : new IntPtr(GetWindowLong32(hWnd, nIndex));
    }

    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtr", SetLastError = true)]
    static extern IntPtr SetWindowLongPtr64(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

    [DllImport("user32.dll", EntryPoint = "SetWindowLong", SetLastError = true)]
    static extern int SetWindowLong32(IntPtr hWnd, int nIndex, int dwNewLong);

    static IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong) {
        return (IntPtr.Size == 8) ? SetWindowLongPtr64(hWnd, nIndex, dwNewLong) : new IntPtr(SetWindowLong32(hWnd, nIndex, dwNewLong.ToInt32()));
    }

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    const int GWL_STYLE = -16;
    const int GWL_EXSTYLE = -20;
    const long WS_POPUP = 0x80000000L;
    const long WS_CHILD = 0x40000000L;
    const long WS_VISIBLE = 0x10000000L;
    const long WS_CLIPSIBLINGS = 0x04000000L;
    const long WS_EX_TOOLWINDOW = 0x00000080L;

    const uint SWP_SHOWWINDOW = 0x0040;
    const uint SWP_FRAMECHANGED = 0x0020;
    const uint SWP_NOACTIVATE = 0x0010;

    private WebView2 webView;
    private NotifyIcon trayIcon;
    private static WallpaperApp instance = null;
    private static bool isExiting = false;
    private IntPtr staticWorkerW = IntPtr.Zero;

    private static bool fitToTaskbar = true;
    private static Rectangle currentWorkingArea = Rectangle.Empty;
    private System.Windows.Forms.Timer boundsCheckTimer = null;

    private static CoreWebView2Environment sharedEnv = null;
    private static TaskCompletionSource<CoreWebView2Environment> envTcs = new TaskCompletionSource<CoreWebView2Environment>();

    public static async Task<CoreWebView2Environment> GetSharedEnvAsync() {
        if (sharedEnv != null) return sharedEnv;
        return await envTcs.Task;
    }

    private SettingsWebForm settingsForm = null;
    private ContextMenuStrip trayMenu = null;

    public static void SendConfigToWallpaper(string json) {
        if (instance != null && instance.webView != null && instance.webView.CoreWebView2 != null) {
            instance.BeginInvoke(new Action(() => {
                try {
                    instance.webView.CoreWebView2.ExecuteScriptAsync(
                        "window.setSwitchConfig && window.setSwitchConfig(" + json + ");"
                    );
                } catch {}
            }));
        }
    }

    public static string GetConfigFilePath() {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string candidate = Path.Combine(baseDir, "ultrakill-config.json");
        string parentCandidate = Path.Combine(baseDir, "..", "ultrakill-config.json");
        if (File.Exists(candidate)) return candidate;
        if (File.Exists(parentCandidate)) return parentCandidate;

        string legacy = Path.Combine(baseDir, "switch-config.json");
        if (File.Exists(legacy)) return legacy;
        string legacyParent = Path.Combine(baseDir, "..", "switch-config.json");
        if (File.Exists(legacyParent)) return legacyParent;

        return candidate;
    }

    public static string FindDistFolder() {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string[] candidates = new string[] {
            Path.Combine(baseDir, "dist"),
            Path.Combine(baseDir, "web", "dist"),
            Path.Combine(baseDir, "..", "web", "dist"),
            Path.Combine(baseDir, "..", "dist")
        };
        foreach (var p in candidates) {
            if (Directory.Exists(p) && File.Exists(Path.Combine(p, "index.html"))) {
                return Path.GetFullPath(p);
            }
        }
        return Path.Combine(baseDir, "dist");
    }

    public static string FindIconPath() {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string[] candidates = new string[] {
            Path.Combine(baseDir, "dist", "test-led-cyan.png"),
            Path.Combine(baseDir, "test-led-cyan.png"),
            Path.Combine(baseDir, "public", "test-led-cyan.png"),
            Path.Combine(baseDir, "web", "public", "test-led-cyan.png"),
            Path.Combine(baseDir, "..", "web", "public", "test-led-cyan.png")
        };
        foreach (var p in candidates) {
            if (File.Exists(p)) return Path.GetFullPath(p);
        }
        return Path.Combine(baseDir, "test-led-cyan.png");
    }

    public static Icon GetAppIcon() {
        string iconPath = FindIconPath();
        if (File.Exists(iconPath)) {
            try {
                using (Bitmap src = new Bitmap(iconPath)) {
                    using (Bitmap bm = new Bitmap(src, new Size(32, 32))) {
                        IntPtr hIcon = bm.GetHicon();
                        Icon iconObj = Icon.FromHandle(hIcon);
                        Icon result = (Icon)iconObj.Clone();
                        DestroyIcon(hIcon);
                        return result;
                    }
                }
            } catch {}
        }
        return SystemIcons.Application;
    }

    public static string ExtractJsonValue(string json, string key) {
        if (string.IsNullOrEmpty(json)) return null;
        string pattern = "\"" + key + "\"\\s*:\\s*(\"[^\"]+\"|true|false|[0-9\\.]+)";
        var match = System.Text.RegularExpressions.Regex.Match(json, pattern);
        if (match.Success && match.Groups.Count > 1) {
            string val = match.Groups[1].Value.Trim();
            if (val.StartsWith("\"") && val.EndsWith("\"")) {
                return val.Substring(1, val.Length - 2);
            }
            return val;
        }
        return null;
    }

    public static void ApplySystemConfig(string json) {
        try {
            if (string.IsNullOrEmpty(json)) return;

            string fitStr = ExtractJsonValue(json, "fitToTaskbar");
            bool shouldFit = (fitStr == null || fitStr == "true");
            fitToTaskbar = shouldFit;

            if (instance != null) {
                instance.BeginInvoke(new Action(() => instance.UpdateWindowBounds(shouldFit)));
            }

            string taskbarMode = ExtractJsonValue(json, "taskbarTheme");
            if (string.IsNullOrEmpty(taskbarMode)) taskbarMode = "dark";
            string themeId = ExtractJsonValue(json, "theme");
            if (string.IsNullOrEmpty(themeId)) themeId = "cyan";
            string customHex = ExtractJsonValue(json, "customColor");

            TaskbarStyleManager.ApplyTaskbar(taskbarMode, themeId, customHex);
        } catch (Exception ex) {
            Log("ApplySystemConfig error: " + ex);
        }
    }

    private static System.Windows.Forms.Timer saveDebounceTimer = null;
    private static string pendingConfigJson = null;

    public static void SaveConfigFile(string json) {
        pendingConfigJson = json;
        if (instance != null) {
            instance.BeginInvoke(new Action(() => {
                if (saveDebounceTimer == null) {
                    saveDebounceTimer = new System.Windows.Forms.Timer();
                    saveDebounceTimer.Interval = 150;
                    saveDebounceTimer.Tick += (s, e) => {
                        saveDebounceTimer.Stop();
                        saveDebounceTimer.Dispose();
                        saveDebounceTimer = null;
                        if (!string.IsNullOrEmpty(pendingConfigJson)) {
                            CommitConfigFile(pendingConfigJson);
                        }
                    };
                    saveDebounceTimer.Start();
                } else {
                    saveDebounceTimer.Stop();
                    saveDebounceTimer.Start();
                }
            }));
        } else {
            CommitConfigFile(json);
        }
    }

    private static void CommitConfigFile(string json) {
        try {
            string path = GetConfigFilePath();
            File.WriteAllText(path, json);
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string rootPath = Path.GetFullPath(Path.Combine(baseDir, "..", "switch-config.json"));
            if (File.Exists(rootPath) && !string.Equals(rootPath, path, StringComparison.OrdinalIgnoreCase)) {
                File.WriteAllText(rootPath, json);
            }
            ApplySystemConfig(json);
        } catch {}
    }

    public static string LoadConfigFile() {
        try {
            string path = GetConfigFilePath();
            if (File.Exists(path)) {
                return File.ReadAllText(path);
            }
        } catch {}
        return null;
    }

    public static void Log(string msg) {
        try {
            string p = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.log");
            File.AppendAllText(p, "[" + DateTime.Now.ToString("HH:mm:ss.fff") + "] " + msg + "\r\n");
        } catch {}
    }

    public WallpaperApp() {
        instance = this;
        Log("Constructor started");
        this.FormBorderStyle = FormBorderStyle.None;
        this.ShowInTaskbar = false;
        this.StartPosition = FormStartPosition.Manual;
        this.BackColor = Color.Black;

        string saved = LoadConfigFile();
        if (!string.IsNullOrEmpty(saved)) {
            string fitStr = ExtractJsonValue(saved, "fitToTaskbar");
            if (fitStr == "false") fitToTaskbar = false;
        }

        currentWorkingArea = Screen.PrimaryScreen.WorkingArea;
        Rectangle initialBounds = fitToTaskbar ? currentWorkingArea : Screen.PrimaryScreen.Bounds;
        this.Bounds = initialBounds;
        Log("Initial bounds (fitToTaskbar=" + fitToTaskbar + "): " + initialBounds.Width + "x" + initialBounds.Height + " at (" + initialBounds.X + "," + initialBounds.Y + ")");

        InitControls();
        InitSystemHooks();
    }

    private void InitSystemHooks() {
        try {
            Microsoft.Win32.SystemEvents.DisplaySettingsChanged += OnDisplayChanged;
            Microsoft.Win32.SystemEvents.UserPreferenceChanged += OnPreferenceChanged;

            boundsCheckTimer = new System.Windows.Forms.Timer();
            boundsCheckTimer.Interval = 2500;
            boundsCheckTimer.Tick += (s, e) => {
                try {
                    Rectangle wa = Screen.PrimaryScreen.WorkingArea;
                    if (!wa.Equals(currentWorkingArea)) {
                        Log("WorkingArea changed: " + wa);
                        UpdateWindowBounds(fitToTaskbar);
                    }
                } catch {}
            };
            boundsCheckTimer.Start();
        } catch (Exception ex) {
            Log("InitSystemHooks error: " + ex);
        }
    }

    private void OnDisplayChanged(object sender, EventArgs e) {
        if (instance != null) {
            instance.BeginInvoke(new Action(() => instance.UpdateWindowBounds(fitToTaskbar)));
        }
    }

    private void OnPreferenceChanged(object sender, Microsoft.Win32.UserPreferenceChangedEventArgs e) {
        if (instance != null) {
            instance.BeginInvoke(new Action(() => instance.UpdateWindowBounds(fitToTaskbar)));
        }
    }

    public void UpdateWindowBounds(bool fitTaskbar) {
        try {
            fitToTaskbar = fitTaskbar;
            Rectangle area = fitToTaskbar ? Screen.PrimaryScreen.WorkingArea : Screen.PrimaryScreen.Bounds;
            currentWorkingArea = Screen.PrimaryScreen.WorkingArea;

            if (this.Bounds.Equals(area) && webView != null && webView.Size.Equals(area.Size)) {
                return;
            }

            this.Bounds = area;
            if (webView != null) webView.Size = this.ClientSize;

            IntPtr progman = FindWindow("Progman", null);
            IntPtr shelldll = IntPtr.Zero;
            if (progman != IntPtr.Zero) {
                shelldll = FindWindowEx(progman, IntPtr.Zero, "SHELLDLL_DefView", null);
            }
            IntPtr insertAfter = (shelldll != IntPtr.Zero) ? shelldll : new IntPtr(1);
            SetWindowPos(this.Handle, insertAfter, area.X, area.Y, area.Width, area.Height, SWP_SHOWWINDOW | SWP_FRAMECHANGED | SWP_NOACTIVATE);
            this.PerformLayout();
            if (webView != null && webView.CoreWebView2 != null) {
                webView.CoreWebView2.ExecuteScriptAsync("window.dispatchEvent(new Event('resize'));");
            }
            Log("UpdateWindowBounds (fitTaskbar=" + fitTaskbar + "): " + area.Width + "x" + area.Height + " at (" + area.X + "," + area.Y + ")");
        } catch (Exception ex) {
            Log("UpdateWindowBounds error: " + ex);
        }
    }

    private void InitControls() {
        try {
            webView = new WebView2();
            webView.Location = new Point(0, 0);
            webView.Size = new Size(this.Width, this.Height);
            webView.Dock = DockStyle.Fill;
            webView.DefaultBackgroundColor = Color.Black;
            this.Controls.Add(webView);

            this.SizeChanged += (s, e) => {
                if (webView != null) webView.Size = this.ClientSize;
            };

            Log("WebView2 added to controls: " + this.Width + "x" + this.Height);
        } catch (Exception ex) {
            Log("InitControls error: " + ex);
        }

        try {
            trayIcon = new NotifyIcon();
            trayIcon.Icon = GetAppIcon();

            BuildTrayMenu();

            // Sol ve cift tiklama ayarlar penceresini acar
            trayIcon.MouseClick += (s, e) => {
                if (e.Button == MouseButtons.Left) {
                    OpenSetStyleDialog();
                }
            };
            trayIcon.DoubleClick += (s, e) => {
                OpenSetStyleDialog();
            };

            trayIcon.Text = "UltrakillBackground";
            trayIcon.Visible = true;
            Log("Tray initialized successfully");
        } catch (Exception ex) {
            Log("Tray error: " + ex);
        }

        this.Load += (s, e) => {
            Log("Form Load");
            this.Show();
            InitWebViewAsync();
        };
    }

    private void BuildTrayMenu() {
        trayMenu = new ContextMenuStrip();
        trayMenu.ShowImageMargin = true;

        ToolStripMenuItem miHeader = new ToolStripMenuItem("UltrakillBackground");
        miHeader.Enabled = false;
        miHeader.Font = new Font(trayMenu.Font, FontStyle.Bold);
        trayMenu.Items.Add(miHeader);

        trayMenu.Items.Add(new ToolStripSeparator());

        // Ana Ayarlar Penceresi (Web Arayuzu)
        ToolStripMenuItem miSetStyle = new ToolStripMenuItem("⚙ Ayarlar (Settings)...", null, (s, e) => {
            OpenSetStyleDialog();
        });
        miSetStyle.Font = new Font(trayMenu.Font, FontStyle.Bold);
        trayMenu.Items.Add(miSetStyle);

        trayMenu.Items.Add(new ToolStripSeparator());

        trayMenu.Items.Add(new ToolStripMenuItem("🔄 Yenile (Refresh)", null, (s, e) => {
            if (webView != null && webView.CoreWebView2 != null) {
                webView.CoreWebView2.ExecuteScriptAsync("window.dispatchEvent(new Event('resize'));");
            }
        }));

        trayMenu.Items.Add(new ToolStripMenuItem("❌ Çıkış (Exit)", null, (s, e) => {
            PerformExit();
        }));

        trayIcon.ContextMenuStrip = trayMenu;
    }

    public void OpenSetStyleDialog() {
        if (settingsForm != null && !settingsForm.IsDisposed) {
            settingsForm.BringToFront();
            settingsForm.Activate();
            return;
        }

        settingsForm = new SettingsWebForm(this.trayIcon != null ? this.trayIcon.Icon : null);
        settingsForm.Show();
        settingsForm.BringToFront();
        settingsForm.Activate();
    }

    private async void InitWebViewAsync() {
        Log("InitWebViewAsync start");
        try {
            string userData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "UltrakillBackground");
            if (!Directory.Exists(userData)) Directory.CreateDirectory(userData);

            var options = new CoreWebView2EnvironmentOptions();
            options.AdditionalBrowserArguments =
                "--enable-webgl --ignore-gpu-blocklist " +
                "--disable-backgrounding-occluded-windows " +
                "--disable-renderer-backgrounding " +
                "--disable-background-timer-throttling " +
                "--disable-features=CalculateNativeWinOcclusion,CalculateNativeWinOcclusionSkipChildWindows " +
                "--autoplay-policy=no-user-gesture-required";

            sharedEnv = await CoreWebView2Environment.CreateAsync(null, userData, options);
            envTcs.TrySetResult(sharedEnv);
            await webView.EnsureCoreWebView2Async(sharedEnv);
            Log("CoreWebView2 ensured. Runtime: " + webView.CoreWebView2.Environment.BrowserVersionString);

            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;

            webView.CoreWebView2.ProcessFailed += (s, pe) => {
                Log("CoreWebView2 ProcessFailed: " + pe.ProcessFailedKind + " reason: " + pe.Reason);
            };

            string distFolder = FindDistFolder();
            Log("Wallpaper distFolder: " + distFolder + " exists: " + Directory.Exists(distFolder));
            if (!Directory.Exists(distFolder) || !File.Exists(Path.Combine(distFolder, "index.html"))) {
                string errMsg = "Uygulama dosyalari eksik!\n\n" +
                    "'dist' klasorunun 'UltrakillBackground.exe' ile ayni klasorde yer aldigindan emin olun.\n" +
                    "Aranan yol: " + distFolder;
                Log(errMsg);
                MessageBox.Show(errMsg, "UltrakillBackground - Dosya Hatasi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Application.Exit();
                return;
            }

            webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "switch.local",
                distFolder,
                CoreWebView2HostResourceAccessKind.Allow
            );
            Log("Host mapped");

            webView.NavigationCompleted += (s, e) => {
                Log("NavigationCompleted: Success=" + e.IsSuccess + " ErrorStatus=" + e.WebErrorStatus);

                string saved = LoadConfigFile();
                if (!string.IsNullOrEmpty(saved)) {
                    webView.CoreWebView2.ExecuteScriptAsync(
                        "window.setSwitchConfig && window.setSwitchConfig(" + saved + ");"
                    );
                    ApplySystemConfig(saved);
                } else {
                    TaskbarStyleManager.ApplyTaskbar("dark", "cyan");
                }

                AttachToDesktop();
            };

            webView.CoreWebView2.Navigate("https://switch.local/index.html");
            Log("Navigating to https://switch.local/index.html");
        } catch (Exception ex) {
            Log("InitWebViewAsync error: " + ex);
            string msg = "WebView2 arayuzu baslatilamadi.\n\n" +
                "Eger bilgisayarinizda Microsoft Edge WebView2 Runtime kurulu degilse, calismasi icin yuklemeniz gerekir:\n" +
                "https://go.microsoft.com/fwlink/p/?LinkId=2124703\n\n" +
                "Hata detayi: " + ex.Message;
            MessageBox.Show(msg, "UltrakillBackground - Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Application.Exit();
        }
    }

    private int attachRetries = 0;

    private void AttachToDesktop() {
        try {
            Log("AttachToDesktop started");
            IntPtr progman = FindWindow("Progman", null);
            if (progman == IntPtr.Zero) {
                progman = GetShellWindow();
                Log("Fallback to GetShellWindow: " + progman);
            }
            Log("Progman: " + progman);
            if (progman == IntPtr.Zero) {
                if (attachRetries < 5) {
                    attachRetries++;
                    Log("Progman not found! Retrying attach in 1.5s (attempt " + attachRetries + "/5)...");
                    System.Windows.Forms.Timer retryTimer = new System.Windows.Forms.Timer();
                    retryTimer.Interval = 1500;
                    retryTimer.Tick += (ts, te) => {
                        retryTimer.Stop();
                        retryTimer.Dispose();
                        AttachToDesktop();
                    };
                    retryTimer.Start();
                } else {
                    Log("Progman not found after maximum retries.");
                }
                return;
            }

            // Masaustu kabugunu uyar
            IntPtr res;
            SendMessageTimeout(progman, 0x052C, new IntPtr(0xD), new IntPtr(1), 0, 1000, out res);
            SendMessageTimeout(progman, 0x052C, IntPtr.Zero, IntPtr.Zero, 0, 1000, out res);

            // Windows 11 24H2'de ikon katmani Progman'in dogrudan alt cocugudur
            IntPtr shelldll = FindWindowEx(progman, IntPtr.Zero, "SHELLDLL_DefView", null);

            if (shelldll == IntPtr.Zero) {
                EnumWindows((toplevel, param) => {
                    IntPtr shell = FindWindowEx(toplevel, IntPtr.Zero, "SHELLDLL_DefView", null);
                    if (shell != IntPtr.Zero) {
                        shelldll = shell;
                    }
                    return true;
                }, IntPtr.Zero);
            }
            Log("SHELLDLL_DefView: " + shelldll);

            // Progman altindaki statik arkaplan WorkerW penceresi
            staticWorkerW = FindWindowEx(progman, IntPtr.Zero, "WorkerW", null);
            Log("Progman Static WorkerW: " + staticWorkerW);

            // Pencere stilini WS_CHILD olarak guncelle
            long currentStyle = GetWindowLongPtr(this.Handle, GWL_STYLE).ToInt64();
            long newStyle = (currentStyle & ~WS_POPUP) | WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS;
            SetWindowLongPtr(this.Handle, GWL_STYLE, new IntPtr(newStyle));

            long currentExStyle = GetWindowLongPtr(this.Handle, GWL_EXSTYLE).ToInt64();
            long newExStyle = currentExStyle | WS_EX_TOOLWINDOW;
            SetWindowLongPtr(this.Handle, GWL_EXSTYLE, new IntPtr(newExStyle));

            // Windows 11 24H2: Dogrudan Progman'a SetParent yap
            IntPtr prevParent = SetParent(this.Handle, progman);
            Log("SetParent to Progman (" + progman + "). PrevParent: " + prevParent);

            // Z-Order: Ikonlarin (SHELLDLL_DefView) tam arkasina yerlestir
            IntPtr insertAfter = (shelldll != IntPtr.Zero) ? shelldll : new IntPtr(1); // HWND_BOTTOM
            Rectangle area = fitToTaskbar ? Screen.PrimaryScreen.WorkingArea : Screen.PrimaryScreen.Bounds;
            currentWorkingArea = Screen.PrimaryScreen.WorkingArea;
            bool posOk = SetWindowPos(this.Handle, insertAfter, area.X, area.Y, area.Width, area.Height, SWP_SHOWWINDOW | SWP_FRAMECHANGED | SWP_NOACTIVATE);
            Log("SetWindowPos result: " + posOk + " behind: " + insertAfter + " area: " + area.Width + "x" + area.Height + " at (" + area.X + "," + area.Y + ")");

            ShowWindow(this.Handle, 5 /* SW_SHOW */);

            // Eger arkadaki statik duvar kagidi WorkerW gorunurse, onu gizle ki siyah/statik ortmesin
            if (staticWorkerW != IntPtr.Zero) {
                ShowWindow(staticWorkerW, 0 /* SW_HIDE */);
                Log("Hid staticWorkerW to reveal live wallpaper");
            }

            // WinForms boyutlandirma ve Three.js resize tetikle
            this.PerformLayout();
            if (webView != null) {
                webView.Size = this.ClientSize;
                webView.CoreWebView2.ExecuteScriptAsync(@"
                    window.dispatchEvent(new Event('resize'));
                    setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 300);
                ");
            }

            Log("AttachToDesktop completed successfully!");
        } catch (Exception ex) {
            Log("AttachToDesktop error: " + ex);
        }
    }

    private void PerformExit() {
        isExiting = true;
        Log("PerformExit initiated");

        try {
            if (boundsCheckTimer != null) {
                boundsCheckTimer.Stop();
                boundsCheckTimer.Dispose();
                boundsCheckTimer = null;
            }
            Microsoft.Win32.SystemEvents.DisplaySettingsChanged -= OnDisplayChanged;
            Microsoft.Win32.SystemEvents.UserPreferenceChanged -= OnPreferenceChanged;
        } catch {}

        try {
            TaskbarStyleManager.RestoreOriginals();
        } catch {}

        try {
            if (staticWorkerW != IntPtr.Zero) {
                ShowWindow(staticWorkerW, 5 /* SW_SHOW */);
                Log("Restored staticWorkerW");
            }
        } catch {}

        try {
            if (trayIcon != null) {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }
        } catch {}

        Application.Exit();
    }

    protected override void OnFormClosing(FormClosingEventArgs e) {
        Log("OnFormClosing: " + e.CloseReason + " isExiting: " + isExiting);
        if (!isExiting && e.CloseReason == CloseReason.UserClosing) {
            e.Cancel = true;
            return;
        }
        PerformExit();
        base.OnFormClosing(e);
    }

    private static Mutex singleInstanceMutex = null;

    [STAThread]
    public static void Main() {
        Log("=== Main start ===");
        bool createdNew = true;
        try {
            singleInstanceMutex = new Mutex(true, "UltrakillBackground_Mutex", out createdNew);
            if (!createdNew) {
                Log("Already running instance detected. Exiting.");
                return;
            }
        } catch (Exception ex) {
            Log("Mutex error (ignored): " + ex.Message);
        }

        AppDomain.CurrentDomain.UnhandledException += (s, e) => Log("UNHANDLED: " + e.ExceptionObject);
        Application.ThreadException += (s, e) => Log("THREAD: " + e.Exception);
        Application.ApplicationExit += (s, e) => Log("Application.ApplicationExit fired");

        try {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new WallpaperApp());
        } catch (Exception ex) {
            Log("Main error: " + ex);
        } finally {
            if (singleInstanceMutex != null) {
                try {
                    singleInstanceMutex.ReleaseMutex();
                    singleInstanceMutex.Dispose();
                } catch {}
            }
        }
        Log("=== Main exit ===");
    }
}
