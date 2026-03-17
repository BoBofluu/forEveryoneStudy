// js/categories.js

// ==== Category Selection & Management ====

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
        if (typeof handleCategoryChange === 'function') handleCategoryChange();
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

                if (typeof renderSubcategoryOptions === 'function') {
                    renderSubcategoryOptions(`detailCat_${itemId}`, `detailSubcat_${itemId}`, selectedSubcat);
                }
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

window.toggleAllCatFilters = function (selectAll) {
    if (selectAll) {
        selectedFilterCats = new Set(Object.keys(categoryMap));
    } else {
        selectedFilterCats.clear();
        selectedFilterSubcats.clear();
    }
    renderCategories();
    if (typeof renderList === 'function') renderList();
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
    if (typeof renderList === 'function') renderList();
};

window.toggleSubcatFilter = function (id, isChecked) {
    if (isChecked) selectedFilterSubcats.add(id);
    else selectedFilterSubcats.delete(id);
    if (typeof renderList === 'function') renderList();
};

window.renderSubcategoryOptions = function(catSelectId, pillContainerId, itemId = null) {
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
        const item = typeof jpData !== 'undefined' ? jpData.find(i => i.id === itemId) : null;
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

window.toggleSubcatPill = function (subcatId, btnEl, itemId = null) {
    btnEl.classList.toggle('active');
    const isNowActive = btnEl.classList.contains('active');

    if (itemId && typeof jpData !== 'undefined') {
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
        if (typeof saveToLocal === 'function') saveToLocal();
    } else {
        // Main Input form logic
        if (isNowActive) {
            currentInputSubcats.add(subcatId);
        } else {
            currentInputSubcats.delete(subcatId);
        }
    }
}

window.manageCategories = async function () {
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
        html: `
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
                <div style="display:flex; gap:8px;">
                    <button onclick="resetCategories()" style="background:var(--color-danger); border:none; color:white; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; flex:1;">重置為預設 (JSON)</button>
                    <button onclick="exportCategories()" style="background:var(--color-grammar); border:none; color:#121212; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; flex:1;">匯出分類 (JSON)</button>
                </div>
                <button onclick="importCategories()" style="background:var(--input-bg); border:1px solid #666; color:var(--text-main); padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">匯入自定義分類 JSON</button>
            </div>
            ${htmlContent}
        `,
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
        const pageListEl = document.getElementById('pageList');
        if (pageListEl && pageListEl.classList.contains('active') && typeof renderList === 'function') {
            renderList();
        }

        manageCategories();
    } else if (result.isDismissed) {
        manageCategories();
    }
};

window.deleteCategory = function (key) {
    // 檢查是否有筆記使用此分類
    const isUsed = typeof jpData !== 'undefined' && jpData.some(item => item.cat === key);
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
            if (typeof renderList === 'function') renderList();
            manageCategories();
        } else if (result.isDismissed) {
            manageCategories();
        }
    });
};

window.addNewCategory = async function () {
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

        localStorage.setItem('jpCategories', JSON.stringify(categoryMap));
        selectedFilterCats.add(newKey); // Add completely to checked list by default to preserve list updates
        renderCategories();
        if (typeof renderList === 'function') renderList();
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
        if (typeof renderList === 'function') renderList();
        manageCategories();
    } else if (result.isDismissed) {
        manageCategories();
    }
};

window.deleteSubcategory = function (parentKey, subId) {
    // 檢查是否有筆記正在使用這個子分類
    const isUsed = typeof jpData !== 'undefined' && jpData.some(item => item.cat === parentKey && item.subcat === subId);
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
            if (typeof renderList === 'function') renderList();
            manageCategories();
        } else if (result.isDismissed) {
            manageCategories();
        }
    });
};

// ==== Category Management Functions ====

async function resetCategories() {
    Swal.fire({
        title: '確定要重置分類嗎？',
        text: '這將會恢復到系統預設的分類設定（categories.json），您自定義的分類將會消失。',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        confirmButtonText: '重置',
        cancelButtonText: '取消'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('js/categories.json');
                if (!response.ok) throw new Error('無法讀取預設設定');
                categoryMap = await response.json();
                
                // 儲存並重新渲染
                if (typeof saveCategoriesToLocal === 'function') saveCategoriesToLocal();
                if (typeof renderCategories === 'function') renderCategories();
                
                Swal.fire('重置成功', '已恢復預設分類', 'success').then(() => {
                    manageCategories();
                });
            } catch (error) {
                Swal.fire('錯誤', '重置失敗: ' + error.message, 'error');
            }
        } else {
            manageCategories();
        }
    });
}

function exportCategories() {
    const dataStr = JSON.stringify(categoryMap, null, 4);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JapaneseWeb_Categories_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importCategories() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async event => {
            try {
                const importedCats = JSON.parse(event.target.result);
                if (typeof importedCats !== 'object' || Array.isArray(importedCats)) {
                    throw new Error('分類 JSON 格式不正確');
                }
                
                categoryMap = importedCats;
                if (typeof saveCategoriesToLocal === 'function') saveCategoriesToLocal();
                if (typeof renderCategories === 'function') renderCategories();
                
                Swal.fire('匯入成功', '分類已更新', 'success').then(() => {
                    manageCategories();
                });
            } catch (err) {
                Swal.fire('錯誤', '匯入失敗: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
