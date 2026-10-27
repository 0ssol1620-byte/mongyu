package org.quadrift.hddevelopment;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.graphics.Insets;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.window.OnBackInvokedDispatcher;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/** Offline-only host. No JavaScript-to-native bridge and no external intent navigation. */
public final class MainActivity extends Activity {
    private static final String GAME_URL = "https://appassets.androidplatform.net/index.html";
    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(10, 12, 18));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(10, 12, 18));
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        // Consume system/cutout/IME insets at the native boundary; HTML receives a safe viewport.
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                v.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return WindowInsets.CONSUMED;
            }
            return insets; // API 26–29 decor fits system windows by default.
        });
        root.requestApplyInsets();
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
        CookieManager.getInstance().setAcceptCookie(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !GAME_URL.equals(request.getUrl().toString());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if ("GET".equals(request.getMethod()) && GAME_URL.equals(request.getUrl().toString())) {
                    try {
                        return new WebResourceResponse("text/html", "UTF-8", 200, "OK",
                            contentHeaders(), getAssets().open("index.html"));
                    } catch (IOException missing) {
                        return response(500, "Missing asset", "Game assets are missing. Rebuild this package.");
                    }
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

    private static Map<String, String> contentHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        headers.put("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
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
