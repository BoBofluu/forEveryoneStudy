// js/tts.js

// ==== Text to Speech (TTS) Logic ====
let voices = [];
let currentPlayingId = null;

// 預先載入系統語音庫
function loadVoices() {
    voices = window.speechSynthesis.getVoices();
}
// 監聽語音庫載入完成事件 (特別針對 Chrome 等瀏覽器)
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}
// 初次手動呼叫嘗試載入
loadVoices();

window.playAudio = function (elementId, lang = '', rateStr = '1', voiceName = '') {
    const el = document.getElementById(elementId);
    if (!el || !el.value) return;

    // 判斷：如果是正在播放，且點擊的是「同一個」按鈕，就視為停止
    if (window.speechSynthesis.speaking && currentPlayingId === elementId) {
        window.speechSynthesis.cancel();
        currentPlayingId = null;
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: '已停止朗讀', showConfirmButton: false, timer: 1000 });
        return;
    }

    const rate = parseFloat(rateStr) || 1;

    // 若不是同一個，或目前沒有播放，就開始朗讀新內容
    currentPlayingId = elementId;
    playAudioText(el.value, lang, elementId, rate, voiceName);
};

window.playAudioText = function (text, lang = '', elementId = null, rate = 1, voiceName = '') {
    if (!text || text.trim() === '') return;

    // 每次播放新句子前，強制先清空正在唸的內容
    window.speechSynthesis.cancel();

    // 移除 markdown 括號，讓朗讀更順暢
    const cleanText = text.replace(/【.*?】/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (!lang) {
        const hasKana = /[\u3040-\u309f\u30a0-\u30ff]/.test(cleanText);
        lang = hasKana ? 'ja-JP' : 'en-US';
    }
    utterance.lang = lang;

    // --- 核心修正：尋找並強制指定母語配音員 ---
    if (voices.length === 0) voices = window.speechSynthesis.getVoices();

    // 尋找符合該語言的配音員 (處理 'ja-JP' 和 'ja_JP' 格式差異)
    const targetVoices = voices.filter(v => v.lang.replace('_', '-').includes(lang));

    if (targetVoices.length > 0) {
        let selectedVoice = null;
        
        // 1. 針對日文，優先尋找 Nanami (微軟高品質自然語音)
        if (lang.includes('ja')) {
            selectedVoice = targetVoices.find(v => v.name.includes('Nanami'));
        }

        // 2. 針對英文或日文找不到 Nanami 時，優先尋找 Natural 或 Online 語音
        if (!selectedVoice) {
            // 優先順序：Natural/Online (高品質微軟語音) > Google/Siri/Premium > 系統預設
            selectedVoice = targetVoices.find(v => v.name.includes('Natural') || v.name.includes('Online'));
            
            if (!selectedVoice) {
                selectedVoice = targetVoices.find(v => v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Premium'));
            }
        }
        
        // 3. 最後備案：拿列表中的第一個符合語言的
        if (!selectedVoice) selectedVoice = targetVoices[0];

        utterance.voice = selectedVoice;
    }
    // ------------------------------------

    // 依據使用者選擇的速度
    utterance.rate = rate;

    // 朗讀自然結束時，清空當前紀錄
    utterance.onend = function () {
        if (currentPlayingId === elementId) currentPlayingId = null;
    };

    // 發生錯誤或被中斷時，也清空紀錄
    utterance.onerror = function () {
        if (currentPlayingId === elementId) currentPlayingId = null;
    };

    // 開始朗讀
    window.speechSynthesis.speak(utterance);
};

window.getVoicesForLang = function(lang) {
    if (voices.length === 0) voices = window.speechSynthesis.getVoices();
    return voices.filter(v => v.lang.replace('_', '-').includes(lang));
};
