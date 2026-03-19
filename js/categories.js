// js/categories.js

// ==== Category Management Logic ====

function renderCategories() {
    const catSelect = document.getElementById('categoryInput');
    if (catSelect) {
        let options = '';
        for (const [key, cat] of Object.entries(categoryMap)) {
            options += `<option value="${key}">${cat.label}</option>`;
        }
        catSelect.innerHTML = options;
        if (typeof handleCategoryChange === 'function') handleCategoryChange();
    }

    const filterContainer = document.querySelector('.pill-filters');
    if (filterContainer) {
        let filterHtml = `<button class="pill-btn ${currentCatFilter === 'all' ? 'active' : ''}" onclick="setCatFilter('all')" id="filterCat_all">${t('all')}</button>`;
        for (const [key, value] of Object.entries(categoryMap)) {
            filterHtml += `<button class="pill-btn ${currentCatFilter === key ? 'active' : ''}" onclick="setCatFilter('${key}')" id="filterCat_${key}">${value.label}</button>`;
        }
        filterContainer.innerHTML = filterHtml;
    }
}

window.renderSubcategoryOptions = function (parentSelectId, containerId, itemId = null) {
    const parentSelect = document.getElementById(parentSelectId);
    const container = document.getElementById(containerId);
    if (!parentSelect || !container) return;

    const catKey = parentSelect.value;
    const catData = categoryMap[catKey];
    container.innerHTML = '';

    if (catData && catData.subcats && catData.subcats.length > 0) {
        catData.subcats.forEach(sub => {
            const isSelected = itemId ? 
                (jpData.find(i => i.id === itemId)?.subcats || []).includes(sub.id) : 
                currentInputSubcats.has(sub.id);

            const pill = document.createElement('div');
            pill.className = `subcat-pill ${isSelected ? 'active' : ''}`;
            pill.innerText = sub.label;
            pill.onclick = () => toggleSubcatSelection(sub.id, pill, itemId);
            container.appendChild(pill);
        });
    } else {
        container.innerHTML = `<span style="color:var(--text-sub); font-size:13px; margin:auto 0;">(${t('msg_no_subcat')})</span>`;
    }
}

function toggleSubcatSelection(subId, pillEl, itemId = null) {
    if (itemId) {
        const item = jpData.find(i => i.id === itemId);
        if (item) {
            if (!item.subcats) item.subcats = [];
            const index = item.subcats.indexOf(subId);
            if (index > -1) item.subcats.splice(index, 1);
            else item.subcats.push(subId);
            pillEl.classList.toggle('active');
            saveToLocal();
        }
    } else {
        if (currentInputSubcats.has(subId)) {
            currentInputSubcats.delete(subId);
            pillEl.classList.remove('active');
        } else {
            currentInputSubcats.add(subId);
            pillEl.classList.add('active');
        }
    }
}

