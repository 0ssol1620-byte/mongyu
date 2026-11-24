#!/usr/bin/env python3
"""Audio pipeline for the Suno-made music beds: decode mp3, find a seamless bar-aligned loop, normalise, re-encode, write the manifest the
build embeds (web/assets/audio/manifest.json -> globalThis.MONGYU_EMBEDDED_AUDIO, R105 only).

  python tools/audio-pipeline.py build [--in DIR] [--only c1,c2] [--kbps 96]    decode -> loop -> loudness -> mp3 + manifest
  python tools/audio-pipeline.py verify                                          re-decode the shipped mp3s, check seams / loudness / hashes
  python tools/audio-pipeline.py list

Needs: pip install lameenc miniaudio numpy

Loop construction (all in seconds on the decoded 48 kHz buffer):
  1. trim leading/trailing near-silence (-50 dBFS windowed RMS);
  2. refine the nominal BPM (+-6 %) and the beat phase by comb-filtering a spectral-flux onset envelope;
  3. try every beat as a loop start, the loop is N whole bars long; score how well the continuation after the loop end matches the head
     (log-band spectra per beat, before and after the seam) and how even the loudness is; avoid intros and outros;
  4. body[0:X] = equal-power crossfade of the head audio[s:s+X] with the continuation audio[e:e+X] so body[L-1] -> body[0] is sample-continuous;
  5. file = [last PAD s of body | body | first PAD s of body]: the content is periodic over the padding, so whatever delay an mp3 decoder
     adds (LAME 576 + decoder 529 samples, some decoders trim it, some do not) a loop of length L starting anywhere inside the padding is still seamless.
     Runtime loops loopStart..loopEnd = PAD..PAD+L with AudioBufferSourceNode.loopStart/loopEnd;
  6. K-weighted integrated loudness (BS.1770, own estimate) to -18 LUFS-I, sample peak <= -1 dBFS (iterated on the *decoded* mp3).
"""
import argparse, hashlib, json, sys, time
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'web' / 'assets' / 'audio'
MANIFEST = OUT / 'manifest.json'
DEFAULT_IN = Path('D:/claude_test/mongyu/audio-in')
SR = 48000
PAD = 0.1           # seconds of periodic padding on each side of the loop body
TARGET_LUFS = -18.0
PEAK_CEIL = -1.0    # dBFS
NOTE = 'AI-generated with Suno Pro plan; verify commercial terms before store release'
# id: title, nominal bpm, bars of the loop body, optional kbps override
TRACKS = {
    # id: title, nominal bpm, bars of the loop body (beats = beats per bar, default 4), kbps (default 96),
    # window = Suno's suggested loop range in source seconds, intro = seconds of lead-in played once before the loop,
    # outro = seconds cut from the end of the source (boss clear)
    'c1': dict(title='열린 정원', bpm=96, bars=16),
    'c2': dict(title='오래된 그네', bpm=88, bars=16),
    'c3': dict(title='건축 허가', bpm=120, bars=20),
    'c4': dict(title='한 박자 늦은 나', bpm=100, bars=16),
    'c5': dict(title='없는 층', bpm=76, bars=12),
    'c8': dict(title='색채의 박동', bpm=138, bars=24),
    'title': dict(title='빈 사각형', bpm=72, bars=12),
    'fever': dict(title='열기 층', bpm=138, bars=8),
    'c6': dict(title='눈치', bpm=92, bars=16, kbps=80, window=(49, 113), intro=10),
    'c7': dict(title='녹는 계단', bpm=125, bars=20, kbps=80, window=(31, 93), intro=8),
    'c9': dict(title='한 칸의 밤', bpm=71, bars=12, kbps=80, window=(53.3, 160), intro=10),
    'c10': dict(title='두 사람의 발걸음', bpm=96.5, bars=16, kbps=80, window=(42.7, 122.2), intro=10),
    'story': dict(title='아무 말도', bpm=66, bars=12, kbps=80, window=(34, 95)),
    'menu': dict(title='작은 박물관·꿈 일기', bpm=80, bars=16, kbps=80, window=(38, 114)),
    'boss1': dict(title='큐브의 왈츠', bpm=106, bars=24, beats=3, kbps=80, window=(36.2, 96), intro=6, outro=7),
    'boss2': dict(title='건전지 왕', bpm=110, bars=20, kbps=80, window=(10, 96), intro=6, outro=7),
    'boss3': dict(title='접히는 도시', bpm=134, bars=28, kbps=80, window=(43.5, 101), intro=5, outro=6),
    'boss4': dict(title='거울의 듀엣', bpm=111.7, bars=20, kbps=80, window=(8.6, 102.9), intro=6, outro=7),
    'boss5': dict(title='출구가 없다', bpm=97, bars=16, kbps=80, intro=6, outro=7),
}
# one-shot effects: wav -> trimmed, faded, peak -3 dBFS, mp3. max = longest kept (s), fade = fade-out (s)
SFX = {
    'gate-clear': dict(max=2.6, fade=.25),
    'star': dict(max=3.2, fade=.3),
    'portal': dict(max=2.5, fade=.6),
    'recover': dict(max=2.0, fade=.5),
    'unlock': dict(max=3.0, fade=.5),
    'discovery': dict(max=4.0, fade=.4),
}


