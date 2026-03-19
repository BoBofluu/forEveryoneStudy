// js/templates.js

// ==== Template Selection Utilities ====

// 更新所有的 select 內容
function renderTemplateSelects() {
    let optionsHtml = `<option value="">(${t('msg_no_content')})</option>`;
    templates.forEach(tpl => {
        optionsHtml += `<option value="${tpl.id}">${tpl.name}</option>`;
    });

    const inputSelect = document.getElementById('inputTemplateSelect');
    if (inputSelect) inputSelect.innerHTML = optionsHtml;

    // 如果詳細頁面有開啟，也更新它
    const detailSelect = document.getElementById('detailTemplateSelect');
    if (detailSelect) detailSelect.innerHTML = optionsHtml;
}

window.manageTemplates = async function () {
    let htmlContent = '<div style="text-align:left; height:400px; overflow-y:auto; margin-top:10px;">';
    if (templates.length === 0) {
        htmlContent += `<div style="text-align:center; color:var(--text-sub); padding:40px 0;">${t('msg_no_template')}</div>`;
    } else {
        templates.forEach(tpl => {
            htmlContent += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background-color:var(--input-bg); margin-bottom:8px; border-radius:8px;">
                <div style="flex-grow:1; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:10px;">${tpl.name}</div>
                <div>
                    <button onclick="editSingleTemplate('${tpl.id}')" style="background:var(--color-grammar); border:none; color:#121212; padding:5px 10px; border-radius:5px; margin-right:5px; cursor:pointer;">${t('btn_edit')}</button>
                    <button onclick="deleteSingleTemplate('${tpl.id}')" style="background:var(--color-danger); border:none; color:white; padding:5px 10px; border-radius:5px; cursor:pointer;">${t('btn_delete')}</button>
                </div>
            </div>`;
        });
    }
    htmlContent += '</div>';

    const result = await Swal.fire({
        title: t('btn_manage_template'),
        html: htmlContent,
        width: '500px',
        showConfirmButton: true,
        confirmButtonText: t('btn_add_template'),
        confirmButtonColor: '#4ade80',
        showCloseButton: true,
        customClass: { htmlContainer: 'custom-scroll-container' }
    });
    if (result.isConfirmed) addNewTemplate();
};

window.editSingleTemplate = async function (id) {
    const target = templates.find(tpl => tpl.id === id);
    if (!target) return;

    const result = await Swal.fire({
        title: t('btn_edit'),
        html:
            `<div style="height:400px; display:flex; flex-direction:column; gap:10px;">` +
            `<input id="swal-template-name" class="swal2-input" value="${target.name}" style="margin:0; width:100%;">` +
            `<textarea id="swal-template-content" class="swal2-textarea" style="margin:0; width:100%; flex-grow:1; resize:none;">${target.content}</textarea>` +
            `</div>`,
        width: '500px',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#4ade80',
        confirmButtonText: t('btn_confirm'),
        cancelButtonText: t('btn_cancel'),
        preConfirm: () => {
            const name = document.getElementById('swal-template-name').value;
            const content = document.getElementById('swal-template-content').value;
            if (!name.trim() || !content.trim()) {
                Swal.showValidationMessage(t('msg_required_field'));
                return false;
            }
            return { name, content };
        }
    });

    if (result.isConfirmed && result.value) {
        target.name = result.value.name;
        target.content = result.value.content;
        localStorage.setItem('jpTemplates', JSON.stringify(templates));
        renderTemplateSelects();
    }
    manageTemplates();
};

window.deleteSingleTemplate = function (id) {
    Swal.fire({
        title: t('msg_delete_confirm'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6b6b',
        confirmButtonText: t('btn_delete'),
        cancelButtonText: t('btn_cancel')
    }).then((result) => {
        if (result.isConfirmed) {
            templates = templates.filter(tpl => tpl.id !== id);
            localStorage.setItem('jpTemplates', JSON.stringify(templates));
            renderTemplateSelects();
        }
        manageTemplates();
    });
};

window.addNewTemplate = async function () {
    const result = await Swal.fire({
        title: t('btn_add_template'),
        html:
            `<div style="height:400px; display:flex; flex-direction:column; gap:10px;">` +
            `<input id="swal-template-name" class="swal2-input" placeholder="${t('label_title')}" style="margin:0; width:100%;">` +
            `<textarea id="swal-template-content" class="swal2-textarea" placeholder="${t('placeholder_content')}" style="margin:0; width:100%; flex-grow:1; resize:none;"></textarea>` +
            `</div>`,
        width: '500px',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#4ade80',
        cancelButtonColor: '#3f3f3f',
        confirmButtonText: t('btn_confirm'),
        cancelButtonText: t('btn_cancel'),
        preConfirm: () => {
            const name = document.getElementById('swal-template-name').value;
            const content = document.getElementById('swal-template-content').value;
            if (!name.trim() || !content.trim()) {
                Swal.showValidationMessage(t('msg_required_field'));
                return false;
            }
            return { name, content };
        }
    });

    if (result.isConfirmed && result.value) {
        templates.push({ id: 'tpl_' + Date.now(), name: result.value.name, content: result.value.content });
        localStorage.setItem('jpTemplates', JSON.stringify(templates));
        renderTemplateSelects();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: t('msg_save_success'), showConfirmButton: false, timer: 1500 });
    }
    manageTemplates();
};

window.insertTemplate = function(targetInputId, selectId, itemId = null) {
    const textArea = document.getElementById(targetInputId);
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;

    const selectedTemplateId = selectEl.value;
    if (!selectedTemplateId) {
        return;
    }

    const template = templates.find(tpl => tpl.id === selectedTemplateId);
    if (!template) return;

    const doInsert = () => {
        textArea.value = template.content;
        autoResize(textArea);
        if (itemId && typeof autoSave === 'function') {
            autoSave(itemId, 'jp', textArea.value);
        }
    };

    if (textArea.value.trim() !== '') {
        Swal.fire({
            title: t('btn_confirm'),
            text: t('msg_insert_template_confirm'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6b6b',
            cancelButtonColor: '#3f3f3f',
            confirmButtonText: t('btn_confirm'),
            cancelButtonText: t('btn_cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                doInsert();
            }
        });
    } else {
        doInsert();
    }
}
