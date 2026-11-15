package org.quadrift.hddevelopment;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.SharedPreferences;
import android.content.Intent;
import android.net.Uri;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.util.AtomicFile;
import org.json.JSONObject;
import java.io.File;
import java.io.InputStream;
import java.io.FileOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.security.MessageDigest;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.view.Gravity;
import android.window.OnBackInvokedDispatcher;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/** Offline-only host with a bounded private save journal and no external navigation. */
public final class MainActivity extends Activity {
    private static final String GAME_URL = "https://appassets.androidplatform.net/index.html";
    private WebView web;
    private OriginalFiles originalFiles;
    private static final int IMPORT_ORIGINAL = 9301;
    private static final int MAX_ORIGINAL = 16 * 1024 * 1024;
    private static final Set<String> PACKAGED = new HashSet<>(Arrays.asList("index.html"));
    private int rendererFailures;
    private int safeLeft, safeTop, safeRight, safeBottom;

    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        rendererFailures = state == null ? 0 : state.getInt("rendererFailures", 0);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(10, 12, 18));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(10, 12, 18));
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        // Paint the game edge to edge; only HUD controls receive safe insets.
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                safeLeft = safe.left; safeTop = safe.top; safeRight = safe.right; safeBottom = safe.bottom;
                v.setPadding(0, 0, 0, insets.getInsets(WindowInsets.Type.ime()).bottom);
                publishSafeInsets();
                return WindowInsets.CONSUMED;
            }
            return insets; // API 26–29 decor fits system windows by default.
        });
        root.requestApplyInsets();
        enterImmersive();
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); // Trusted packaged game only.
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        // Only packaged, non-navigable HTML executes here. This capability can
        // access bounded game-save keys, never files, intents or the network.
        web.addJavascriptInterface(new LocalStore(getSharedPreferences("mongyu.offline.v1", MODE_PRIVATE)), "_MongyuStore");
        originalFiles = new OriginalFiles();
        // Imported R93 files remain in private storage; standalone play needs no file bridge.
        CookieManager.getInstance().setAcceptCookie(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // A dead renderer must never take the Activity down with it.
                // Keep the origin's saved collection; do not clear WebView data.
                if (web == view) web = null;
                if (view.getParent() instanceof FrameLayout) ((FrameLayout)view.getParent()).removeView(view);
                view.destroy();
                if (!isFinishing() && !isDestroyed()) {
                    if (rendererFailures++ == 0) recreate();
                    else showRecovery(); // Bound automatic retries; the player chooses the next one.
                }
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (GAME_URL.equals(url)) publishSafeInsets();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !GAME_URL.equals(request.getUrl().toString());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("GET".equals(request.getMethod()) && "https".equals(uri.getScheme())
                        && "appassets.androidplatform.net".equals(uri.getHost()) && uri.getPort() == -1) {
                    String path = uri.getPath();
                    try {
                        String asset = path != null && path.startsWith("/") ? path.substring(1) : "";
                        if (PACKAGED.contains(asset)) {
                            String mime = asset.endsWith(".html") ? "text/html" : asset.endsWith(".css") ? "text/css"
                                : asset.endsWith(".mjs") || asset.endsWith(".js") ? "application/javascript"
                                : asset.endsWith(".wasm") ? "application/wasm" : asset.endsWith(".sf3") ? "application/octet-stream" : "text/plain";
                            return new WebResourceResponse(mime, mime.startsWith("text/") || mime.equals("application/javascript") ? "UTF-8" : null,
                                200, "OK", contentHeaders(), getAssets().open(asset));
                        }
                    } catch (IOException missing) { return response(500, "Missing asset", "Packaged or original file could not be read."); }
                }
                return response(403, "Blocked", "Offline package: request blocked.");
            }
        });
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::gameBack);
        }
        web.loadUrl(GAME_URL);
    }

    /** Only explicitly chosen game bytes enter this store; no arbitrary path API. */
    public final class OriginalFiles {
        private final AtomicFile current = new AtomicFile(new File(getFilesDir(), "original-game-v1"));
        private final AtomicFile pending = new AtomicFile(new File(getFilesDir(), "original-pending-v1"));
        private boolean choosing;
        private AtomicFile file(boolean candidate) { return candidate ? pending : current; }
        private JSONObject header(DataInputStream in) throws Exception {
            if (in.readInt() != 0x4d474f31) throw new IOException("Invalid container");
            String name = in.readUTF(); int size = in.readInt(); String hash = in.readUTF();
            if (name.length() > 180 || size < 22 || size > MAX_ORIGINAL || !hash.matches("[a-f0-9]{64}")) throw new IOException("Invalid metadata");
            return new JSONObject().put("name", name).put("bytes", size).put("sha256", hash);
        }
        @JavascriptInterface public synchronized String info(boolean candidate) {
            try (DataInputStream in = new DataInputStream(file(candidate).openRead())) { return header(in).toString(); }
            catch (Exception absent) { return "null"; }
        }
        synchronized byte[] readData(boolean candidate) throws IOException {
            try (DataInputStream in = new DataInputStream(file(candidate).openRead())) {
                JSONObject meta = header(in); byte[] data = new byte[meta.getInt("bytes")]; in.readFully(data);
                if (in.read() != -1) throw new IOException("Trailing bytes"); return data;
            } catch (java.io.FileNotFoundException absent) { return null; }
            catch (Exception invalid) { throw new IOException("Original file is incomplete", invalid); }
        }
        @JavascriptInterface public synchronized boolean accept(String expectedHash) {
            if (expectedHash == null || !expectedHash.matches("[a-f0-9]{64}")) return false;
            FileOutputStream output = null;
            try {
                String metadata = info(true); if (metadata.equals("null")) return false;
                JSONObject meta = new JSONObject(metadata); byte[] data = readData(true);
                if (!expectedHash.equals(meta.getString("sha256")) || !expectedHash.equals(digest(data))) return false;
                output = current.startWrite(); DataOutputStream record = new DataOutputStream(output);
                record.writeInt(0x4d474f31); record.writeUTF(meta.getString("name")); record.writeInt(data.length);
                record.writeUTF(expectedHash); record.write(data); record.flush(); current.finishWrite(output); pending.delete(); return true;
            } catch (Exception failed) { if (output != null) current.failWrite(output); return false; }
        }
        @JavascriptInterface public synchronized void discard() { pending.delete(); }
        @JavascriptInterface public void choose() {
            runOnUiThread(() -> {
                if (choosing || isFinishing()) return; choosing = true;
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT); pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("*/*"); pick.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { startActivityForResult(pick, IMPORT_ORIGINAL); }
                catch (Exception unavailable) { choosing = false; originalError("이 기기에서 파일 선택기를 열 수 없습니다."); }
            });
        }
        synchronized void receive(Uri uri) throws Exception {
            String name = "original.zip";
            try (Cursor cursor = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) name = cursor.getString(0);
            }
            if (name == null || name.length() > 180 || !(name.toLowerCase(java.util.Locale.ROOT).endsWith(".zip") || name.toLowerCase(java.util.Locale.ROOT).endsWith(".jar"))) throw new IOException("ZIP 또는 JAR 원본 파일을 선택해 주세요.");
            java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
            try (InputStream input = getContentResolver().openInputStream(uri)) {
                if (input == null) throw new IOException("선택한 파일을 읽지 못했습니다.");
                byte[] buffer = new byte[16384]; int count;
                while ((count = input.read(buffer)) != -1) { if (bytes.size() + count > MAX_ORIGINAL) throw new IOException("16MB 이하의 파일을 선택해 주세요."); bytes.write(buffer, 0, count); }
            }
            byte[] data = bytes.toByteArray(); if (data.length < 22) throw new IOException("파일이 비어 있거나 손상됐습니다.");
            FileOutputStream output = null;
            try { output = pending.startWrite(); DataOutputStream record = new DataOutputStream(output);
                record.writeInt(0x4d474f31); record.writeUTF(name); record.writeInt(data.length); record.writeUTF(digest(data)); record.write(data); record.flush(); pending.finishWrite(output);
            } catch (Exception failed) { if (output != null) pending.failWrite(output); throw failed; }
        }
    }
    private static String digest(byte[] bytes) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes); StringBuilder text = new StringBuilder();
        for (byte value : hash) text.append(String.format(java.util.Locale.ROOT, "%02x", value & 255)); return text.toString();
    }
    private void originalError(String message) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.MongyuOriginal && window.MongyuOriginal.importFailure(" + JSONObject.quote(message) + ")", null); });
    }
    @SuppressWarnings("deprecation")
    @Override protected void onActivityResult(int request, int result, Intent intent) {
        super.onActivityResult(request, result, intent);
        if (request != IMPORT_ORIGINAL) return;
        originalFiles.choosing = false;
        if (result != RESULT_OK || intent == null || intent.getData() == null) return;
        Uri uri = intent.getData();
        new Thread(() -> {
            try { originalFiles.receive(uri); runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.MongyuOriginal && window.MongyuOriginal.importCandidate()", null); }); }
            catch (Exception invalid) { originalError(invalid.getMessage() == null ? "파일을 읽지 못했습니다." : invalid.getMessage()); }
        }, "mongyu-original-import").start();
    }

    public static final class LocalStore {
        private final SharedPreferences data;
        LocalStore(SharedPreferences data) { this.data = data; }
        private static boolean owned(String key) {
            return key != null && key.length() <= 160 && key.matches("^(mongyu[.-]|quad-rift)[A-Za-z0-9._-]*$");
        }
        @JavascriptInterface public String read(String key) {
            return owned(key) ? data.getString(key, null) : null;
        }
        @JavascriptInterface public boolean write(String key, String value) {
            if (!owned(key) || value == null || value.length() > 262144) return false;
            Map<String, ?> existing = data.getAll();
            if (!existing.containsKey(key) && existing.size() >= 96) return false;
            long total = value.length() + 1;
            for (Map.Entry<String, ?> entry : existing.entrySet())
                if (!entry.getKey().equals(key) && entry.getValue() instanceof String) total += ((String)entry.getValue()).length();
            return total <= 2097152 && data.edit().putString(key, "v" + value).commit();
        }
        @JavascriptInterface public boolean remove(String key) {
            return owned(key) && (data.contains(key) || data.getAll().size() < 96)
                && data.edit().putString(key, "d").commit();
        }
    }

    private void showRecovery() {
        float density = getResources().getDisplayMetrics().density;
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        panel.setBackgroundColor(Color.rgb(10, 12, 18));
        panel.setPadding((int)(24*density), 0, (int)(24*density), 0);
        TextView message = new TextView(this);
        message.setText("잠시 숨을 고를게요");
        message.setTextColor(Color.rgb(255, 248, 222));
        message.setTextSize(21);
        panel.addView(message);
        Button retry = new Button(this);
        retry.setText("다시 열기");
        retry.setAllCaps(false);
        retry.setTextColor(Color.rgb(24, 18, 29));
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(Color.rgb(239, 212, 172));
        shape.setCornerRadius(32*density);
        retry.setBackground(shape);
        LinearLayout.LayoutParams button = new LinearLayout.LayoutParams((int)(168*density), (int)(54*density));
        button.topMargin = (int)(28*density);
        panel.addView(retry, button);
        retry.setOnClickListener(v -> { rendererFailures = 0; recreate(); });
        setContentView(panel);
        enterImmersive();
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putInt("rendererFailures", rendererFailures);
        super.onSaveInstanceState(state);
    }

    private void publishSafeInsets() {
        if (web == null) return;
        float density = getResources().getDisplayMetrics().density;
        String[] sides = {"left", "top", "right", "bottom"};
        int[] values = {safeLeft, safeTop, safeRight, safeBottom};
        StringBuilder script = new StringBuilder("(() => {const e=document.documentElement;if(!e)return;const s=e.style;");
        for (int i=0;i<4;i++) script.append("s.setProperty('--native-safe-").append(sides[i])
            .append("','").append((int)Math.ceil(values[i]/density)).append("px');");
        script.append("})()");
        web.evaluateJavascript(script.toString(), null);
    }
    @SuppressWarnings("deprecation")
    private void enterImmersive() {
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams params = getWindow().getAttributes();
            params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(params);
        }
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                controller.hide(WindowInsets.Type.systemBars());
            }
        } else getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) enterImmersive();
    }

    private static Map<String, String> contentHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        headers.put("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; media-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
        return headers;
    }
    private static WebResourceResponse response(int status, String reason, String message) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason, Collections.emptyMap(),
            new ByteArrayInputStream(message.getBytes(StandardCharsets.UTF_8)));
    }
    private void gameBack() {
        if (web == null) { moveTaskToBack(true); return; }
        web.evaluateJavascript("(() => { const app = window.QUAD_RIFT_APP; if (!app) return false; const handled = app.back(); app.suspend(); return handled; })()", handled -> {
            // Home/uninitialized app must not trap system back. Backgrounding preserves state.
            if (!"true".equals(handled) && !isFinishing()) moveTaskToBack(true);
        });
    }
    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() { gameBack(); }
    @Override protected void onPause() {
        if (web != null) {
            web.evaluateJavascript("window.QUAD_RIFT_APP && window.QUAD_RIFT_APP.suspend()", null);
            web.onPause();
            web.pauseTimers();
        }
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (web != null) { web.resumeTimers(); web.onResume(); }
        // Never resume the run or audio without an explicit user gesture.
    }
    @Override protected void onDestroy() {
        if (web != null) { ((FrameLayout) web.getParent()).removeView(web); web.destroy(); web = null; }
        super.onDestroy();
    }
}
