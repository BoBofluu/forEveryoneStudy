// js/main.js

// ==== Core Events & Import/Export ====

function saveItem() {
    const titleText = document.getElementById('titleInput').value.trim();
    const jpText = document.getElementById('jpInput').value.trim();
    const enText = document.getElementById('enInput') ? document.getElementById('enInput').value.trim() : '';
    const noteText = document.getElementById('noteInput').value.trim();
    const category = document.getElementById('categoryInput').value;

    if (!jpText && !enText) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: '請至少輸入一種內容喔！' });
        return;
    }

    const newItem = {
        id: Date.now(),
        title: titleText,
        jp: jpText,
        en: enText,
        note: noteText,
        cat: category,
        subcats: Array.from(currentInputSubcats), // 新增 subcats 陣列
        createdAt: new Date().toISOString()
    };

    jpData.unshift(newItem);
    if (typeof saveToLocal === 'function') saveToLocal();

    document.getElementById('titleInput').value = '';
    document.getElementById('jpInput').value = '';
    if (document.getElementById('enInput')) document.getElementById('enInput').value = '';
    document.getElementById('noteInput').value = '';

    // 重置輸入框高度
    document.getElementById('jpInput').style.height = '80px';
    if (document.getElementById('enInput')) document.getElementById('enInput').style.height = '80px';
    document.getElementById('noteInput').style.height = '80px';

    currentInputSubcats.clear();
    if (typeof handleCategoryChange === 'function') handleCategoryChange();

    if (typeof switchPage === 'function') switchPage('list');
}

function deleteItem(id, event) {
    if (event) event.stopPropagation();

    Swal.fire({
        title: '確定要刪除這筆筆記嗎？',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        cancelButtonColor: '#3f3f3f',
        confirmButtonText: '刪除',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            jpData = jpData.filter(item => item.id !== id);
            if (typeof saveToLocal === 'function') saveToLocal();
            if (typeof renderList === 'function') renderList();

            // 如果是在詳細頁面按刪除，就要退回清單頁
            if (document.getElementById('pageDetail').classList.contains('active')) {
                if (typeof switchPage === 'function') switchPage('list');
            }

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '已刪除', showConfirmButton: false, timer: 1500 });
        }
    });
}

function autoSave(id, field, value) {
    const index = jpData.findIndex(i => i.id === id);
    if (index > -1) {
        jpData[index][field] = value;
        if (typeof saveToLocal === 'function') saveToLocal();
    }
}

// ==== 資料匯出與匯入 ====
function exportItem(id) {
    const item = jpData.find(i => i.id === id);
    if (!item) {
        Swal.fire({ icon: 'error', title: '找不到資料' });
        return;
    }
    // 包裝成陣列，這樣匯入時格式會統一
    const dataStr = JSON.stringify([item], null, 4);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = item.title ? item.title.replace(/[\\/:*?"<>|]/g, '_') : 'Note';
    a.download = `JapanWeb_${fileName}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportData() {
    if (jpData.length === 0) {
        Swal.fire({ icon: 'info', title: '沒有資料可以匯出喔！' });
        return;
    }

    Swal.fire({
        title: '確定要匯出所有資料嗎？',
        text: `將會匯出目前的 ${jpData.length} 筆筆記。`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '開始匯出',
        cancelButtonText: '取消',
        confirmButtonColor: 'var(--color-grammar)'
    }).then((result) => {
        if (result.isConfirmed) {
            const dataStr = JSON.stringify(jpData, null, 4);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `JapanWeb_FullBackup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '匯出成功', showConfirmButton: false, timer: 1500 });
        }
    });
}

function importData() {
    const input = document.getElementById('importFile');
    if (input) input.click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) throw new Error('資料格式不正確');

            Swal.fire({
                title: '匯入資料',
                text: '您想要「覆蓋」現有資料，還是「合併」進去？',
                icon: 'question',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: '合併資料',
                denyButtonText: '全部覆蓋',
                cancelButtonText: '取消',
                confirmButtonColor: '#4ade80',
                denyButtonColor: '#ff6b6b'
            }).then((result) => {
                if (result.isConfirmed) {
                    jpData = [...importedData, ...jpData]; // 合併
                    if (typeof saveToLocal === 'function') saveToLocal();
                    if (typeof renderList === 'function') renderList();
                    Swal.fire('合併成功', '', 'success');
                } else if (result.isDenied) {
                    jpData = importedData; // 覆蓋
                    if (typeof saveToLocal === 'function') saveToLocal();
                    if (typeof renderList === 'function') renderList();
                    Swal.fire('覆蓋成功', '', 'success');
                }
            });
        } catch (error) {
            Swal.fire('錯誤', '匯入失敗，請確認是否為正確的備份檔 (*.json)', 'error');
        }
        event.target.value = ''; // 讓同一個檔案可以再次選擇
    };
    reader.readAsText(file);
}

window.handleCategoryChange = function () {
    if (typeof renderSubcategoryOptions === 'function') {
        renderSubcategoryOptions('categoryInput', 'subcategoryPills');
    }
};

window.toggleInputEn = function () {
    const section = document.getElementById('enInputGroup');
    const btn = document.getElementById('btn_toggleInputEn');
    if (!section || !btn) return;

    if (section.style.display === 'none') {
        section.style.display = 'block';
        btn.innerText = '隱藏英文欄位';
        const textarea = document.getElementById('enInput');
        if (textarea && typeof autoResize === 'function') autoResize(textarea);
    } else {
        section.style.display = 'none';
        btn.innerText = '顯示英文欄位';
    }
};

// ==== Program Init ====
async function startApp() {
    // 1. 先讀取分類資料 (從 JSON 或 LocalStorage)
    await initData();
    
    // 2. 啟動後渲染各項組件
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderTemplateSelects === 'function') renderTemplateSelects();
    if (typeof renderCalendar === 'function') renderCalendar();
    
    // 確保清單也根據讀取到的分類顯示
    if (typeof renderList === 'function') renderList();
}

// 執行程式
startApp();
