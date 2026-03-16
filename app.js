// 模板管理
let templates = JSON.parse(localStorage.getItem('jpTemplates')) || [];
// --- Calendar State ---
let currentCalendarDate = new Date(); // Controls which month is being viewed
let selectedCalendarDate = null; // Controls which specific date is filtered (YYYY-MM-DD)
// ----------------------

function renderTemplateSelects() {
    let optionsHtml = '<option value="">無</option>';
    optionsHtml += templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    const inputSelect = document.getElementById('inputTemplateSelect');
    if (inputSelect) inputSelect.innerHTML = optionsHtml;

    // 如果詳細頁面有開啟，也更新它
    const detailSelect = document.getElementById('detailTemplateSelect');
    if (detailSelect) detailSelect.innerHTML = optionsHtml;
}


async function manageTemplates() {
    if (templates.length === 0) {
        Swal.fire('目前沒有自訂模板喔！', '請先新增模板。', 'info');
        return;
    }

    let htmlContent = '<div style="text-align:left; height:400px; overflow-y:auto; margin-top:10px;">';
    templates.forEach(t => {
        htmlContent += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background-color:var(--input-bg); margin-bottom:8px; border-radius:8px;">
            <div style="flex-grow:1; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:10px;">${t.name}</div>
            <div>
                <button onclick="editSingleTemplate('${t.id}')" style="background:var(--color-grammar); border:none; color:#121212; padding:5px 10px; border-radius:5px; margin-right:5px; cursor:pointer;">編輯</button>
                <button onclick="deleteSingleTemplate('${t.id}')" style="background:var(--color-danger); border:none; color:white; padding:5px 10px; border-radius:5px; cursor:pointer;">刪除</button>
            </div>
        </div>`;
    });
    htmlContent += '</div>';

    Swal.fire({
        title: '管理自訂模板',
        html: htmlContent,
        width: '500px',
        showConfirmButton: true,
        confirmButtonText: '新增模板',
        confirmButtonColor: '#4ade80',
        showCloseButton: true,
        customClass: {
            htmlContainer: 'custom-scroll-container'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            addNewTemplate();
        }
    });
}

window.editSingleTemplate = async function (id) {
    const target = templates.find(t => t.id === id);
    if (!target) return;

    // 先關閉管理視窗
    Swal.close();

    const result = await Swal.fire({
        title: '編輯模板',
        html:
            `<div style="height:400px; display:flex; flex-direction:column; gap:10px;">` +
            `<input id="swal-template-name" class="swal2-input" value="${target.name}" style="margin:0; width:100%;">` +
            `<textarea id="swal-template-content" class="swal2-textarea" style="margin:0; width:100%; flex-grow:1; resize:none;">${target.content}</textarea>` +
            `</div>`,
        width: '500px',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#4ade80',
        confirmButtonText: '儲存',
        preConfirm: () => {
            const name = document.getElementById('swal-template-name').value;
            const content = document.getElementById('swal-template-content').value;
            if (!name.trim() || !content.trim()) {
                Swal.showValidationMessage('名稱和內容不能為空');
                return false;
            }
            return { name, content };
        }
    });

    if (result.isConfirmed && result.value) {
        const formValues = result.value;
        target.name = formValues.name;
        target.content = formValues.content;
        localStorage.setItem('jpTemplates', JSON.stringify(templates));
        renderTemplateSelects();
        manageTemplates();
    } else if (result.isDismissed) {
        manageTemplates();
    }
};

window.deleteSingleTemplate = function (id) {
    Swal.fire({
        title: '確定要刪除嗎？',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        confirmButtonText: '刪除',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            templates = templates.filter(t => t.id !== id);
            localStorage.setItem('jpTemplates', JSON.stringify(templates));
            renderTemplateSelects();
            // 重新打開管理視窗刷新畫面
            manageTemplates();
        } else if (result.isDismissed) {
            manageTemplates();
        }
    });
};

async function addNewTemplate() {
    const result = await Swal.fire({
        title: '新增模板',
        html:
            `<div style="height:400px; display:flex; flex-direction:column; gap:10px;">` +
            `<input id="swal-template-name" class="swal2-input" placeholder="模板名稱 (例如: 請假信)" style="margin:0; width:100%;">` +
            `<textarea id="swal-template-content" class="swal2-textarea" placeholder="模板內容..." style="margin:0; width:100%; flex-grow:1; resize:none;"></textarea>` +
            `</div>`,
        width: '500px',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#4ade80',
        cancelButtonColor: '#3f3f3f',
        confirmButtonText: '儲存',
        cancelButtonText: '取消',
        preConfirm: () => {
            const name = document.getElementById('swal-template-name').value;
            const content = document.getElementById('swal-template-content').value;
            if (!name.trim() || !content.trim()) {
                Swal.showValidationMessage('模板名稱和內容都不能為空喔！');
                return false;
            }
            return { name, content };
        }
    });

    if (result.isConfirmed && result.value) {
        const formValues = result.value;
        templates.push({
            id: 'tpl_' + Date.now(),
            name: formValues.name,
            content: formValues.content
        });
        localStorage.setItem('jpTemplates', JSON.stringify(templates));
        renderTemplateSelects();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '新增成功', showConfirmButton: false, timer: 1500 });
        manageTemplates();
    } else if (result.isDismissed) {
        manageTemplates();
    }
}

let jpData = JSON.parse(localStorage.getItem('jpLearningData_v2')) || [];

// 預設分類 (加入 subcats 陣列)
const defaultCategories = {
    'vocab': { label: '單字', class: 'cat-vocab', subcats: [{ id: 'sub_noun', label: '名詞' }, { id: 'sub_verb', label: '動詞' }, { id: 'sub_adj', label: '形容詞' }] },
    'grammar': { label: '文法', class: 'cat-grammar', subcats: [] },
    'idiom': { label: '慣用句', class: 'cat-idiom', subcats: [] },
    'other': { label: '其他', class: 'cat-other', subcats: [] }
};

let categoryMap = JSON.parse(localStorage.getItem('jpCategories')) || defaultCategories;

// --- 顏色亮度計算 (YIQ Formula) ---
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

// 預設色票
const PRESET_COLORS = [
    '#f87171', // 紅
    '#fb923c', // 橘
    '#fde047', // 黃
    '#4ade80', // 綠
    '#2dd4bf', // 青
    '#60a5fa', // 藍
    '#818cf8', // 靛
    '#c084fc', // 紫
    '#f472b6', // 粉
    '#a8a29e'  // 灰
];

// 點擊色票時自動更新 color picker 的值
window.selectPresetColor = function (colorHex) {
    const colorInput = document.getElementById('swal-cat-color');
    if (colorInput) {
        colorInput.value = colorHex;
    }
};

function renderCategories() {
    // 渲染下拉選單 (輸入頁跟詳細頁)
    let optionsHtml = '';
    for (const [key, value] of Object.entries(categoryMap)) {
        optionsHtml += `<option value="${key}">${value.label}</option>`;
    }

    const inputSelect = document.getElementById('categoryInput');
    if (inputSelect) {
        const selectedCat = inputSelect.value;
        const subcatInput = document.getElementById('subcategoryInput');
        const selectedSubcat = subcatInput ? subcatInput.value : '';

        inputSelect.innerHTML = optionsHtml;
        if (selectedCat && categoryMap[selectedCat]) {
            inputSelect.value = selectedCat;
        }

        // 如果輸入頁目前有選擇分類，根據該分類渲染子分類選單並檢查是否顯示英文輸入
        handleCategoryChange();
    }

    const detailContainer = document.getElementById('detailContainer');
    if (detailContainer) {
        const detailCatSelects = detailContainer.querySelectorAll('select[id^="detailCat_"]');
        detailCatSelects.forEach(catSelect => {
            const idMatch = catSelect.id.match(/^detailCat_(.+)$/);
            if (idMatch) {
                const itemId = idMatch[1];
                const selectedCat = catSelect.value;
                const subcatSelect = document.getElementById(`detailSubcat_${itemId}`);
                const selectedSubcat = subcatSelect ? subcatSelect.value : '';

                catSelect.innerHTML = optionsHtml;
                if (selectedCat && categoryMap[selectedCat]) {
                    catSelect.value = selectedCat;
                }

                renderSubcategoryOptions(`detailCat_${itemId}`, `detailSubcat_${itemId}`, selectedSubcat);
            }
        });
    }

    // 渲染清單頁的過濾 (Checkbox)
    const filterContainer = document.querySelector('.pill-filters');
    if (filterContainer) {
        let filterHtml = '<div style="display:flex; flex-direction:column; gap:8px; width:100%;">';

        // 主分類 Checkboxes
        filterHtml += '<div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">';
        filterHtml += `
            <button onclick="toggleAllCatFilters(true)" style="background:var(--color-grammar); border:none; color:#121212; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">全選</button>
            <button onclick="toggleAllCatFilters(false)" style="background:var(--color-danger); border:none; color:white; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">清除</button>
            <span style="color:#666; margin:0 4px;">|</span>
        `;
        for (const [key, value] of Object.entries(categoryMap)) {
            const isChecked = selectedFilterCats.has(key) ? 'checked' : '';
            const textColor = value.customColor ? getContrastYIQ(value.customColor) : '#ffffff';
            filterHtml += `
            <label style="display:flex; align-items:center; cursor:pointer; font-size:13px; margin:0;">
                <input type="checkbox" value="${key}" onchange="toggleCatFilter('${key}', this.checked)" ${isChecked} style="width:auto; margin-right:4px;">
                <span class="category-badge ${value.class || ''}" style="${value.customColor ? `background-color:${value.customColor}; color:${textColor};` : ''}">${value.label}</span>
            </label>`;
        }
        filterHtml += '</div>';

        // 子分類 Checkboxes
        let hasSubcats = false;
        let subcatHtml = '<div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:6px; margin-top:8px;">';

        for (const catKey of selectedFilterCats) {
            const catData = categoryMap[catKey];
            if (catData && catData.subcats && catData.subcats.length > 0) {
                hasSubcats = true;
                const textColor = catData.customColor ? getContrastYIQ(catData.customColor) : '#ffffff';
                catData.subcats.forEach(sub => {
                    const isChecked = selectedFilterSubcats.has(sub.id) ? 'checked' : '';
                    subcatHtml += `
                    <label style="display:flex; align-items:center; cursor:pointer; font-size:13px; margin:0; color:var(--text-sub);">
                        <input type="checkbox" value="${sub.id}" onchange="toggleSubcatFilter('${sub.id}', this.checked)" ${isChecked} style="width:auto; margin-right:4px;">
                        <span class="category-badge ${catData.class || ''}" style="${catData.customColor ? `background-color:${catData.customColor}; color:${textColor};` : ''} opacity:0.8; font-weight:normal;">${sub.label}</span>
                    </label>`;
                });
            }
        }
        subcatHtml += '</div>';

        if (hasSubcats) filterHtml += subcatHtml;
        filterHtml += '</div>';

        filterContainer.innerHTML = filterHtml;
    }
}

// 存放選取的分類
let selectedFilterCats = new Set(Object.keys(categoryMap)); // 預設全選
let selectedFilterSubcats = new Set(); // 預設不選代表不過濾

window.toggleAllCatFilters = function (selectAll) {
    if (selectAll) {
        selectedFilterCats = new Set(Object.keys(categoryMap));
    } else {
        selectedFilterCats.clear();
        selectedFilterSubcats.clear();
    }
    renderCategories();
    renderList();
};

window.toggleCatFilter = function (key, isChecked) {
    if (isChecked) selectedFilterCats.add(key);
    else {
        selectedFilterCats.delete(key);
        // 如果取消勾選主分類，順便清掉底下的子分類過濾
        const catData = categoryMap[key];
        if (catData && catData.subcats) {
            catData.subcats.forEach(sub => selectedFilterSubcats.delete(sub.id));
        }
    }
    renderCategories(); // 重新渲染以更新子分類
    renderList();
};

window.toggleSubcatFilter = function (id, isChecked) {
    if (isChecked) selectedFilterSubcats.add(id);
    else selectedFilterSubcats.delete(id);
    renderList();
};

window.renderSubcategoryOptions = function (catSelectId, subSelectId, selectedSubId = null) {
    const catSelect = document.getElementById(catSelectId);
    const subSelect = document.getElementById(subSelectId);
    if (!catSelect || !subSelect) return;

    const catKey = catSelect.value;
    const catData = categoryMap[catKey];

    let html = '<option value="">(無)</option>';
    if (catData && catData.subcats && catData.subcats.length > 0) {
        catData.subcats.forEach(sub => {
            const isSelected = selectedSubId === sub.id ? 'selected' : '';
            html += `<option value="${sub.id}" ${isSelected}>${sub.label}</option>`;
        });
    }

    subSelect.innerHTML = html;
}

async function manageCategories() {
    let htmlContent = '<div style="text-align:left; height:400px; overflow-y:auto; margin-top:10px;">';
    for (const [key, value] of Object.entries(categoryMap)) {
        const textColor = value.customColor ? getContrastYIQ(value.customColor) : '#ffffff';
        htmlContent += `
        <div style="padding:10px; background-color:var(--bg-color); border: 2px solid var(--input-border); margin-bottom:12px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:10px;">
                    <span class="category-badge ${value.class || ''}" style="${value.customColor ? `background-color:${value.customColor}; color:${textColor};` : ''}">${value.label}</span>
                </div>
                <div>
                    <button onclick="editCategory('${key}')" style="background:var(--color-grammar); border:none; color:#121212; padding:6px 10px; border-radius:4px; margin-right:4px; cursor:pointer; font-size:13px;">編輯</button>
                    <button onclick="deleteCategory('${key}')" style="background:var(--color-danger); border:none; color:white; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:13px;">刪除</button>
                </div>
            </div>
            <div style="background:var(--input-bg); padding:10px; border-radius:6px; border: 1px solid var(--input-border);">
                <div style="font-size:13px; color:var(--text-sub); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span>子分類 (${(value.subcats || []).length})</span>
                    <button onclick="addSubcategory('${key}')" style="background:transparent; border:1px solid var(--color-grammar); color:var(--color-grammar); padding:6px 12px; border-radius:12px; cursor:pointer; font-size:13px; font-weight:500;">新增子分類</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${(value.subcats || []).map(sub => `
                        <div style="display:flex; align-items:center; background:#444; border:none; color:#fff; padding:6px 10px; border-radius:12px; font-size:13px;">
                            <span style="margin-right:6px;">${sub.label}</span>
                            <span style="color:#ff6b6b; cursor:pointer; margin-left:4px; padding:0 4px; font-weight:bold; font-size:15px;" onclick="deleteSubcategory('${key}', '${sub.id}')">×</span>
                        </div>
                    `).join('')}
                    ${(value.subcats || []).length === 0 ? '<span style="font-size:13px; color:#999;">目前無子分類</span>' : ''}
                </div>
            </div>
        </div>`;
    }
    htmlContent += '</div>';

    Swal.fire({
        title: '管理分類',
        html: htmlContent,
        width: '500px',
        showConfirmButton: true,
        confirmButtonText: '新增分類',
        confirmButtonColor: '#4ade80',
        showCloseButton: true,
        customClass: {
            htmlContainer: 'custom-scroll-container'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            addNewCategory();
        }
    });
}

window.editCategory = async function (key) {
    const target = categoryMap[key];
    if (!target) return;

    Swal.close();

    const currentColor = target.customColor || '#8ab4f8';

    // 生成色票 HTML
    const swatchesHtml = PRESET_COLORS.map(c =>
        `<div onclick="selectPresetColor('${c}')" style="width:25px; height:25px; border-radius:50%; background-color:${c}; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`
    ).join('');

    const result = await Swal.fire({
        title: '編輯分類',
        html: `
            <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-start;">
                <label style="font-size:14px; align-self:flex-start; margin-bottom:0;">分類名稱:</label>
                <input id="swal-cat-name" class="swal2-input" value="${target.label}" style="margin:0; width:100%;">
                
                <label style="font-size:14px; align-self:flex-start; margin-bottom:0; margin-top:10px;">預設色票:</label>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:5px;">
                    ${swatchesHtml}
                </div>

                <label style="font-size:14px; align-self:flex-start; margin-bottom:0; margin-top:5px;">自訂顏色:</label>
                <input type="color" id="swal-cat-color" value="${currentColor}" style="width:100%; height:40px; border:none; border-radius:6px; cursor:pointer; background:none; padding:0;">
            </div>
        `,
        width: '500px',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#4ade80',
        confirmButtonText: '儲存',
        preConfirm: () => {
            const name = document.getElementById('swal-cat-name').value;
            const color = document.getElementById('swal-cat-color').value;
            if (!name.trim()) {
                Swal.showValidationMessage('名稱不能為空');
                return false;
            }
            return { name, color };
        }
    });

    if (result.isConfirmed && result.value) {
        const formValues = result.value;
        categoryMap[key].label = formValues.name;
        categoryMap[key].customColor = formValues.color;

        // Remove old generic class if custom color is explicitly set
        if (categoryMap[key].class) {
            delete categoryMap[key].class;
        }

        localStorage.setItem('jpCategories', JSON.stringify(categoryMap));
        renderCategories();
        // 重新渲染清單以更新標籤文字
        if (document.getElementById('pageList').classList.contains('active')) {
            renderList();
        }

        manageCategories();
    } else if (result.isDismissed) {
        manageCategories();
    }
};

window.deleteCategory = function (key) {
    // 檢查是否有筆記使用此分類
    const isUsed = jpData.some(item => item.cat === key);
    if (isUsed) {
        Swal.fire('無法刪除', '還有筆記正在使用這個分類，請先將那些筆記改為其他分類！', 'error');
        return;
    }

    if (Object.keys(categoryMap).length <= 1) {
        Swal.fire('無法刪除', '至少要保留一個分類喔！', 'error');
        return;
    }

    Swal.fire({
        title: '確定要刪除嗎？',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        confirmButtonText: '刪除',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            delete categoryMap[key];
            selectedFilterCats.delete(key);
            localStorage.setItem('jpCategories', JSON.stringify(categoryMap));
            renderCategories();
            renderList();
            manageCategories();
        } else if (result.isDismissed) {
            manageCategories();
        }
    });
};

