// js/utils.js

// ==== Reusable Utilities ====

// 1. Textarea 自動調整高度
function autoResize(element) {
    if (!element) return;
    const scrollPos = window.scrollY; // 先記錄目前的滾動位置

    // 先重置高度以計算實際需要的高度 (scrollHeight)
    element.style.height = '80px'; // 使用預設最小高度而不是 'auto' 以避免頁面大幅跳動

    // 設定最大高度限制 (對應 CSS 的 max-height)
    const maxHeight = 320;
    if (element.scrollHeight <= maxHeight) {
        element.style.height = (element.scrollHeight) + 'px';
        element.style.overflowY = 'hidden';
    } else {
        element.style.height = maxHeight + 'px';
        element.style.overflowY = 'auto';
    }

    window.scrollTo(0, scrollPos); // 恢復原本的滾動位置
}

// 2. 複製到剪貼簿
function copyToClipboard(elementId) {
    const textArea = document.getElementById(elementId);
    if (!textArea || !textArea.value) return;

    navigator.clipboard.writeText(textArea.value).then(() => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: t('msg_copied'),
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true
        });
    });
}

// 3. 顏色亮度計算 (YIQ Formula)
// 根據背景顏色，自動決定文字是黑色還是白色
window.getContrastYIQ = function (hexcolor) {
    if (!hexcolor) return 'rgba(0,0,0,0.8)'; // default fallback

    // 處理 rgb() rgba() 等萬一有的格式 (防呆)
    if (hexcolor.startsWith('rgb')) return 'rgba(0,0,0,0.8)';

    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(c => c + c).join('');
    }

    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // 如果亮度>=128，回傳深字；反之回傳白字
    return (yiq >= 128) ? 'rgba(0,0,0,0.8)' : '#ffffff';
};

// 4. 新增衍生項目 (複製成新筆記)
function duplicateItem(id) {
    const originalItem = jpData.find(i => i.id === id);
    if (!originalItem) return;

    const newItem = {
        ...originalItem,
        id: Date.now(),
        title: originalItem.title ? originalItem.title + t('msg_duplicate_title_suffix') : t('msg_duplicate_success'),
        createdAt: new Date().toISOString(),
        subcats: originalItem.subcats ? [...originalItem.subcats] : []
    };

    jpData.unshift(newItem);
    saveToLocal();
    renderList();

    // 這裡改為直接開啟該衍生項目的詳細頁面
    if (typeof openDetail === 'function') {
        openDetail(newItem.id);
    } else {
        switchPage('list');
    }
    
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: t('msg_duplicate_success'), showConfirmButton: false, timer: 1500 });
}

// ==== Scroll to Top Logic ====
window.addEventListener('scroll', function() {
    const btn = document.getElementById('scrollToTopBtn');
    if (!btn) return;
    
    // 當捲動超過 300px 時顯示按鈕
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btn.style.display = 'flex';
    } else {
        btn.style.display = 'none';
    }
}, { passive: true });

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