def digest(b):
    return hashlib.sha256(b).hexdigest()


# ------------------------------------------------------------------ decode / encode
def decode(path):
    import miniaudio
    d = miniaudio.decode_file(str(path), output_format=miniaudio.SampleFormat.FLOAT32, nchannels=2, sample_rate=SR)
    x = np.frombuffer(d.samples, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    return x


def decode_bytes(data, channels=2):
    import miniaudio
    d = miniaudio.decode(data, output_format=miniaudio.SampleFormat.FLOAT32, nchannels=channels, sample_rate=SR)
    return np.frombuffer(d.samples, dtype=np.float32).reshape(-1, channels).astype(np.float64)


def decode_wav(path):
    return decode(path)


def encode(x, kbps, channels=2):
    import lameenc
    e = lameenc.Encoder()
    e.set_bit_rate(kbps); e.set_in_sample_rate(SR); e.set_out_sample_rate(SR); e.set_channels(channels); e.set_quality(2)
    pcm = (np.clip(x, -1, 1) * 32767.0).round().astype('<i2')
    return bytes(e.encode(pcm.tobytes())) + bytes(e.flush())


# ------------------------------------------------------------------ loudness (ITU-R BS.1770-4 at 48 kHz, K-weighting applied in the FFT domain)
_SHELF = ([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585])
_HP = ([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621])


def _resp(b, a, n):
    w = np.linspace(0, np.pi, n)
    z = np.exp(-1j * w)
    return (b[0] + b[1] * z + b[2] * z * z) / (a[0] + a[1] * z + a[2] * z * z)


def k_weight(x):
    n = x.shape[0]
    nf = n // 2 + 1
    h = np.abs(_resp(*_SHELF, nf) * _resp(*_HP, nf))
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c]) * h, n) for c in range(x.shape[1])], axis=1)


def lufs_integrated(x):
    y = k_weight(x)
    blk, hop = int(.4 * SR), int(.1 * SR)
    if y.shape[0] < blk:
        return -70.0
    cs = np.vstack([np.zeros((1, y.shape[1])), np.cumsum(y * y, axis=0)])
    starts = np.arange(0, y.shape[0] - blk + 1, hop)
    z = ((cs[starts + blk] - cs[starts]) / blk).sum(axis=1)  # channel weights are all 1 for L/R
    l = -0.691 + 10 * np.log10(np.maximum(z, 1e-12))
    keep = l > -70
    if not keep.any():
        return -70.0
    rel = -0.691 + 10 * np.log10(z[keep].mean()) - 10
    keep &= l > rel
    return float(-0.691 + 10 * np.log10(z[keep].mean())) if keep.any() else -70.0