async function addNewCategory() {
    Swal.close();

    // 生成色票 HTML
    const swatchesHtml = PRESET_COLORS.map(c =>
        `<div onclick="selectPresetColor('${c}')" style="width:25px; height:25px; border-radius:50%; background-color:${c}; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`
    ).join('');

    const result = await Swal.fire({
        title: '新增分類',
        html: `
            <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-start;">
                <label style="font-size:14px; align-self:flex-start; margin-bottom:0;">分類名稱:</label>
                <input id="swal-cat-name" class="swal2-input" placeholder="分類名稱 (例如: 聽力)" style="margin:0; width:100%;">
                
                <label style="font-size:14px; align-self:flex-start; margin-bottom:0; margin-top:10px;">預設色票:</label>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:5px;">
                    ${swatchesHtml}
                </div>

                <label style="font-size:14px; align-self:flex-start; margin-bottom:0; margin-top:5px;">自訂顏色:</label>
                <input type="color" id="swal-cat-color" value="#8ab4f8" style="width:100%; height:40px; border:none; border-radius:6px; cursor:pointer; background:none; padding:0;">
            </div>
        `,
        width: '500px',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#4ade80',
        cancelButtonColor: '#3f3f3f',
        confirmButtonText: '儲存',
        cancelButtonText: '取消',
        preConfirm: () => {
            const name = document.getElementById('swal-cat-name').value;
            const color = document.getElementById('swal-cat-color').value;
            if (!name.trim()) {
                Swal.showValidationMessage('名稱不能為空喔！');
                return false;
            }
            return { name, color };
        }
    });

    if (result.isConfirmed && result.value) {
        const formValues = result.value;
        const newKey = 'cat_' + Date.now();
        categoryMap[newKey] = { label: formValues.name, customColor: formValues.color, subcats: [] };
        // Remove class properties since we rely on customColor for new objects

        localStorage.setItem('jpCategories', JSON.stringify(categoryMap));
        selectedFilterCats.add(newKey); // Add completely to checked list by default to preserve list updates
        renderCategories();
        renderList();
        manageCategories();
    } else if (result.isDismissed) {
        manageCategories();
    }
}