window.manageCategories = async function () {
    let htmlContent = `<div style="text-align:left; height:400px; overflow-y:auto; margin-top:10px;">`;
    for (const [key, value] of Object.entries(categoryMap)) {
        const textColor = value.customColor ? getContrastYIQ(value.customColor) : '#ffffff';
        htmlContent += `
        <div style="padding:10px; background-color:var(--bg-color); border: 2px solid var(--input-border); margin-bottom:12px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:10px;">
                    <span class="category-badge ${value.class || ''}" style="${value.customColor ? `background-color:${value.customColor}; color:${textColor};` : ''}">${value.label}</span>
                </div>
                <div>
                    <button onclick="editCategory('${key}')" style="background:var(--color-grammar); border:none; color:#121212; padding:6px 10px; border-radius:4px; margin-right:4px; cursor:pointer; font-size:13px;">${t('btn_edit')}</button>
                    <button onclick="deleteCategory('${key}')" style="background:var(--color-danger); border:none; color:white; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:13px;">${t('btn_delete')}</button>
                </div>
            </div>
            <div style="background:var(--input-bg); padding:10px; border-radius:6px; border: 1px solid var(--input-border);">
                <div style="font-size:13px; color:var(--text-sub); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span>${t('label_subcategory')} (${(value.subcats || []).length})</span>
                    <button onclick="addSubcategory('${key}')" style="background:transparent; border:1px solid var(--color-grammar); color:var(--color-grammar); padding:6px 12px; border-radius:12px; cursor:pointer; font-size:13px; font-weight:500;">${t('btn_add_subcat')}</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${(value.subcats || []).map(sub => `
                        <div style="display:flex; align-items:center; background:#444; border:none; color:#fff; padding:6px 10px; border-radius:12px; font-size:13px;">
                            <span style="margin-right:6px;">${sub.label}</span>
                            <span style="color:#ff6b6b; cursor:pointer; margin-left:4px; padding:0 4px; font-weight:bold; font-size:15px;" onclick="deleteSubcategory('${key}', '${sub.id}')">×</span>
                        </div>
                    `).join('')}
                    ${(value.subcats || []).length === 0 ? `<span style="font-size:13px; color:#999;">${t('msg_no_content')}</span>` : ''}
                </div>
            </div>
        </div>`;
    }
    htmlContent += '</div>';

    Swal.fire({
        title: t('btn_manage_category'),
        html: `
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
                <div style="display:flex; gap:8px;">
                    <button onclick="resetCategories()" style="background:var(--color-danger); border:none; color:white; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; flex:1;">${t('btn_reset_cat')}</button>
                    <button onclick="exportCategories()" style="background:var(--color-grammar); border:none; color:#121212; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; flex:1;">${t('btn_export_cat')}</button>
                </div>
                <button onclick="importCategories()" style="background:var(--input-bg); border:1px solid #666; color:var(--text-main); padding:8px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">${t('btn_import_cat')}</button>
            </div>
            ${htmlContent}
        `,
        width: '500px',
        showConfirmButton: true,
        confirmButtonText: t('btn_add_cat'),
        confirmButtonColor: '#4ade80',
        showCloseButton: true,
        customClass: { htmlContainer: 'custom-scroll-container' }
    }).then((result) => { if (result.isConfirmed) addNewCategory(); });
}

window.selectPresetColor = function (color) {
    const input = document.getElementById('swal-cat-color');
    if (input) input.value = color;
};

window.addNewCategory = async function () {
    const result = await Swal.fire({
        title: t('btn_add_cat'),
        html: `
            <div style="display:flex; flex-direction:column; gap:15px; text-align:left;">
                <input id="swal-cat-label" class="swal2-input" style="margin:0; width:100%;" placeholder="${t('placeholder_cat_name')}">
                <div style="display:flex; flex-wrap:wrap; gap:5px;">
                    ${PRESET_COLORS.map(c => `<div onclick="selectPresetColor('${c}')" style="width:24px; height:24px; background:${c}; border-radius:4px; cursor:pointer; border:1px solid rgba(255,255,255,0.1);"></div>`).join('')}
                </div>
                <input type="color" id="swal-cat-color" value="#4ade80" style="width:100%; height:40px; border:none; background:none; cursor:pointer; padding:0;">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: t('btn_confirm'),
        cancelButtonText: t('btn_cancel'),
        confirmButtonColor: '#4ade80',
        preConfirm: () => {
            const label = document.getElementById('swal-cat-label').value;
            const color = document.getElementById('swal-cat-color').value;
            if (!label.trim()) { Swal.showValidationMessage(t('msg_required_field')); return false; }
            return { label, color };
        }
    });
    if (result.isConfirmed) {
        const key = 'cat_' + Date.now();
        categoryMap[key] = { label: result.value.label, class: 'cat-custom', customColor: result.value.color, subcats: [] };
        saveCategoriesToLocal(); renderCategories(); manageCategories();
    } else manageCategories();
}

window.editCategory = async function (key) {
    const cat = categoryMap[key];
    if (!cat) return;
    const result = await Swal.fire({
        title: t('btn_edit'),
        html: `
            <div style="display:flex; flex-direction:column; gap:15px; text-align:left;">
                <input id="swal-cat-label" class="swal2-input" value="${cat.label}" style="margin:0; width:100%;">
                <div style="display:flex; flex-wrap:wrap; gap:5px;">
                    ${PRESET_COLORS.map(c => `<div onclick="selectPresetColor('${c}')" style="width:24px; height:24px; background:${c}; border-radius:4px; cursor:pointer; border:1px solid rgba(255,255,255,0.1);"></div>`).join('')}
                </div>
                <input type="color" id="swal-cat-color" value="${cat.customColor || '#4ade80'}" style="width:100%; height:40px; border:none; background:none; cursor:pointer; padding:0;">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: t('btn_confirm'),
        cancelButtonText: t('btn_cancel'),
        confirmButtonColor: '#4ade80',
        preConfirm: () => {
            const label = document.getElementById('swal-cat-label').value;
            const color = document.getElementById('swal-cat-color').value;
            if (!label.trim()) { Swal.showValidationMessage(t('msg_required_field')); return false; }
            return { label, color };
        }
    });
    if (result.isConfirmed) {
        cat.label = result.value.label;
        cat.customColor = result.value.color;
        saveCategoriesToLocal(); renderCategories(); if (typeof renderList === 'function') renderList(); manageCategories();
    } else manageCategories();
}