def peak_db(x, oversample=4):
    """Sample peak and approximate true peak (4x FFT oversampling), in dBFS."""
    sp = float(np.abs(x).max())
    tp = 0.0
    for c in range(x.shape[1]):
        n = x.shape[0]
        X = np.fft.rfft(x[:, c])
        Y = np.zeros(n * oversample // 2 + 1, dtype=complex)
        Y[:X.shape[0]] = X
        tp = max(tp, float(np.abs(np.fft.irfft(Y, n * oversample)).max()) * oversample)
    db = lambda v: -200.0 if v <= 0 else 20 * np.log10(v)
    return db(sp), db(tp)


# ------------------------------------------------------------------ analysis
def trim_silence(x, thresh_db=-50.0, win=0.05):
    w = int(win * SR)
    n = x.shape[0] // w
    rms = np.sqrt((x[:n * w] ** 2).mean(axis=1).reshape(n, w).mean(axis=1) + 1e-20)
    ok = np.where(20 * np.log10(rms + 1e-12) > thresh_db)[0]
    if not len(ok):
        return 0, x.shape[0]
    return int(ok[0] * w), int(min(x.shape[0], (ok[-1] + 1) * w))


HOP, WIN = 256, 1024
_EDGES = np.unique(np.round(np.geomspace(40, 12000, 33) / (SR / WIN)).astype(int))


def stft_mag(m):
    n = 1 + (len(m) - WIN) // HOP
    idx = np.arange(WIN)[None, :] + HOP * np.arange(n)[:, None]
    return np.abs(np.fft.rfft(m[idx] * np.hanning(WIN)[None, :], axis=1))


def band_logspec(mag):
    cs = np.concatenate([np.zeros((mag.shape[0], 1)), np.cumsum(mag, axis=1)], axis=1)
    b = cs[:, _EDGES[1:]] - cs[:, _EDGES[:-1]]
    return np.log1p(b * 4.0)


def onset_env(mag):
    ls = band_logspec(mag)
    flux = np.maximum(0, np.diff(ls, axis=0)).sum(axis=1)
    flux = np.concatenate([[0.0], flux])
    k = 43
    loc = np.convolve(flux, np.ones(k) / k, mode='same')
    return np.maximum(0, flux - loc)


def refine_tempo(env, nominal, span=0.06, step=0.02):
    """Best (bpm, beat phase in seconds, strength) by comb-filtering the onset envelope; the phase is where the first beat falls."""
    best = (-1, nominal, 0.0)
    n = len(env)
    for bpm in np.arange(nominal * (1 - span), nominal * (1 + span) + 1e-9, step):
        p = 60.0 / bpm * SR / HOP
        ph = np.arange(0, p, 1.0)
        k = np.arange(int((n - 1 - p) / p))
        pos = ph[:, None] + k[None, :] * p
        i0 = np.floor(pos).astype(int)
        fr = pos - i0
        v = env[i0] * (1 - fr) + env[np.minimum(i0 + 1, n - 1)] * fr
        sc = v.mean(axis=1)
        j = int(sc.argmax())
        if sc[j] > best[0]:
            best = (float(sc[j]), float(bpm), float(ph[j] * HOP / SR))
    base = float(env.mean()) + 1e-9
    return best[1], best[2], best[0] / base


def beat_features(mag, t0, spb, beats):
    """Mean log-band spectrum of each beat window [t0+k*spb, +spb) (k in beats), rows of unit length."""
    ls = band_logspec(mag)
    out = []
    for k in beats:
        a = int((t0 + k * spb) * SR / HOP)
        b = max(a + 1, int((t0 + (k + 1) * spb) * SR / HOP))
        a = max(0, min(a, ls.shape[0] - 1)); b = min(b, ls.shape[0])
        v = ls[a:b].mean(axis=0) if b > a else ls[a]
        v = v - v.mean()
        out.append(v / (np.linalg.norm(v) + 1e-9))
    return np.array(out)


def frame_rms_db(m, t, win=0.4):
    a = int(max(0, t) * SR); b = int(min(len(m), (t + win) * SR))
    return 10 * np.log10((m[a:b] ** 2).mean() + 1e-12) if b > a else -120.0


def choose_loop(x, bpm, bars, beats, window, intro_s, lead, log):
    """x is the silence-trimmed buffer (its time 0 is `lead` seconds into the source). Returns the loop description in seconds relative to x.
    window=(a,b) in *source* seconds restricts the loop start and the end of the continuation to Suno's suggested range (+-1.5 s)."""
    m = x.mean(axis=1)
    mag = stft_mag(m)
    env = onset_env(mag)
    rbpm, phase, strength = refine_tempo(env, bpm, span=0.06 if beats == 4 else 0.08)
    spb = 60.0 / rbpm
    bar = beats * spb
    X = bar if bar >= 1.9 else 2 * bar
    dur = len(m) / SR
    L = bars * bar
    nb = int(round(X / spb))
    nbeat_total = int((dur - phase) / spb)
    allb = np.arange(0, nbeat_total)
    feats = beat_features(mag, phase, spb, allb)
    lbeats = bars * beats
    ibeats = int(round(intro_s / spb)) if intro_s else 0
    lo, hi = (0.0, dur) if not window else (window[0] - lead - 1.5, window[1] - lead + 1.5)
    rms_med = np.median([frame_rms_db(m, phase + k * spb) for k in range(0, nbeat_total, 4)])
    cands = []
    for k in range(0, nbeat_total):
        s = phase + k * spb
        e = k + lbeats
        if e + nb > len(allb) or k - max(nb, ibeats) < 0:
            continue
        if s < lo or phase + (e + nb) * spb > hi or phase + (e + nb) * spb > dur - 0.5 * bar:
            continue
        # similarity: continuation vs head, and the context before the loop end vs before the loop start
        post = (feats[e:e + nb] * feats[k:k + nb]).sum(axis=1).mean()
        pre = (feats[e - nb:e] * feats[k - nb:k]).sum(axis=1).mean()
        lh = np.mean([frame_rms_db(m, phase + (k + j) * spb, spb) for j in range(nb)])
        le = np.mean([frame_rms_db(m, phase + (e + j) * spb, spb) for j in range(nb)])
        lbody = np.mean([frame_rms_db(m, phase + (k + j) * spb, bar) for j in range(0, lbeats, beats)])
        pen = abs(lh - le) * 0.03 + max(0.0, rms_med - lbody) * 0.05
        intro = 0.08 if (not window and s < 2 * bar) else 0.0
        cands.append((0.6 * post + 0.4 * pre - pen - intro, int(k), float(post), float(pre), float(lh - le)))
    if not cands:
        raise SystemExit('no loop candidate for %d bars at %.2f BPM (window %s)' % (bars, rbpm, window))
    cands.sort(reverse=True)
    sc, k, post, pre, dl = cands[0]
    log('  tempo %.2f BPM (nominal %g, %d/4) phase %.3fs comb x%.2f | loop start beat %d (source %.2fs) post-sim %.2f pre-sim %.2f level diff %.1f dB'
        % (rbpm, bpm, beats, phase, strength, k, lead + phase + k * spb, post, pre, dl))
    s = phase + k * spb
    # micro-alignment: shift the loop end (at most +-8 onset frames, about 43 ms) when that makes the continuation's onsets line up with the head's
    fr = SR / HOP
    i0, i1, n = int(s * fr), int((s + L) * fr), int(X * fr)
    A = env[i0:i0 + n] - env[i0:i0 + n].mean()

    def corr(lag):
        B = env[i1 + lag:i1 + lag + n]; B = B - B.mean()
        return float(np.dot(A, B) / (np.linalg.norm(A) * np.linalg.norm(B) + 1e-9))
    lags = [(corr(l), l) for l in range(-8, 9) if i1 + l + n <= len(env)]
    c0 = corr(0)
    cb, lb = max(lags)
    shift = 0
    if lb != 0 and cb > c0 + 0.1:
        shift = lb * HOP
        log('  micro-align loop end by %+d samples (%.1f ms): onset corr %.2f -> %.2f' % (shift, 1000.0 * shift / SR, c0, cb))
    return dict(s=s, L=L + shift / SR, X=X, bpm=rbpm, spb=spb, bar=bar, bars=bars, beats=beats, score=float(sc), post=post, pre=pre, strength=float(strength),
                shift=shift, introBeats=ibeats)


def make_body(x, ch):
    """Sample-continuous periodic loop body. The tail of the body is an equal-power crossfade from the loop's own last X seconds into the X seconds
    that precede the loop start, so body[-1] -> body[0] is continuous AND audio played before the loop (an intro) runs straight into body[0]."""
    s = int(round(ch['s'] * SR))
    L = int(round(ch['L'] * SR))
    X = int(round(ch['X'] * SR))
    body = x[s:s + L].copy()
    t = np.arange(X) / X
    fin, fout = np.sin(t * np.pi / 2)[:, None], np.cos(t * np.pi / 2)[:, None]
    body[L - X:] = x[s + L - X:s + L] * fout + x[s - X:s] * fin
    return body


def with_padding(body):
    p = int(PAD * SR)
    return np.concatenate([body[-p:], body, body[:p]], axis=0)


def seam_report(loop, start, end):
    """Largest jump across the loop point compared with the same signal's normal sample-to-sample change. Returns (jump, p99.9 step, ratio)."""
    seg = np.concatenate([loop[end - 64:end], loop[start:start + 64]], axis=0)
    d = np.abs(np.diff(seg, axis=0))
    jump = float(d[63].max())
    ref = np.abs(np.diff(loop[start:end:3], axis=0))
    p999 = float(np.percentile(ref, 99.9)) + 1e-9
    return jump, p999, jump / p999


def estimate_delay(ref, dec, maxlag=2500):
    """Lag (samples) of dec relative to ref by cross-correlating a 2 s excerpt of the first channel taken from the middle."""
    n = 2 * SR
    a0 = max(maxlag, len(ref) // 2 - n // 2)
    a = ref[a0:a0 + n, 0]
    best, lag = -1e30, 0
    for l in range(0, maxlag):
        c = float(np.dot(a, dec[a0 + l:a0 + l + n, 0]))
        if c > best:
            best, lag = c, l
    return lag


KEY_MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KEY_MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
PC_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']


def estimate_key(body):
    """Krumhansl-Schmuckler key estimate from a long-window chroma (80-2000 Hz). An estimate: the tonal centre of AI audio is not guaranteed."""
    m = body.mean(axis=1)
    n = 8192
    fr = np.abs(np.fft.rfft(m[:len(m) // n * n].reshape(-1, n) * np.hanning(n), axis=1))
    f = np.arange(fr.shape[1]) * SR / n
    sel = (f > 80) & (f < 2000)
    pc = (np.round(12 * np.log2(f[sel] / 440.0)).astype(int) + 9) % 12
    chroma = np.zeros(12)
    frs = fr[:, sel]
    for c in range(12):
        chroma[c] = (frs[:, pc == c] ** 2).sum()
    chroma = np.sqrt(chroma)
    best = (-2.0, 0, 'major')
    for tonic in range(12):
        for prof, mode in ((KEY_MAJ, 'major'), (KEY_MIN, 'minor')):
            r = np.corrcoef(np.roll(prof, tonic), chroma)[0, 1]
            if r > best[0]:
                best = (float(r), tonic, mode)
    return best


# ------------------------------------------------------------------ commands
def fit_gain(pcm, kbps, channels, measure, gain_db, peak_ceil=PEAK_CEIL, target=TARGET_LUFS, fixed=False):
    """Encode pcm at gain_db; iterate until the *decoded* mp3 has measure(dec, lag) LUFS near target (unless fixed) and the peak is under peak_ceil."""
    for attempt in range(7):
        g = 10 ** (gain_db / 20)
        data = encode(pcm * g, kbps, channels)
        dec = decode_bytes(data, channels)
        sp, tp = peak_db(dec[:len(pcm) + 4000])
        lag = estimate_delay(pcm * g if channels == 2 else np.repeat(pcm * g, 2, axis=1), dec if channels == 2 else np.repeat(dec, 2, axis=1)) if len(pcm) > 6 * SR else 0
        dl = measure(dec, lag)
        if sp > peak_ceil or tp > peak_ceil + 0.5:
            gain_db -= max(0.3, sp - peak_ceil + 0.1)
        elif not fixed and abs(dl - target) > 0.15 and attempt < 3:
            gain_db += target - dl
        else:
            break
    return data, dec, lag, gain_db, dl, sp, tp


def build_one(tid, src, log):
    cfg = TRACKS[tid]
    kbps = cfg.get('kbps', 96)
    log('[%s] %s  (%s, %d kbps)' % (tid, cfg['title'], src.name, kbps))
    x = decode(src)
    a, b = trim_silence(x)
    log('  decoded %.2fs, trimmed to %.2f..%.2fs' % (len(x) / SR, a / SR, b / SR))
    xt = x[a:b]
    ch = choose_loop(xt, cfg['bpm'], cfg['bars'], cfg.get('beats', 4), cfg.get('window'), cfg.get('intro', 0), a / SR, log)
    body = make_body(xt, ch)
    L = len(body)
    pad = int(PAD * SR)
    s = int(round(ch['s'] * SR))
    intro_n = int(round(ch['introBeats'] * ch['spb'] * SR)) if ch['introBeats'] else 0
    if intro_n:
        intro = xt[s - intro_n:s].copy()
        fade = int(.004 * SR)
        intro[:fade] *= np.linspace(0, 1, fade)[:, None]
        file_pcm = np.concatenate([intro, body, body[:pad]], axis=0)
        ls, le = intro_n, intro_n + L
        kind = 'intro-loop'
    else:
        file_pcm = with_padding(body)
        ls, le = pad, pad + L
        kind = 'loop'
    j, ref, ratio = seam_report(file_pcm, ls, le)
    log('  %s: %s%.3fs loop (%d x %d/4 bars), pre-encode seam jump %.5f (p99.9 step %.5f, x%.2f)'
        % (kind, ('%.2fs intro + ' % (intro_n / SR)) if intro_n else '', L / SR, ch['bars'], ch['beats'], j, ref, ratio))
    lufs0 = lufs_integrated(body)
    measure = lambda dec, lag: lufs_integrated(dec[lag + ls:lag + ls + L])
    data, dec, lag, gain_db, dlufs, sp, tp = fit_gain(file_pcm, kbps, 2, measure, TARGET_LUFS - lufs0)
    seam = seam_report(dec[lag:], ls, le)
    key = estimate_key(body)
    log('  gain %+.1f dB -> %.1f LUFS-I (decoded mp3), peak %.2f dBFS sample / %.2f approx true, mp3 %d bytes, decoder delay %d samples, decoded seam x%.2f, key %s %s (r=%.2f)'
        % (gain_db, dlufs, sp, tp, len(data), lag, seam[2], PC_NAMES[key[1]], key[2], key[0]))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / (tid + '.mp3')).write_bytes(data)
    entries = {tid: {
        'id': tid, 'title': cfg['title'], 'kind': kind, 'file': tid + '.mp3', 'mime': 'audio/mpeg', 'bpm': round(ch['bpm'], 3), 'nominalBpm': cfg['bpm'],
        'bars': ch['bars'], 'beatsPerBar': ch['beats'], 'loopSeconds': round(L / SR, 4), 'alignShiftSamples': ch['shift'],
        'loopStart': round(ls / SR, 4), 'loopEnd': round(le / SR, 4), 'introEnd': round(intro_n / SR, 4), 'padding': PAD,
        'sourceOffset': round(a / SR + ch['s'], 3), 'crossfade': round(ch['X'], 3), 'durationSec': round(len(file_pcm) / SR, 3),
        'kbps': kbps, 'channels': 2, 'sampleRate': SR, 'keyTonic': key[1], 'keyMode': key[2], 'keyConfidence': round(key[0], 3),
        'lufs': round(dlufs, 2), 'peak': round(sp, 2), 'bytes': len(data), 'sha256': digest(data), 'source': 'suno', 'note': NOTE}}
    if cfg.get('outro'):
        on = int(round(cfg['outro'] * SR))
        o = xt[-on:].copy()
        o[:int(.03 * SR)] *= np.linspace(0, 1, int(.03 * SR))[:, None]
        o[-int(.5 * SR):] *= np.linspace(1, 0, int(.5 * SR))[:, None]
        odata, odec, _, ogain, olufs, osp, otp = fit_gain(o, kbps, 2, lambda d, l: lufs_integrated(d), gain_db, fixed=True)
        oid = tid + '-outro'
        (OUT / (oid + '.mp3')).write_bytes(odata)
        log('  outro %.1fs from the end of the source: %d bytes, peak %.2f dBFS (same gain %+.1f dB)' % (len(o) / SR, len(odata), osp, ogain))
        entries[oid] = {'id': oid, 'title': cfg['title'] + ' (outro)', 'kind': 'outro', 'file': oid + '.mp3', 'mime': 'audio/mpeg', 'bpm': round(ch['bpm'], 3),
                        'durationSec': round(len(o) / SR, 3), 'kbps': kbps, 'channels': 2, 'sampleRate': SR, 'lufs': round(olufs, 2), 'peak': round(osp, 2),
                        'bytes': len(odata), 'sha256': digest(odata), 'source': 'suno', 'note': NOTE}
    return entries


def build_sfx(name, src, log):
    cfg = SFX[name]
    log('[sfx-%s] %s' % (name, src.name))
    full = decode_wav(src)
    a, b = trim_silence(full, thresh_db=-52.0, win=0.02)
    x = full[max(0, a - int(.01 * SR)):b]
    if len(x) > cfg['max'] * SR:
        x = x[:int(cfg['max'] * SR)]
    fi, fo = int(.004 * SR), int(cfg['fade'] * SR)
    x = x.copy()
    x[:fi] *= np.linspace(0, 1, fi)[:, None]
    x[-fo:] *= (np.linspace(1, 0, fo) ** 1.5)[:, None]
    ch = 1 if abs(np.corrcoef(x[:, 0], x[:, 1])[0, 1]) > .97 else 2
    pcm = x.mean(axis=1, keepdims=True) if ch == 1 else x
    kbps = cfg.get('kbps', 64 if ch == 1 else 80)
    gain_db = -3.0 - peak_db(pcm)[0]
    wide = lambda d: d if d.shape[1] == 2 else np.repeat(d, 2, axis=1)
    data, dec, lag, gain_db, dl, sp, tp = fit_gain(pcm, kbps, ch, lambda d, l: lufs_integrated(wide(d)), gain_db, peak_ceil=-2.6, fixed=True)
    log('  %.2fs (source %.2fs), %s, gain %+.1f dB, peak %.2f dBFS (decoded), %.1f LUFS-I, %d bytes' % (len(x) / SR, len(full) / SR, 'mono' if ch == 1 else 'stereo', gain_db, sp, dl, len(data)))
    OUT.mkdir(parents=True, exist_ok=True)
    tid = 'sfx-' + name
    (OUT / (tid + '.mp3')).write_bytes(data)
    return {tid: {'id': tid, 'title': name, 'kind': 'sfx', 'file': tid + '.mp3', 'mime': 'audio/mpeg', 'durationSec': round(len(x) / SR, 3), 'kbps': kbps,
                  'channels': ch, 'sampleRate': SR, 'lufs': round(dl, 2), 'peak': round(sp, 2), 'bytes': len(data), 'sha256': digest(data),
                  'source': 'suno', 'note': NOTE}}


def cmd_build(a):
    ids = a.only.split(',') if a.only else list(TRACKS) + ['sfx:' + n for n in SFX]
    src_dir = Path(a.input)
    old = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {'version': 2, 'tracks': {}}
    old['version'] = 2
    log = lambda s: print(s, flush=True)
    for tid in ids:
        t0 = time.time()
        if tid.startswith('sfx:'):
            old['tracks'].update(build_sfx(tid[4:], src_dir / 'sfx' / (tid[4:] + '.wav'), log))
        elif tid in TRACKS:
            old['tracks'].update(build_one(tid, src_dir / (tid + '.mp3'), log))
        else:
            raise SystemExit('unknown track ' + tid)
        log('  %.1fs' % (time.time() - t0))
    old['tracks'] = dict(sorted(old['tracks'].items()))
    old['totalBytes'] = sum(t['bytes'] for t in old['tracks'].values())
    OUT.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_bytes((json.dumps(old, indent=2, ensure_ascii=False) + '\n').encode('utf-8'))
    print('total %d bytes in %d files' % (old['totalBytes'], len(old['tracks'])))


def cmd_verify(a):
    m = json.loads(MANIFEST.read_text(encoding='utf-8'))
    bad = 0
    for tid, t in m['tracks'].items():
        data = (OUT / t['file']).read_bytes()
        ok = digest(data) == t['sha256'] and len(data) == t['bytes']
        dec = decode_bytes(data, t['channels'])
        sp, tp = peak_db(dec)
        if t['kind'] in ('loop', 'intro-loop'):
            ls = int(round(t['loopStart'] * SR)); L = int(round((t['loopEnd'] - t['loopStart']) * SR))
            seams = [seam_report(dec[l:], ls, ls + L)[2] for l in range(0, 1400, 140)]
            extra = 'loop %.3f..%.3f (%.2fs, %s) seam ratio max %.2f over lags 0..1400, LUFS %.1f' % (t['loopStart'], t['loopEnd'], t['loopEnd'] - t['loopStart'], t['kind'], max(seams), lufs_integrated(dec[1105 + ls:1105 + ls + L]))
            bad += max(seams) > 1.0
        else:
            extra = '%s %.2fs' % (t['kind'], len(dec) / SR)
        ceil = -2.5 if t['kind'] == 'sfx' else PEAK_CEIL
        print('%-14s sha %s  %7d bytes  peak %.2f dBFS  %s' % (tid, 'ok' if ok else 'MISMATCH', len(data), sp, extra))
        bad += (not ok) or sp > ceil + 0.01
    print('total %d bytes' % sum(t['bytes'] for t in m['tracks'].values()))
    sys.exit(1 if bad else 0)


def cmd_list(a):
    if not MANIFEST.exists():
        print('no manifest'); return
    for tid, t in json.loads(MANIFEST.read_text(encoding='utf-8'))['tracks'].items():
        print(tid, t['kind'], t.get('bpm'), t.get('bars'), t.get('loopStart'), t.get('loopEnd'), t['lufs'], t['peak'], t['bytes'])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build'); b.add_argument('--in', dest='input', default=str(DEFAULT_IN)); b.add_argument('--only', help='comma list of ids, sfx:<name> for one-shots'); b.set_defaults(fn=cmd_build)
    v = sub.add_parser('verify'); v.set_defaults(fn=cmd_verify)
    l = sub.add_parser('list'); l.set_defaults(fn=cmd_list)
    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