window.addSubcategory = async function (parentKey) {
    const parent = categoryMap[parentKey];
    if (!parent) return;

    Swal.close();

    const result = await Swal.fire({
        title: `新增「${parent.label}」的子分類`,
        html: '<input id="swal-subcat-name" class="swal2-input" placeholder="子分類名稱 (例如: N5, 動詞)">',
        width: '500px',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#4ade80',
        cancelButtonColor: '#3f3f3f',
        confirmButtonText: '儲存',
        cancelButtonText: '取消',
        preConfirm: () => {
            const name = document.getElementById('swal-subcat-name').value;
            if (!name.trim()) {
                Swal.showValidationMessage('名稱不能為空喔！');
                return false;
            }
            return { name };
        }
    });

    if (result.isConfirmed && result.value) {
        const formValues = result.value;
        if (!parent.subcats) parent.subcats = [];
        parent.subcats.push({ id: 'sub_' + Date.now(), label: formValues.name });
        localStorage.setItem('jpCategories', JSON.stringify(categoryMap));

        // 為了確保舊資料相容，順便幫沒有 subcats 的類別加上 array
        for (let k in categoryMap) {
            if (!categoryMap[k].subcats) categoryMap[k].subcats = [];
        }

        renderCategories();
        renderList();
        manageCategories();
    } else if (result.isDismissed) {
        manageCategories();
    }
};

