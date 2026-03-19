// js/i18n.js

let currentLang = localStorage.getItem('appLanguage') || 'zh-TW';
let translations = {};

// 語系對照表
const langMap = {
    'zh-TW': 'languages/zh-TW.json',
    'ja': 'languages/ja.json',
    'ko': 'languages/ko.json'
};

async function initI18n() {
    // 優先嘗試偵測瀏覽器語言 (如果是第一次使用)
    if (!localStorage.getItem('appLanguage')) {
        const browserLang = navigator.language;
        if (browserLang.startsWith('ja')) currentLang = 'ja';
        else if (browserLang.startsWith('ko')) currentLang = 'ko';
        else currentLang = 'zh-TW';
        localStorage.setItem('appLanguage', currentLang);
    }

    await loadTranslations(currentLang);
    updateStaticUI();
}

async function loadTranslations(lang) {
    try {
        const response = await fetch(langMap[lang] || langMap['zh-TW']);
        translations = await response.json();
        currentLang = lang;
        localStorage.setItem('appLanguage', lang);
    } catch (error) {
        console.error('Failed to load translations:', error);
    }
}

// 取得翻譯文字
function t(key) {
    return translations[key] || key;
}

// 更新 HTML 中的靜態文字 (帶有 data-i18n 屬性的元素)
function updateStaticUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        
        // 特殊處理：顯示/隱藏英文按鈕
        if (key === 'btn_show_en') {
            const section = document.getElementById('enInputGroup');
            const isVisible = section && section.style.display === 'block';
            el.innerText = isVisible ? t('btn_hide_en') : t('btn_show_en');
            return;
        }

        if (translations[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[key];
            } else {
                el.innerText = translations[key];
            }
        }
    });
    
    // 更新標題
    document.title = t('app_title');
}

// 切換語言
async function switchLanguage(lang) {
    await loadTranslations(lang);
    updateStaticUI();
    // 重新渲染清單與分類以套用新語系 (如果相關函數存在)
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderList === 'function') renderList();
    
    // 更新設定頁面的顯示
    const langNames = { 'zh-TW': '繁體中文', 'ja': '日本語', 'ko': '한국어' };
    if (document.getElementById('currentLangLabel')) {
        document.getElementById('currentLangLabel').innerText = langNames[lang] || lang;
    }
}

// 彈出語言選擇視窗
function openLanguageModal() {
    Swal.fire({
        title: t('btn_switch_lang'),
        html: `
            <div style="display:flex; flex-direction:column; gap:10px; padding:10px;">
                <button onclick="confirmSwitchLang('zh-TW')" style="padding:15px; background:rgba(255,255,255,0.05); border:1px solid #444; color:white; border-radius:10px; cursor:pointer; font-size:16px;">繁體中文 (Chinese)</button>
                <button onclick="confirmSwitchLang('ja')" style="padding:15px; background:rgba(255,255,255,0.05); border:1px solid #444; color:white; border-radius:10px; cursor:pointer; font-size:16px;">日本語 (Japanese)</button>
                <button onclick="confirmSwitchLang('ko')" style="padding:15px; background:rgba(255,255,255,0.05); border:1px solid #444; color:white; border-radius:10px; cursor:pointer; font-size:16px;">한국어 (Korean)</button>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: 'var(--bg-color)',
        color: 'var(--text-main)'
    });
}

window.confirmSwitchLang = function(lang) {
    switchLanguage(lang);
    Swal.close();
};
