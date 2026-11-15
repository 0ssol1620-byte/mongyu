/* @ts-self-types="./wie_web.d.ts" */

/**
 * A running emulator instance, owned by JS for the lifetime of one loaded app.
 */
export class WieEmulator {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WieEmulatorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wieemulator_free(ptr, 0);
    }
    /**
     * The play speed actually achieved over the last 2s; at most `speed()`. See `AchievedSpeed`.
     * @returns {number}
     */
    achieved_speed() {
        const ret = wasm.wieemulator_achieved_speed(this.__wbg_ptr);
        return ret;
    }
    /**
     * Snapshot the in-memory save filesystem as a plain JS object
     * (`{ "aidpath": Uint8Array }`) for the JS layer to persist in
     * IndexedDB. Game files are never in this store.
     * @returns {object}
     */
    export_fs() {
        const ret = wasm.wieemulator_export_fs(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Export ALL save state — both the RMS database records and the save
     * filesystem — as one opaque binary blob (`WIESAV01`). Unlike `export_fs`,
     * this also captures RMS records, so titles that persist via the record
     * store keep their progress. The blob is what the JS layer stores in
     * IndexedDB and (base64-encoded) syncs to the server as opaque save bytes —
     * the server never learns which game it belongs to.
     * @returns {Uint8Array}
     */
    export_saves() {
        const ret = wasm.wieemulator_export_saves(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * True once the emulator core requested a NORMAL shutdown (the
     * "[wie] emulator requested exit" path, e.g. WIPI `MC_knlExit`). Sticky:
     * once true it stays true for the lifetime of this instance.
     *
     * This is how JS distinguishes a clean exit (flag flips true, `tick` keeps
     * resolving as a no-op) from a failure (`tick` throws). Save state remains
     * readable after the flip — poll this after each `tick` and, when true,
     * persist via `export_saves` before tearing the instance down.
     * @returns {boolean}
     */
    has_exited() {
        const ret = wasm.wieemulator_has_exited(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * True once any save data exists, so JS knows whether to persist.
     * @returns {boolean}
     */
    has_saves() {
        const ret = wasm.wieemulator_has_saves(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Restore a previously exported save snapshot. Replaces the current store.
     * @param {object} snapshot
     */
    import_fs(snapshot) {
        const ret = wasm.wieemulator_import_fs(this.__wbg_ptr, snapshot);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Restore an opaque blob produced by `export_saves`, replacing the current
     * save state. A malformed/empty blob is ignored (returns `false`).
     * @param {Uint8Array} blob
     * @returns {boolean}
     */
    import_saves(blob) {
        const ptr0 = passArray8ToWasm0(blob, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wieemulator_import_saves(this.__wbg_ptr, ptr0, len0);
        return ret !== 0;
    }
    /**
     * @param {string} code
     */
    key_down(code) {
        const ptr0 = passStringToWasm0(code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.wieemulator_key_down(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} code
     */
    key_repeat(code) {
        const ptr0 = passStringToWasm0(code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.wieemulator_key_repeat(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} code
     */
    key_up(code) {
        const ptr0 = passStringToWasm0(code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.wieemulator_key_up(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * For an LGT title, the statically-detected compile model — `"clet"`
     * (WIPI-C) or `"aot-java"` (AOT-compiled Java). Returns `null` for every
     * non-LGT platform (KTF / SKT / J2ME), where the notion does not apply.
     *
     * Detected once at construction from the app's own import thunks (read-only,
     * no execution) and never changes for this instance. Because it is set in
     * the constructor it is valid immediately — a shell can call it right after
     * `new WieEmulator(...)` succeeds, before the first `tick()`.
     *
     * **This getter reports how the app was compiled. It does not report whether
     * wie can render it, and it never could** — an earlier revision of this doc
     * said `"aot-java"` "boots but does not yet render (the §7 wall)" and
     * recommended blocking the whole model at upload. That recommendation rested
     * on a 2026-07 sweep whose premise upstream `cc652b1d` (2026-08-04, "Implement
     * LGT Java AOT runtime") superseded. Re-measured 2026-09-21 over the local
     * corpus's 24 AOT-Java files (18 unique): **3 render** — `메이플스토리2007`
     * reaches its title screen and in-game intro, `현영맞고2006` its title screen,
     * `놈3` its splash — while the other 15 die at *boot*, before anything a
     * render path could reach. So the model is not a rendering predicate in
     * either direction. A shell that wants a runnability denylist owns it
     * per-title; see `docs/lgt.md` §7 and `docs/project-kb/02_status.md`.
     * @returns {string | undefined}
     */
    lgt_compile_model() {
        const ret = wasm.wieemulator_lgt_compile_model(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Construct an emulator from an uploaded file.
     *
     * * `filename` — the original name (its extension picks the loader).
     * * `data` — the raw file bytes (kept entirely in wasm memory).
     * * `canvas` — the `<canvas>` the framebuffer is blitted onto.
     * * `audio_ctx` — an already-resumed `AudioContext`, or `null` for silence.
     * * `width` / `height` — emulator screen size (240×320 is the usual default).
     * * `soundfont_url` — optional sf2/sf3 the audio sink fetches in the background from boot.
     *   Every MIDI play of the session renders through it, the first included (a play waits for it,
     *   bounded); if it fails or is too late, the whole session is FM. Omitted (or a build without
     *   the soundfont prelude) = the built-in FM synth only, the pre-soundfont behaviour.
     * @param {string} filename
     * @param {Uint8Array} data
     * @param {HTMLCanvasElement} canvas
     * @param {AudioContext | null | undefined} audio_ctx
     * @param {GainNode | null | undefined} gain
     * @param {number} width
     * @param {number} height
     * @param {string | null} [soundfont_url]
     */
    constructor(filename, data, canvas, audio_ctx, gain, width, height, soundfont_url) {
        const ptr0 = passStringToWasm0(filename, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(soundfont_url) ? 0 : passStringToWasm0(soundfont_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len2 = WASM_VECTOR_LEN;
        const ret = wasm.wieemulator_new(ptr0, len0, ptr1, len1, canvas, isLikeNone(audio_ctx) ? 0 : addToExternrefTable0(audio_ctx), isLikeNone(gain) ? 0 : addToExternrefTable0(gain), width, height, ptr2, len2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WieEmulatorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * The detected emulator backend ("KTF" / "LGT" / "SKT" / "J2ME"). A runtime
     * label for error diagnostics only — NOT game-file identity, never sent out.
     * @returns {string}
     */
    platform_kind() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wieemulator_platform_kind(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Set the play speed: the game runs `speed` times as fast as real time. Continuous in
     * `[1.0, 2.0]` (not quantized); values outside are clamped, NaN and infinities are 1.0.
     * Returns the speed applied. Every guest timer follows (sleeps, WIPI/MIDP timers, the clock a
     * game reads); changing it mid-game never makes the guest clock jump or run backwards. Each
     * tick still takes the same wall-clock slice of the frame, so where the CPU cannot keep up the
     * game runs as fast as it can. Audio pitch and tempo are not changed.
     * @param {number} speed
     * @returns {number}
     */
    set_speed(speed) {
        const ret = wasm.wieemulator_set_speed(this.__wbg_ptr, speed);
        return ret;
    }
    /**
     * The current play speed (1.0 until `set_speed` is called).
     * @returns {number}
     */
    speed() {
        const ret = wasm.wieemulator_speed(this.__wbg_ptr);
        return ret;
    }
    /**
     * Advance the emulator one tick. Call this from `requestAnimationFrame`.
     *
     * We deliver `Event::Redraw` (which drives the actual blit) ONLY when the
     * core asked for it via `Screen::request_redraw` — i.e. after it finished a
     * frame. Forcing a redraw every animation frame could blit a half-composed
     * framebuffer and made some titles flicker.
     *
     * Once [`has_exited`](Self::has_exited) is true this is a safe no-op that
     * returns `Ok(())` — the core is never advanced past its requested exit, so
     * a render loop that keeps firing before JS observes the flag cannot crash.
     */
    tick() {
        const ret = wasm.wieemulator_tick(this.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) WieEmulator.prototype[Symbol.dispose] = WieEmulator.prototype.free;

/**
 * Installs a panic hook that surfaces Rust panics in the browser console.
 */
export function init() {
    wasm.init();
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_0095a73b8b156f76: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_number_get_8ff4255516ccad3e: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_72fb696202c56729: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_addModule_98240fe49ea8f5d2: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.addModule(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_arrayBuffer_bb54076166006c39: function() { return handleError(function (arg0) {
            const ret = arg0.arrayBuffer();
            return ret;
        }, arguments); },
        __wbg_audioWorklet_d1e617c89bbeed11: function() { return handleError(function (arg0) {
            const ret = arg0.audioWorklet;
            return ret;
        }, arguments); },
        __wbg_call_389efe28435a9388: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_4708e0c13bdc8e95: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_canvas_415dfbf1f8c8a52d: function(arg0) {
            const ret = arg0.canvas;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_connect_aba749effbe588ea: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.connect(arg1);
            return ret;
        }, arguments); },
        __wbg_copyToChannel_4bfc91363fcbe558: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.copyToChannel(getArrayF32FromWasm0(arg1, arg2), arg3);
        }, arguments); },
        __wbg_createBufferSource_1254cd048e6c0593: function() { return handleError(function (arg0) {
            const ret = arg0.createBufferSource();
            return ret;
        }, arguments); },
        __wbg_createBuffer_36fe5fb1d9f77b9d: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.createBuffer(arg1 >>> 0, arg2 >>> 0, arg3);
            return ret;
        }, arguments); },
        __wbg_createElement_49f60fdcaae809c8: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.createElement(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_createObjectURL_918185db6a10a0c8: function() { return handleError(function (arg0, arg1) {
            const ret = URL.createObjectURL(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_currentTime_6c7288048dba47fa: function(arg0) {
            const ret = arg0.currentTime;
            return ret;
        },
        __wbg_data_5330da50312d0bc1: function(arg0) {
            const ret = arg0.data;
            return ret;
        },
        __wbg_destination_a97dbc327ce97191: function(arg0) {
            const ret = arg0.destination;
            return ret;
        },
        __wbg_disconnect_7c1278d939bc7bb9: function() { return handleError(function (arg0) {
            arg0.disconnect();
        }, arguments); },
        __wbg_drawImage_8fd92dab0320a117: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.drawImage(arg1, arg2, arg3);
        }, arguments); },
        __wbg_error_7534b8e9a36f1ab4: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_fetch_4f06ca81d87798ba: function(arg0, arg1, arg2) {
            const ret = arg0.fetch(getStringFromWasm0(arg1, arg2));
            return ret;
        },
        __wbg_getContext_2a5764d48600bc43: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_get_9b94d73e6221f75c: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_b3ed3ad4be2bc8ac: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_CanvasRenderingContext2d_4bb052fd1c3d134d: function(arg0) {
            let result;
            try {
                result = arg0 instanceof CanvasRenderingContext2D;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_HtmlCanvasElement_3f2f6e1edb1c9792: function(arg0) {
            let result;
            try {
                result = arg0 instanceof HTMLCanvasElement;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Response_ee1d54d79ae41977: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Response;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_ed49b2db8df90359: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_keys_b50a709a76add04e: function(arg0) {
            const ret = Object.keys(arg0);
            return ret;
        },
        __wbg_length_32ed9a279acd054c: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_35a7bace40f36eac: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_log_6b5ca2e6124b2808: function(arg0) {
            console.log(arg0);
        },
        __wbg_navigator_43be698ba96fc088: function(arg0) {
            const ret = arg0.navigator;
            return ret;
        },
        __wbg_new_361308b2356cecd0: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_3eb36ae241fe6f44: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_8a6f238a6ece86ea: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_dd2b680c8bf6ae29: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_from_slice_a3d2629dc1826784: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_from_slice_b5d5e7773e9f2033: function(arg0, arg1) {
            const ret = new Int16Array(getArrayI16FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_no_args_1c7c842f08d00ebb: function(arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_with_options_060f52edd55c22af: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = new AudioWorkletNode(arg0, getStringFromWasm0(arg1, arg2), arg3);
            return ret;
        }, arguments); },
        __wbg_new_with_str_sequence_and_options_9b8b0bee99ec6b0f: function() { return handleError(function (arg0, arg1) {
            const ret = new Blob(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_new_with_u8_clamped_array_and_sh_0c0b789ceb2eab31: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = new ImageData(getClampedArrayU8FromWasm0(arg0, arg1), arg2 >>> 0, arg3 >>> 0);
            return ret;
        }, arguments); },
        __wbg_now_a3af9a2f4bbaa4d1: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_of_f915f7cd925b21a5: function(arg0) {
            const ret = Array.of(arg0);
            return ret;
        },
        __wbg_ok_87f537440a0acf85: function(arg0) {
            const ret = arg0.ok;
            return ret;
        },
        __wbg_ownerDocument_9347874c5cad87d7: function(arg0) {
            const ret = arg0.ownerDocument;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_port_766506d0fcb1fe8d: function() { return handleError(function (arg0) {
            const ret = arg0.port;
            return ret;
        }, arguments); },
        __wbg_postMessage_46eeeef39934b448: function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments); },
        __wbg_postMessage_82bcd6222195317e: function() { return handleError(function (arg0, arg1, arg2) {
            arg0.postMessage(arg1, arg2);
        }, arguments); },
        __wbg_prototypesetcall_bdcdcc5842e4d77d: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_8ffdcb2063340ba5: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_putImageData_78318465ad96c2c3: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.putImageData(arg1, arg2, arg3);
        }, arguments); },
        __wbg_revokeObjectURL_ba5712ef5af8bc9a: function() { return handleError(function (arg0, arg1) {
            URL.revokeObjectURL(getStringFromWasm0(arg0, arg1));
        }, arguments); },
        __wbg_set_6cb8631f80447a67: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_buffer_730f06ef4e703eef: function(arg0, arg1) {
            arg0.buffer = arg1;
        },
        __wbg_set_height_f21f985387070100: function(arg0, arg1) {
            arg0.height = arg1 >>> 0;
        },
        __wbg_set_number_of_inputs_4053b71cef5686ec: function(arg0, arg1) {
            arg0.numberOfInputs = arg1 >>> 0;
        },
        __wbg_set_number_of_outputs_172d545f6ddb5a14: function(arg0, arg1) {
            arg0.numberOfOutputs = arg1 >>> 0;
        },
        __wbg_set_onmessage_0e1ffb1c0d91d2ad: function(arg0, arg1) {
            arg0.onmessage = arg1;
        },
        __wbg_set_output_channel_count_9575b56ebde292b4: function(arg0, arg1) {
            arg0.outputChannelCount = arg1;
        },
        __wbg_set_type_148de20768639245: function(arg0, arg1, arg2) {
            arg0.type = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_width_d60bc4f2f20c56a4: function(arg0, arg1) {
            arg0.width = arg1 >>> 0;
        },
        __wbg_stack_0ed75d68575b0f3c: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_start_76c52471f3287ae0: function() { return handleError(function (arg0, arg1) {
            arg0.start(arg1);
        }, arguments); },
        __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_status_89d7e803db911ee7: function(arg0) {
            const ret = arg0.status;
            return ret;
        },
        __wbg_then_0d9fe2c7b1857d32: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_warn_f7ae1b2e66ccb930: function(arg0) {
            console.warn(arg0);
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 107, function: Function { arguments: [Externref], shim_idx: 108, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen_9a0194c6efb3e496___closure__destroy___dyn_core_37ee0ce0c4cd57d5___ops__function__FnMut__wasm_bindgen_9a0194c6efb3e496___JsValue____Output_______, wasm_bindgen_9a0194c6efb3e496___convert__closures_____invoke___wasm_bindgen_9a0194c6efb3e496___JsValue_____);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 107, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 108, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen_9a0194c6efb3e496___closure__destroy___dyn_core_37ee0ce0c4cd57d5___ops__function__FnMut__wasm_bindgen_9a0194c6efb3e496___JsValue____Output_______, wasm_bindgen_9a0194c6efb3e496___convert__closures_____invoke___wasm_bindgen_9a0194c6efb3e496___JsValue_____);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./wie_web_bg.js": import0,
    };
}

function wasm_bindgen_9a0194c6efb3e496___convert__closures_____invoke___wasm_bindgen_9a0194c6efb3e496___JsValue_____(arg0, arg1, arg2) {
    wasm.wasm_bindgen_9a0194c6efb3e496___convert__closures_____invoke___wasm_bindgen_9a0194c6efb3e496___JsValue_____(arg0, arg1, arg2);
}

const WieEmulatorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wieemulator_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => state.dtor(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayI16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getClampedArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ClampedArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

let cachedInt16ArrayMemory0 = null;
function getInt16ArrayMemory0() {
    if (cachedInt16ArrayMemory0 === null || cachedInt16ArrayMemory0.byteLength === 0) {
        cachedInt16ArrayMemory0 = new Int16Array(wasm.memory.buffer);
    }
    return cachedInt16ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedUint8ClampedArrayMemory0 = null;
function getUint8ClampedArrayMemory0() {
    if (cachedUint8ClampedArrayMemory0 === null || cachedUint8ClampedArrayMemory0.byteLength === 0) {
        cachedUint8ClampedArrayMemory0 = new Uint8ClampedArray(wasm.memory.buffer);
    }
    return cachedUint8ClampedArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedInt16ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    cachedUint8ClampedArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('wie_web_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