window.deleteCategory = function (key) {
    Swal.fire({
        title: t('msg_delete_confirm'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        confirmButtonText: t('btn_delete'),
        cancelButtonText: t('btn_cancel')
    }).then((result) => {
        if (result.isConfirmed) {
            delete categoryMap[key];
            saveCategoriesToLocal(); renderCategories(); if (typeof renderList === 'function') renderList(); manageCategories();
        } else manageCategories();
    });
}

window.addSubcategory = async function (catKey) {
    const result = await Swal.fire({
        title: t('btn_add_subcat'),
        input: 'text',
        inputPlaceholder: t('placeholder_cat_name'),
        showCancelButton: true,
        confirmButtonText: t('btn_confirm'),
        cancelButtonText: t('btn_cancel'),
        confirmButtonColor: '#4ade80'
    });
    if (result.isConfirmed) {
        if (!result.value || !result.value.trim()) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: t('msg_subcat_required'), showConfirmButton: false, timer: 1500 });
            manageCategories();
            return;
        }
        if (!categoryMap[catKey].subcats) categoryMap[catKey].subcats = [];
        categoryMap[catKey].subcats.push({ id: 'sub_' + Date.now(), label: result.value.trim() });
        saveCategoriesToLocal(); renderCategories(); manageCategories();
    } else manageCategories();
}

window.deleteSubcategory = function (parentKey, subId) {
    Swal.fire({
        title: t('msg_delete_confirm'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        confirmButtonText: t('btn_delete'),
        cancelButtonText: t('btn_cancel')
    }).then((result) => {
        if (result.isConfirmed) {
            categoryMap[parentKey].subcats = categoryMap[parentKey].subcats.filter(sub => sub.id !== subId);
            saveCategoriesToLocal(); renderCategories(); manageCategories();
        } else manageCategories();
    });
};

async function resetCategories() {
    Swal.fire({
        title: t('msg_reset_cat_confirm'),
        text: t('msg_reset_cat_text'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        confirmButtonText: t('btn_confirm'),
        cancelButtonText: t('btn_cancel')
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('js/categories.json');
                if (!response.ok) throw new Error(t('msg_load_default_fail'));
                categoryMap = await response.json();
                saveCategoriesToLocal(); renderCategories();
                Swal.fire(t('msg_import_success'), '', 'success').then(() => manageCategories());
            } catch (error) { Swal.fire('Error', error.message, 'error'); }
        } else manageCategories();
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
                categoryMap = JSON.parse(event.target.result);
                saveCategoriesToLocal(); renderCategories();
                Swal.fire(t('msg_import_success'), '', 'success').then(() => manageCategories());
            } catch (err) { Swal.fire(t('msg_import_fail'), err.message, 'error'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