window.deleteSubcategory = function (parentKey, subId) {
    // 檢查是否有筆記正在使用這個子分類
    const isUsed = jpData.some(item => item.cat === parentKey && item.subcat === subId);
    if (isUsed) {
        Swal.fire('無法刪除', '還有筆記正在使用這個子分類，請先將那些筆記改為其他分類！', 'error');
        return;
    }

    Swal.fire({
        title: '確定要刪除子分類嗎？',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        confirmButtonText: '刪除',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            categoryMap[parentKey].subcats = categoryMap[parentKey].subcats.filter(sub => sub.id !== subId);
            localStorage.setItem('jpCategories', JSON.stringify(categoryMap));
            renderCategories();
            renderList();
            manageCategories();
        } else if (result.isDismissed) {
            manageCategories();
        }
    });
};

let currentCatFilter = 'all';

function setCatFilter(cat) {
    currentCatFilter = cat;
    document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`filterCat_${cat}`);
    if (targetBtn) targetBtn.classList.add('active');
    renderList();
}

window.handleCategoryChange = function() {
    renderSubcategoryOptions('categoryInput', 'subcategoryPills');
    const catSelect = document.getElementById('categoryInput');
    const enGroup = document.getElementById('enInputGroup');
    const jpAudioBtn = document.getElementById('jpAudioBtn');
    
    if (catSelect && catSelect.value === 'vocab') {
        if(enGroup) enGroup.style.display = 'block';
        if(jpAudioBtn) jpAudioBtn.style.display = 'inline-block';
    } else {
        if(enGroup) enGroup.style.display = 'none';
        if(jpAudioBtn) jpAudioBtn.style.display = 'none';
    }
};

