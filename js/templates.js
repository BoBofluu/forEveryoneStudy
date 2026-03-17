// js/templates.js

// ==== Template Selection Utilities ====

// 更新所有的 select 內容
function renderTemplateSelects() {
    let optionsHtml = '<option value="">(無)</option>';
    templates.forEach(t => {
        optionsHtml += `<option value="${t.id}">${t.name}</option>`;
    });

    const inputSelect = document.getElementById('inputTemplateSelect');
    if (inputSelect) inputSelect.innerHTML = optionsHtml;

    // 如果詳細頁面有開啟，也更新它
    const detailSelect = document.getElementById('detailTemplateSelect');
    if (detailSelect) detailSelect.innerHTML = optionsHtml;
}

window.manageTemplates = async function () {
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
};

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

window.addNewTemplate = async function () {
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

window.insertTemplate = function(targetInputId, selectId, itemId = null) {
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
        if (itemId && typeof autoSave === 'function') {
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
