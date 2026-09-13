/**
 * PanelProbe — UI sound effects (Web Audio synthesis, no audio files).
 * The AudioContext is created lazily on first use so browsers' autoplay
 * policies are respected.
 */
(function (DD) {
    'use strict';

    let ctx = null;
    let muted = DD.Storage.getBool('mute', false);

    function context() {
        if (ctx) return ctx;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        try {
            ctx = new Ctor();
        } catch (_) {
            ctx = null;
        }
        return ctx;
    }

    function tone(freq = 440, duration = 0.08, type = 'sine', volume = 0.05) {
        if (muted) return;
        const ac = context();
        if (!ac) return;
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        try {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ac.currentTime);
            gain.gain.setValueAtTime(volume, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start();
            osc.stop(ac.currentTime + duration);
        } catch (_) {
            /* sound is non-essential */
        }
    }

    function renderMuteIcon() {
        const btn = document.getElementById('btnToggleMute');
        if (!btn) return;
        btn.innerHTML = DD.icon(muted ? 'mute' : 'volume', 15);
        btn.setAttribute('aria-pressed', String(muted));
        btn.title = muted ? 'Unmute sound effects (M)' : 'Mute sound effects (M)';
    }

    DD.Audio = {
        init: renderMuteIcon,
        isMuted: () => muted,
        toggleMute() {
            muted = !muted;
            DD.Storage.set('mute', muted);
            renderMuteIcon();
            if (!muted) tone(880, 0.05);
            return muted;
        },
        tone,
        click: () => tone(900, 0.06, 'sine', 0.04),
        hover: () => tone(220, 0.03, 'triangle', 0.015),
        success() {
            tone(523.25, 0.08, 'sine', 0.04);
            setTimeout(() => tone(659.25, 0.12, 'sine', 0.04), 80);
        }
    };
})(window.DD = window.DD || {});