// ===== 核心功能 =====

// 1. Textarea 自動調整高度
function autoResize(element) {
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

function insertTemplate(targetInputId, selectId, itemId = null) {
    const textArea = document.getElementById(targetInputId);
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;

    const selectedTemplateId = selectEl.value;
    if (!selectedTemplateId) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: '請先選擇模板', showConfirmButton: false, timer: 1500 });
        return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const doInsert = () => {
        textArea.value = template.content;
        autoResize(textArea);
        if (itemId) {
            autoSave(itemId, 'jp', textArea.value);
        }
    };

    if (textArea.value.trim() !== '') {
        Swal.fire({
            title: '確定要覆蓋嗎？',
            text: '輸入框內已經有內容了，插入模板會清空目前的文字喔！',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6b6b',
            cancelButtonColor: '#3f3f3f',
            confirmButtonText: '確定覆蓋',
            cancelButtonText: '取消'
        }).then((result) => {
            if (result.isConfirmed) {
                doInsert();
            }
        });
    } else {
        doInsert();
    }
}

// 3. 複製到剪貼簿
function copyToClipboard(elementId) {
    const textArea = document.getElementById(elementId);
    if (!textArea || !textArea.value) return;

    navigator.clipboard.writeText(textArea.value).then(() => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: '已複製日文！',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true
        });
    });
}

// 4. 複製成新筆記
function duplicateItem(id) {
    const originalItem = jpData.find(i => i.id === id);
    if (!originalItem) return;

    const newItem = {
        ...originalItem,
        id: Date.now(), // 賦予新 ID
        title: originalItem.title ? originalItem.title + ' (複製)' : '複製的報告',
        createdAt: new Date().toISOString()
    };

    jpData.unshift(newItem);
    saveToLocal();

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '已產生新筆記！',
        showConfirmButton: false,
        timer: 1500
    });

    // 直接打開那份新筆記讓你編輯
    openDetail(newItem.id);
}

// ===== 頁面與資料處理 =====

function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

    const titleEl = document.getElementById('pageTitle');

    if (pageName === 'input') {
        document.getElementById('pageInput').classList.add('active');
        document.getElementById('tabInput').classList.add('active');
        titleEl.innerText = '新增日文筆記';

        // 重新計算 textarea 高度
        setTimeout(() => {
            autoResize(document.getElementById('jpInput'));
            autoResize(document.getElementById('noteInput'));
        }, 10);
    } else if (pageName === 'list') {
        document.getElementById('pageList').classList.add('active');
        document.getElementById('tabList').classList.add('active');
        titleEl.innerText = '我的日文清單';
        renderList();
        renderCalendar();
    }
    window.scrollTo(0, 0);
}

function saveItem() {
    const titleText = document.getElementById('titleInput').value.trim();
    const jpText = document.getElementById('jpInput').value.trim();
    const enText = document.getElementById('enInput') ? document.getElementById('enInput').value.trim() : '';
    const noteText = document.getElementById('noteInput').value.trim();
    const category = document.getElementById('categoryInput').value;

    if (!jpText && !enText) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: '請輸入內容喔！' });
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
    saveToLocal();

    document.getElementById('titleInput').value = '';
    document.getElementById('jpInput').value = '';
    if (document.getElementById('enInput')) document.getElementById('enInput').value = '';
    document.getElementById('noteInput').value = '';

    // 重置輸入框高度
    document.getElementById('jpInput').style.height = '80px';
    if (document.getElementById('enInput')) document.getElementById('enInput').style.height = '80px';
    document.getElementById('noteInput').style.height = '80px';

    currentInputSubcats.clear();
    handleCategoryChange();

    switchPage('list');
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
            saveToLocal();
            renderList();

            // 如果是在詳細頁面按刪除，就要退回清單頁
            if (document.getElementById('pageDetail').classList.contains('active')) {
                switchPage('list');
            }

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '已刪除', showConfirmButton: false, timer: 1500 });
        }
    });
}

