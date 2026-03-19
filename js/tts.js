// js/tts.js

// ==== Text to Speech (TTS) Logic — Gemini 2.5 Flash ====

const TTS_VOICE_MAP = {
    'en-US': 'Achernar',
    'en-AU': 'Aoede',
    'en-GB': 'Charon',
    'ja-JP': 'Despina'
};
const TTS_PROMPT = 'Read aloud in a warm tone. Focus on a natural, breathy intonation with a soft and steady cadence.';

function getVoiceName(lang) {
    return TTS_VOICE_MAP[lang] || 'Achernar';
}

async function callTtsApi(apiKey, text, lang) {
    const voiceName = getVoiceName(lang);
    const response = await fetch(
        `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audioConfig: {
                    audioEncoding: 'LINEAR16',
                    pitch: 0,
                    speakingRate: 1
                },
                input: {
                    prompt: TTS_PROMPT,
                    text
                },
                voice: {
                    languageCode: lang.toLowerCase(),
                    modelName: 'gemini-2.5-flash-tts',
                    name: voiceName
                }
            })
        }
    );
    return response;
}

// Cache: btnId → Blob URL
const ttsCache = {};

// Currently active button id and Audio object
let currentBtnId = null;
let currentAudio = null;

function pcmToWavBlob(base64pcm) {
    const raw = atob(base64pcm);
    const sampleRate = 24000;
    const buf = new ArrayBuffer(44 + raw.length);
    const view = new DataView(buf);
    const writeString = (v, offset, str) => { for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i)); };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + raw.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);   // PCM
    view.setUint16(22, 1, true);   // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, raw.length, true);
    const bytes = new Uint8Array(buf, 44);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return new Blob([buf], { type: 'audio/wav' });
}

// Button state helpers
function setBtnLoading(btn) {
    btn.disabled = true;
    btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = '⏳';
}

function setBtnPlaying(btn) {
    btn.disabled = false;
    btn.innerHTML = '⏸';
}

function setBtnPaused(btn) {
    btn.disabled = false;
    btn.innerHTML = '▶';
}

function setBtnReplay(btn) {
    btn.disabled = false;
    btn.innerHTML = '🔁';
}

function restoreBtnOrig(btn) {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.origHtml || '🔊';
}

function setBtnRetry(btn) {
    btn.disabled = false;
    btn.innerHTML = '🔄 再試一次';
}

// Stop and reset any currently playing audio without touching button state
function stopCurrent() {
    if (currentAudio) {
        currentAudio.onended = null;
        currentAudio.onerror = null;
        currentAudio.pause();
        currentAudio = null;
    }
    currentBtnId = null;
}

function playFromUrl(url, btnId, btn) {
    const audio = new Audio(url);
    currentAudio = audio;
    currentBtnId = btnId;
    setBtnPlaying(btn);

    audio.onended = () => {
        if (currentBtnId === btnId) {
            currentAudio = null;
            currentBtnId = null;
            setBtnReplay(btn);
        }
    };
    audio.onerror = () => {
        if (currentBtnId === btnId) {
            currentAudio = null;
            currentBtnId = null;
            restoreBtnOrig(btn);
        }
    };
    audio.play();
}

window.playAudio = async function (elementId, lang = '', btnId = '') {
    const el = document.getElementById(elementId);
    if (!el || !el.value) return;

    const btn = btnId ? document.getElementById(btnId) : null;

    // --- If this button is currently playing → pause ---
    if (currentBtnId === btnId && currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        if (btn) setBtnPaused(btn);
        return;
    }

    // --- If this button is paused → resume ---
    if (currentBtnId === btnId && currentAudio && currentAudio.paused) {
        currentAudio.play();
        if (btn) setBtnPlaying(btn);
        return;
    }

    // --- If this button has a cached URL (replay) → play directly ---
    if (ttsCache[btnId]) {
        // Stop whatever else is playing first
        if (currentBtnId && currentBtnId !== btnId) {
            const prevBtn = document.getElementById(currentBtnId);
            if (prevBtn) setBtnReplay(prevBtn);
            stopCurrent();
        }
        if (btn) playFromUrl(ttsCache[btnId], btnId, btn);
        return;
    }

    // --- Stop any other playing audio ---
    if (currentBtnId && currentBtnId !== btnId) {
        const prevBtn = document.getElementById(currentBtnId);
        if (prevBtn) restoreBtnOrig(prevBtn);
        stopCurrent();
    }

    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        Swal.fire({ icon: 'warning', title: t('msg_tts_api_key_missing') });
        return;
    }

    const text = el.value.replace(/【.*?】/g, '');
    if (!text.trim()) return;

    if (btn) setBtnLoading(btn);

    try {
        const response = await callTtsApi(apiKey, text, lang);

        if (!response.ok) {
            if (btn) setBtnRetry(btn);
            Swal.fire({ icon: 'error', title: t('msg_tts_request_failed'), text: `HTTP ${response.status}` });
            return;
        }

        const data = await response.json();
        const base64pcm = data?.audioContent;
        if (!base64pcm) {
            if (btn) setBtnRetry(btn);
            Swal.fire({ icon: 'error', title: t('msg_tts_request_failed') });
            return;
        }

        const blob = pcmToWavBlob(base64pcm);
        const url = URL.createObjectURL(blob);
        if (btnId) ttsCache[btnId] = url;

        if (btn) playFromUrl(url, btnId, btn);

    } catch (err) {
        if (btn) setBtnRetry(btn);
        Swal.fire({ icon: 'error', title: t('msg_tts_request_failed'), text: err.message });
    }
};

// Stop all TTS — called when navigating away
window.stopAllTts = function () {
    if (currentAudio) {
        currentAudio.onended = null;
        currentAudio.onerror = null;
        currentAudio.pause();
        currentAudio = null;
    }
    currentBtnId = null;
};

window.playAudioText = async function (text, lang = '', elementId = null, rate = 1) {
    if (!text || text.trim() === '') return;
    window.stopAllTts();

    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) { Swal.fire({ icon: 'warning', title: t('msg_tts_api_key_missing') }); return; }

    const cleanText = text.replace(/【.*?】/g, '');
    if (!lang) {
        const hasKana = /[\u3040-\u309f\u30a0-\u30ff]/.test(cleanText);
        lang = hasKana ? 'ja-JP' : 'en-US';
    }
    try {
        const response = await callTtsApi(apiKey, cleanText, lang);
        if (!response.ok) { Swal.fire({ icon: 'error', title: t('msg_tts_request_failed'), text: `HTTP ${response.status}` }); return; }
        const data = await response.json();
        const base64pcm = data?.audioContent;
        if (!base64pcm) { Swal.fire({ icon: 'error', title: t('msg_tts_request_failed') }); return; }
        const blob = pcmToWavBlob(base64pcm);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.playbackRate = rate;
        currentAudio = audio;
        audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; };
        audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; };
        audio.play();
    } catch (err) {
        Swal.fire({ icon: 'error', title: t('msg_tts_request_failed'), text: err.message });
    }
};