// ===== 資料匯出與匯入 =====
function exportData() {
    if (Object.keys(jpData).length === 0) {
        Swal.fire({ icon: 'info', title: '沒有資料可以匯出喔！' });
        return;
    }
    const dataStr = JSON.stringify(jpData);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JapanesePractice_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('importFile').click();
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
                    saveToLocal();
                    renderList();
                    Swal.fire('合併成功', '', 'success');
                } else if (result.isDenied) {
                    jpData = importedData; // 覆蓋
                    saveToLocal();
                    renderList();
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

function saveToLocal() {
    localStorage.setItem('jpLearningData_v2', JSON.stringify(jpData));
}

function renderList() {
    const container = document.getElementById('listContainer');
    if (!document.getElementById('pageList').classList.contains('active')) return;

    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const sTitle = document.getElementById('searchTitle').checked;
    const sCat = document.getElementById('searchCat').checked;
    const sJp = document.getElementById('searchJp').checked;
    const sNote = document.getElementById('searchNote').checked;
    const sortOrder = document.getElementById('sortOrder').value;
    const startDateStr = document.getElementById('searchStartDate') ? document.getElementById('searchStartDate').value : '';
    const endDateStr = document.getElementById('searchEndDate') ? document.getElementById('searchEndDate').value : '';

    container.innerHTML = '';

    let filteredData = jpData.filter(item => {
        // 第一層過濾：主分類
        if (selectedFilterCats.size > 0 && !selectedFilterCats.has(item.cat)) {
            return false;
        }

        // 第二層過濾：子分類 (如果有勾選任何子分類，且該筆記的主分類在可見的子分類群組內，才過濾子分類)
        if (selectedFilterSubcats.size > 0) {
            const catData = categoryMap[item.cat];
            if (catData && catData.subcats) {
                const hasAnySubcatSelectedForThisCat = catData.subcats.some(sub => selectedFilterSubcats.has(sub.id));

                if (hasAnySubcatSelectedForThisCat) {
                    const itemSubcats = item.subcats || (item.subcat ? [item.subcat] : []);
                    const matchesSelectedSubcat = itemSubcats.some(sub => selectedFilterSubcats.has(sub));
                    
                    if (!matchesSelectedSubcat) {
                        return false;
                    }
                }
            }
        }

        // 第三層過濾：日期範圍 (改由日曆 UI 選擇)
        const createdDate = item.createdAt ? new Date(item.createdAt) : new Date(item.id);
        
        if (selectedCalendarDate) {
            // Compare YYYY-MM-DD
            const itemDateStr = createdDate.getFullYear() + '-' + String(createdDate.getMonth() + 1).padStart(2, '0') + '-' + String(createdDate.getDate()).padStart(2, '0');
            if (itemDateStr !== selectedCalendarDate) {
                return false;
            }
        }

        // 第四層過濾：關鍵字
        if (!keyword) return true;
        let match = false;
        if (sTitle && item.title && item.title.toLowerCase().includes(keyword)) match = true;
        if (sCat && categoryMap[item.cat] && categoryMap[item.cat].label.toLowerCase().includes(keyword)) match = true;

        // 子分類關鍵字搜尋
        const itemSubcats = item.subcats || (item.subcat ? [item.subcat] : []);
        if (sCat && itemSubcats.length > 0 && categoryMap[item.cat] && categoryMap[item.cat].subcats) {
            const hasSubcatMatch = itemSubcats.some(subId => {
                const subData = categoryMap[item.cat].subcats.find(s => s.id === subId);
                return subData && subData.label.toLowerCase().includes(keyword);
            });
            if (hasSubcatMatch) match = true;
        }

        if (sJp && item.jp && item.jp.toLowerCase().includes(keyword)) match = true;
        
        return match;
    });

    // 第三階段：排序
    filteredData.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.id).getTime();
        const timeB = new Date(b.createdAt || b.id).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    if (filteredData.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; color:var(--text-sub); margin-top:60px; display:flex; flex-direction:column; align-items:center; opacity:0.6;">
                <div style="font-size:16px; font-weight:500; color:var(--text-main); margin-bottom:5px;">
                    ${jpData.length === 0 ? '目前還沒有筆記' : '找不到相符的內容'}
                </div>
                <div style="font-size:13px;">
                    ${jpData.length === 0 ? '點擊下方「輸入」開始新增您的第一則日文筆記吧！' : '請嘗試更換搜尋條件'}
                </div>
            </div>`;
        return;
    }

    let currentMonthStr = '';
    let currentGroupContent = null;

    filteredData.forEach(item => {
        const createdDate = item.createdAt ? new Date(item.createdAt) : new Date(item.id);
        const itemMonthStr = createdDate.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit' });

        if (itemMonthStr !== currentMonthStr) {
            currentMonthStr = itemMonthStr;
            const header = document.createElement('div');
            header.className = 'list-group-header';
            header.innerHTML = `<span>${currentMonthStr.replace('/', '年') + '月'}</span><span class="fold-icon">▼</span>`;
            
            currentGroupContent = document.createElement('div');
            currentGroupContent.className = 'list-group-content';

            header.onclick = () => {
                const icon = header.querySelector('.fold-icon');
                if (currentGroupContent.style.display === 'none') {
                    currentGroupContent.style.display = 'grid';
                    icon.innerText = '▼';
                } else {
                    currentGroupContent.style.display = 'none';
                    icon.innerText = '▶';
                }
            };

            container.appendChild(header);
            container.appendChild(currentGroupContent);
        }

        const catInfo = categoryMap[item.cat] || { label: '未知', class: 'cat-other' };

        // 尋找對應的子分類名稱
        let subcatBadge = '';
        const textColor = catInfo.customColor ? getContrastYIQ(catInfo.customColor) : '#ffffff';

        const itemSubcats = item.subcats || (item.subcat ? [item.subcat] : []);
        if (itemSubcats.length > 0 && catInfo.subcats) {
            itemSubcats.forEach(subId => {
                const subData = catInfo.subcats.find(s => s.id === subId);
                if (subData) {
                    subcatBadge += `<span class="category-badge ${catInfo.class || ''}" style="${catInfo.customColor ? `background-color:${catInfo.customColor}; color:${textColor}; opacity:0.8; margin-left:6px;` : 'opacity:0.8; margin-left:6px;'}">${subData.label}</span>`;
                }
            });
        }

        const card = document.createElement('div');
        card.className = 'item-card';
        card.style.cursor = 'pointer';
        const dateStr = createdDate.toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        // 如果有標題顯示標題，沒有的話就顯示日文內容的第一段
        const displayTitle = item.title ? `<span style="color:var(--color-grammar)">【${item.title}】</span><br>` : '';

        card.onclick = () => openDetail(item.id);
        card.innerHTML = `
            <div class="item-header">
                <div style="flex:1; display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
                    <span class="category-badge ${catInfo.class || ''}" style="${catInfo.customColor ? `background-color:${catInfo.customColor}; color:${textColor};` : ''}">${catInfo.label}</span>
                    ${subcatBadge}
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:12px; color:var(--text-sub);">${dateStr}</span>
                    <button class="delete-btn" onclick="deleteItem(${item.id}, event)" title="刪除">✖</button>
                </div>
            </div>
            <div class="jp-text line-clamp-3">${displayTitle}${item.jp}</div>
        `;
        if (currentGroupContent) {
            currentGroupContent.appendChild(card);
        } else {
            container.appendChild(card); // Fallback
        }
    });
}

function autoSave(id, field, value) {
    const index = jpData.findIndex(i => i.id === id);
    if (index > -1) {
        jpData[index][field] = value;
        saveToLocal();
    }
}

function openDetail(id) {
    const item = jpData.find(i => i.id === id);
    if (!item) return;
    const createdDate = item.createdAt ? new Date(item.createdAt) : new Date(item.id);
    const dateStr = createdDate.toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    document.getElementById('detailContainer').innerHTML = `
        <div class="item-header" style="margin-bottom:10px;">
            <span style="font-size:12px; color:var(--text-sub);">建立時間: ${dateStr}</span>
        </div>

        <div class="input-group" style="margin-bottom:8px;">
            <div style="display:flex; gap:8px;">
                <button class="action-btn" onclick="duplicateItem(${item.id})">衍生新筆記</button>
            </div>
        </div>

        <div class="input-group">
            <label>分類</label>
            <select id="detailCat_${item.id}" onchange="autoSave(${item.id}, 'cat', this.value); renderSubcategoryOptions('detailCat_${item.id}', 'detailSubcatPills_${item.id}', ${item.id}); autoSave(${item.id}, 'subcats', []);">
                ${Object.entries(categoryMap).map(([key, value]) => `<option value="${key}" ${item.cat === key ? 'selected' : ''}>${value.label}</option>`).join('')}
            </select>
            
            <label style="margin-top:10px;">子分類 (選填 - 可複選)</label>
            <div id="detailSubcatPills_${item.id}" style="display:flex; flex-wrap:wrap; gap:6px; min-height: 38px; padding: 5px 0;">
                <!-- 由 JS 動態生成 -->
            </div>
            <button class="action-btn" onclick="manageCategories()" style="margin-top: 8px;">管理分類</button>
        </div>

        <div class="input-group">
            <label>標題</label>
            <input type="text" value="${item.title || ''}" oninput="autoSave(${item.id}, 'title', this.value)" placeholder="這篇筆記的標題...">
        </div>

        ${(item.cat === 'vocab' || item.en !== undefined) ? `
        <div class="input-group">
            <label>英文內容</label>
            <div class="jp-action-bar">
                <button class="action-btn" onclick="playAudio('detailEn_${item.id}', 'en-US')" title="朗讀英文">🔊 朗讀英文</button>
                <button class="action-btn" onclick="copyToClipboard('detailEn_${item.id}')" style="background-color:var(--input-bg);">複製內容</button>
            </div>
            <textarea id="detailEn_${item.id}" oninput="autoResize(this); autoSave(${item.id}, 'en', this.value)" placeholder="例：The hotel can accommodate up to 500 guests.">${item.en || ''}</textarea>
        </div>` : ''}

        <div class="input-group">
            <label>日文內容</label>
            <div class="jp-action-bar">
                <select class="template-select" id="detailTemplateSelect"></select>
                <button class="action-btn" onclick="insertTemplate('detailJp_${item.id}', 'detailTemplateSelect', ${item.id})">插入模板</button>
                <button class="action-btn" onclick="manageTemplates()">管理模板</button>
                <button class="action-btn" onclick="copyToClipboard('detailJp_${item.id}')" style="background-color:var(--input-bg);">複製內容</button>
                ${item.cat === 'vocab' ? `<button class="action-btn" onclick="playAudio('detailJp_${item.id}', 'ja-JP')" title="朗讀日文">🔊 朗讀日文</button>` : ''}
            </div>
            <textarea id="detailJp_${item.id}" oninput="autoResize(this); autoSave(${item.id}, 'jp', this.value)" placeholder="例：お手数をおかけしますが">${item.jp || ''}</textarea>
        </div>

        <div class="input-group">
            <label>備註 / 中文解釋</label>
            <textarea id="detailNote_${item.id}" oninput="autoResize(this); autoSave(${item.id}, 'note', this.value)" placeholder="輸入中文解釋或使用情境...">${item.note || ''}</textarea>
        </div>
        
        <button onclick="deleteItem(${item.id})" style="margin-top:10px; width:100%; border:none; background-color:rgba(255,107,107,0.1); color:var(--color-danger); padding:15px; border-radius:10px; cursor:pointer; font-size:16px; font-weight:bold; transition:background-color 0.2s, transform 0.1s ease;">刪除此筆記</button>
    `;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.getElementById('tabList').classList.add('active');

    document.getElementById('pageTitle').innerText = '編輯筆記';
    document.getElementById('pageDetail').classList.add('active');
    window.scrollTo(0, 0);

    // 進入詳細頁面時，稍微延遲一下，自動撐高已經有內容的 textarea，同時渲染模板選單與子分類
    setTimeout(() => {
        autoResize(document.getElementById(`detailJp_${item.id}`));
        if (document.getElementById(`detailEn_${item.id}`)) autoResize(document.getElementById(`detailEn_${item.id}`));
        autoResize(document.getElementById(`detailNote_${item.id}`));
        renderSubcategoryOptions(`detailCat_${item.id}`, `detailSubcatPills_${item.id}`, item.id);
        renderTemplateSelects();
    }, 50);
}

// Keep track of which subcategories are currently selected in the Input Form
let currentInputSubcats = new Set();

function renderSubcategoryOptions(catSelectId, pillContainerId, itemId = null) {
    const catSelect = document.getElementById(catSelectId);
    const pillContainer = document.getElementById(pillContainerId);
    if (!catSelect || !pillContainer) return;

    const selectedCatId = catSelect.value;
    const catInfo = categoryMap[selectedCatId];

    pillContainer.innerHTML = '';
    
    // If it's the main input form, clear the set when category changes
    if (!itemId) {
        currentInputSubcats.clear();
    }

    if (!catInfo || !catInfo.subcats || catInfo.subcats.length === 0) {
        pillContainer.innerHTML = '<span style="color:var(--text-sub); font-size:13px; margin:auto 0;">無子分類設定</span>';
        return;
    }

    // Determine the current selected subcats array depending on context (Input vs Detail View)
    let activeSet = new Set();
    if (itemId) {
        const item = jpData.find(i => i.id === itemId);
        if (item && item.subcats && Array.isArray(item.subcats)) {
            activeSet = new Set(item.subcats);
        } else if (item && item.subcat) {
            // backwards compatibility for single subcat string
            activeSet = new Set([item.subcat]);
            item.subcats = [item.subcat]; 
        }
    } else {
        activeSet = currentInputSubcats;
    }

    catInfo.subcats.forEach(subcat => {
        const btn = document.createElement('button');
        const isActive = activeSet.has(subcat.id);
        btn.className = `pill-btn ${isActive ? 'active' : ''}`;
        btn.innerText = subcat.label;
        btn.onclick = (e) => {
            e.preventDefault();
            toggleSubcatPill(subcat.id, btn, itemId);
        };
        pillContainer.appendChild(btn);
    });
}

window.toggleSubcatPill = function(subcatId, btnEl, itemId = null) {
    btnEl.classList.toggle('active');
    const isNowActive = btnEl.classList.contains('active');

    if (itemId) {
        // Detail View logic
        const item = jpData.find(i => i.id === itemId);
        if (!item) return;
        let subcatsArray = item.subcats || [];
        if (!Array.isArray(subcatsArray)) {
            subcatsArray = item.subcat ? [item.subcat] : [];
        }

        if (isNowActive) {
            if (!subcatsArray.includes(subcatId)) subcatsArray.push(subcatId);
        } else {
            subcatsArray = subcatsArray.filter(id => id !== subcatId);
        }
        item.subcats = subcatsArray;
        saveToLocal();
    } else {
        // Main Input form logic
        if (isNowActive) {
            currentInputSubcats.add(subcatId);
        } else {
            currentInputSubcats.delete(subcatId);
        }
    }
}

// 初次進入頁面時渲染模板選項
renderCategories();
renderTemplateSelects();
renderCalendar();

// --- Calendar Logic ---

function changeCalendarMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

function selectCalendarDate(dateStr) {
    if (selectedCalendarDate === dateStr) {
        selectedCalendarDate = null; // Toggle off
    } else {
        selectedCalendarDate = dateStr; // Toggle on
    }
    renderCalendar();
    renderList();
}

function renderCalendar() {
    const calendarEl = document.getElementById('inlineCalendar');
    if (!calendarEl) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay(); // 0 is Sunday
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Find all unique dates that have notes
    const datesWithNotes = new Set();
    jpData.forEach(item => {
        const d = item.createdAt ? new Date(item.createdAt) : new Date(item.id);
        const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        datesWithNotes.add(dStr);
    });

    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

    let html = `
        <div class="calendar-header">
            <button onclick="changeCalendarMonth(-1)" title="上個月">&lt;</button>
            <span>${year}年 ${monthNames[month]}</span>
            <button onclick="changeCalendarMonth(1)" title="下個月">&gt;</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-name">日</div>
            <div class="calendar-day-name">一</div>
            <div class="calendar-day-name">二</div>
            <div class="calendar-day-name">三</div>
            <div class="calendar-day-name">四</div>
            <div class="calendar-day-name">五</div>
            <div class="calendar-day-name">六</div>
    `;

    // Empty cells before start of month
    for (let i = 0; i < startingDay; i++) {
        html += `<div class="calendar-cell empty"></div>`;
    }

    // Days of the month
    for (let i = 1; i <= totalDays; i++) {
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
        const isSelected = selectedCalendarDate === dateStr ? 'active' : '';
        const hasNote = datesWithNotes.has(dateStr) ? '<div class="dot"></div>' : '';
        
        html += `<div class="calendar-cell ${isSelected}" onclick="selectCalendarDate('${dateStr}')">
                    ${i}
                    ${hasNote}
                 </div>`;
    }

    html += `</div>`;
    calendarEl.innerHTML = html;
}

// --- Text to Speech (TTS) Logic ---
window.playAudio = function(elementId, lang = '') {
    const el = document.getElementById(elementId);
    if (!el || !el.value) return;
    playAudioText(el.value, lang);
};

window.playAudioText = function(text, lang = '') {
    if (!text || text.trim() === '') return;
    
    // Stop any currently playing audio
    window.speechSynthesis.cancel();

    // Remove markdown-like brackets for cleaner reading
    const cleanText = text.replace(/【.*?】/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (lang) {
        utterance.lang = lang;
    } else {
        // Attempt to auto-detect English vs Japanese based on character presence
        const hasKana = /[\u3040-\u309f\u30a0-\u30ff]/.test(cleanText);
        utterance.lang = hasKana ? 'ja-JP' : 'en-US';
    }
    
    // Slightly slower rate for better learning comprehension
    utterance.rate = 0.9;
    
    window.speechSynthesis.speak(utterance);
};
