// js/ui.js

// ==== UI View Rendering and Navigation ====

function switchPage(pageName) {
    // --- 新增：切換頁面時自動停止朗讀 ---
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        if (typeof currentPlayingId !== 'undefined') currentPlayingId = null;
    }
    // --------------------------------

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

    const titleEl = document.getElementById('pageTitle');

    if (pageName === 'input') {
        document.getElementById('pageInput').classList.add('active');
        document.getElementById('tabInput').classList.add('active');
        titleEl.innerText = '新增日文筆記';

        // 重新計算 textarea 高度
        setTimeout(() => {
            if (typeof autoResize === 'function') {
                autoResize(document.getElementById('jpInput'));
                if (document.getElementById('enInput')) autoResize(document.getElementById('enInput'));
                autoResize(document.getElementById('noteInput'));
            }
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

window.toggleSearchCheckboxes = function(state) {
    const container = document.getElementById('searchOptionsContainer');
    if (!container) return;
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = state);
    renderList();
};

window.openFilterModal = function() {
    let html = `
        <div class="filter-modal-content" style="text-align:left; max-height:500px; overflow-y:auto; padding:15px; background:var(--bg-color);">
            <div style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; font-size:18px; color:var(--text-main);">篩選分類</h3>
                    <div style="display:flex; gap:10px;">
                        <button onclick="toggleAllFilters(true)" style="background:var(--color-grammar); border:none; color:#121212; padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer; font-weight:bold;">全選</button>
                        <button onclick="toggleAllFilters(false)" style="background:var(--color-danger); border:none; color:white; padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer; font-weight:bold;">清除</button>
                    </div>
                </div>
                
                ${Object.entries(categoryMap).map(([key, value]) => {
                    const isCatChecked = selectedFilterCats.has(key) ? 'checked' : '';
                    const catColor = value.customColor || 'var(--color-grammar)';
                    return `
                    <div style="margin-bottom:25px; background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; border:1px solid #333;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <label style="display:flex; align-items:center; cursor:pointer; font-size:16px; font-weight:bold; color:var(--text-main); margin:0;">
                                <input type="checkbox" data-cat="${key}" onchange="handleCatToggle('${key}', this.checked)" ${isCatChecked} style="width:20px; height:20px; margin-right:10px;">
                                <span class="category-badge ${value.class || ''}" style="background-color:${catColor}; color:#000;">${value.label}</span>
                            </label>
                            <div style="display:flex; gap:8px;">
                                <button onclick="toggleSubcatInCat('${key}', true)" style="font-size:11px; background:#555; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">子全選</button>
                                <button onclick="toggleSubcatInCat('${key}', false)" style="font-size:11px; background:#555; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">子清除</button>
                            </div>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:10px; padding-left:5px;">
                            ${(value.subcats || []).map(sub => {
                                const isSubChecked = selectedFilterSubcats.has(sub.id) ? 'checked' : '';
                                return `
                                <label class="pill-checkbox" style="display:flex; align-items:center; cursor:pointer; font-size:13px; color:var(--text-sub); background:rgba(255,255,255,0.05); padding:6px 12px; border-radius:20px; border:1px solid #444; transition: 0.2s;">
                                    <input type="checkbox" data-cat-parent="${key}" data-sub="${sub.id}" onchange="handleSubcatToggle('${sub.id}', this.checked); this.parentElement.style.borderColor = this.checked ? 'var(--color-grammar)' : '#444';" ${isSubChecked} style="width:auto; margin-right:6px;">
                                    ${sub.label}
                                </label>
                                `;
                            }).join('')}
                            ${(value.subcats || []).length === 0 ? '<span style="font-size:12px; color:#666; font-style:italic;">(此分類無子分類)</span>' : ''}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    Swal.fire({
        title: null, // 移除預設標題
        html: html,
        width: '600px',
        showConfirmButton: true,
        confirmButtonText: '完成篩選',
        confirmButtonColor: 'var(--color-grammar)',
        showCloseButton: true,
        customClass: {
            htmlContainer: 'custom-scroll-container'
        }
    }).then(() => {
        renderList();
    });
};

// 彈窗內的連動邏輯
window.handleCatToggle = function(catKey, checked) {
    if (checked) selectedFilterCats.add(catKey);
    else selectedFilterCats.delete(catKey);
};

window.handleSubcatToggle = function(subId, checked) {
    if (checked) selectedFilterSubcats.add(subId);
    else selectedFilterSubcats.delete(subId);
};

window.toggleAllFilters = function(state) {
    for (let k in categoryMap) {
        if (state) {
            selectedFilterCats.add(k);
            (categoryMap[k].subcats || []).forEach(s => selectedFilterSubcats.add(s.id));
        } else {
            selectedFilterCats.delete(k);
            (categoryMap[k].subcats || []).forEach(s => selectedFilterSubcats.delete(s.id));
        }
    }
    // 更新彈窗內的 checkbox 狀態
    document.querySelectorAll('.filter-modal-content input[type="checkbox"]').forEach(cb => cb.checked = state);
};

window.toggleSubcatInCat = function(catKey, state) {
    const catData = categoryMap[catKey];
    if (!catData || !catData.subcats) return;
    
    catData.subcats.forEach(s => {
        if (state) selectedFilterSubcats.add(s.id);
        else selectedFilterSubcats.delete(s.id);
    });
    
    // 更新彈窗內該分類下的子 checkbox
    document.querySelectorAll(`.filter-modal-content input[data-cat-parent="${catKey}"]`).forEach(cb => cb.checked = state);
};

function renderList() {
    const container = document.getElementById('listContainer');
    if (!document.getElementById('pageList').classList.contains('active')) return;

    if (typeof jpData === 'undefined') return;

    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const sTitle = document.getElementById('searchTitle').checked;
    const sCat = document.getElementById('searchCat').checked;
    const sJp = document.getElementById('searchJp').checked;
    const sEn = document.getElementById('searchEn').checked;
    const sNote = document.getElementById('searchNote').checked;
    const sSubcat = document.getElementById('searchSubcat').checked;
    const sortOrder = document.getElementById('sortOrder').value;

    container.innerHTML = '';

    let filteredData = jpData.filter(item => {
        // 第一層過濾：主分類
        if (selectedFilterCats.size > 0 && !selectedFilterCats.has(item.cat)) {
            return false;
        }

        // 第二層過濾：子分類 (如果該主分類下有選中的子分類)
        if (selectedFilterSubcats.size > 0) {
            const catData = categoryMap[item.cat];
            if (catData && catData.subcats && catData.subcats.length > 0) {
                // 檢查該分類下的子分類是否有任何一個被勾選
                const selectedSubcatsForThisCat = catData.subcats.filter(sub => selectedFilterSubcats.has(sub.id));
                
                if (selectedSubcatsForThisCat.length > 0) {
                    const itemSubcats = item.subcats || (item.subcat ? [item.subcat] : []);
                    const matchesSelectedSubcat = itemSubcats.some(subId => selectedFilterSubcats.has(subId));
                    if (!matchesSelectedSubcat) return false;
                }
            }
        }

        // 第三層過濾：日期多選過濾
        const createdDate = item.createdAt ? new Date(item.createdAt) : new Date(item.id);
        const dateStr = createdDate.getFullYear() + '-' + String(createdDate.getMonth() + 1).padStart(2, '0') + '-' + String(createdDate.getDate()).padStart(2, '0');

        if (selectedDates.size > 0 && !selectedDates.has(dateStr)) {
            return false;
        }

        // 第四層過濾：關鍵字
        if (!keyword) return true;
        let match = false;
        if (sTitle && item.title && item.title.toLowerCase().includes(keyword)) match = true;
        if (sCat && categoryMap[item.cat] && categoryMap[item.cat].label.toLowerCase().includes(keyword)) match = true;
        if (sJp && item.jp && item.jp.toLowerCase().includes(keyword)) match = true;
        if (sEn && item.en && item.en.toLowerCase().includes(keyword)) match = true;
        if (sNote && item.note && item.note.toLowerCase().includes(keyword)) match = true;

        // 子分類關鍵字搜尋
        if (sSubcat) {
            const itemSubcats = item.subcats || (item.subcat ? [item.subcat] : []);
            if (itemSubcats.length > 0 && categoryMap[item.cat] && categoryMap[item.cat].subcats) {
                const hasSubcatMatch = itemSubcats.some(subId => {
                    const subData = categoryMap[item.cat].subcats.find(s => s.id === subId);
                    return subData && subData.label.toLowerCase().includes(keyword);
                });
                if (hasSubcatMatch) match = true;
            }
        }

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
            <div class="jp-text line-clamp-3">${displayTitle}${item.jp || item.en || ''}</div>
        `;
        if (currentGroupContent) {
            currentGroupContent.appendChild(card);
        } else {
            container.appendChild(card); // Fallback
        }
    });
}

// 全域狀態
let tokenizer = null;
let isInitializingTokenizer = false;

// 【核心優化】獨立初始化函式
window.initFuriganaEngine = function() {
    if (tokenizer || isInitializingTokenizer) return;
    
    isInitializingTokenizer = true;
    console.log("AI 引擎正在背景熱機中...");
    
    if (typeof kuromoji === 'undefined') {
        console.error("Kuromoji 庫未載入");
        isInitializingTokenizer = false;
        return;
    }

    kuromoji.builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/" }).build((err, _tokenizer) => {
        if (err) {
            console.error("AI 引擎熱機失敗:", err);
            isInitializingTokenizer = false;
        } else {
            tokenizer = _tokenizer;
            isInitializingTokenizer = false;
            console.log("AI 引擎熱機完成，隨時可以使用。");
        }
    });
};

window.toggleFurigana = async function (itemId) {
    const textarea = document.getElementById(`detailJp_${itemId}`);
    const displayBox = document.getElementById(`furiganaBox_${itemId}`);
    const btn = document.getElementById(`btn_toggleFurigana_${itemId}`);
    
    if (!textarea || !displayBox || !btn) return;

    const isHidden = window.getComputedStyle(displayBox).display === 'none';

    if (isHidden) {
        let text = textarea.value;
        if (!text) {
            displayBox.innerHTML = '<span style="color:#888;">(無內容)</span>';
            switchToDisplay();
            return;
        }

        // 如果引擎還沒好，提醒使用者
        if (!tokenizer) {
            if (isInitializingTokenizer) {
                Swal.fire({ icon: 'info', title: 'AI 引擎熱機中', text: '第一次使用需要約 5-10 秒載入辭典，請稍候再試。', timer: 2000, showConfirmButton: false });
            } else {
                initFuriganaEngine();
                Swal.fire({ icon: 'warning', title: '引擎未啟動', text: '正在嘗試重新啟動 AI 引擎，請稍等。' });
            }
            return;
        }

        btn.innerText = '分析中...';
        btn.disabled = true;

        try {
            // 因為 tokenizer 已經預載好了，這裡的 tokenize() 動作會非常快，不會當機
            const analyzedHtml = processText(text);
            displayBox.innerHTML = `<div lang="ja" class="notranslate">${analyzedHtml}</div>`;
            switchToDisplay();
        } catch (err) {
            console.error("分析失敗:", err);
            btn.innerText = '顯示平假名';
            btn.disabled = false;
        }

        function switchToDisplay() {
            textarea.style.display = 'none';
            displayBox.style.display = 'block';
            btn.innerText = '編輯原文';
            btn.style.backgroundColor = 'var(--color-grammar)';
            btn.style.color = '#121212';
            btn.disabled = false;
        }
    } else {
        displayBox.style.display = 'none';
        textarea.style.display = 'block';
        btn.innerText = '顯示平假名';
        btn.style.backgroundColor = 'var(--input-bg)';
        btn.style.color = 'var(--text-main)';
        if (typeof autoResize === 'function') autoResize(textarea);
    }
};

// 獨立出的處理函式
function processText(rawText) {
    if (!tokenizer) return rawText;
    const tokens = tokenizer.tokenize(rawText);
    let html = "";
    tokens.forEach(token => {
        const hasKanji = /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(token.surface_form);
        if (hasKanji && token.reading && token.reading !== '*') {
            const reading = katakanaToHiragana(token.reading);
            if (reading !== token.surface_form) {
                html += `<ruby><rb>${token.surface_form}</rb><rt>${reading}</rt></ruby>`;
            } else {
                html += token.surface_form;
            }
        } else {
            html += token.surface_form;
        }
    });
    return html.replace(/\n/g, '<br>');
}

// 片假名轉平假名工具
function katakanaToHiragana(src) {
    return src.replace(/[\u30a1-\u30f6]/g, function (match) {
        const chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
    });
}

window.toggleEnInput = function (itemId) {
    const section = document.getElementById(`enInputGroup_${itemId}`);
    const btn = document.getElementById(`btn_toggleEn_${itemId}`);
    if (!section || !btn) return;
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        btn.innerText = '隱藏英文欄位';
        const textarea = document.getElementById(`detailEn_${itemId}`);
        if (textarea && typeof autoResize === 'function') autoResize(textarea);
    } else {
        section.style.display = 'none';
        btn.innerText = '顯示英文欄位';
    }
};

function openDetail(id) {
    // --- 新增：點開詳細頁面時自動停止原本的朗讀 ---
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        if (typeof currentPlayingId !== 'undefined') currentPlayingId = null;
    }
    // --------------------------------

    const item = jpData.find(i => i.id === id);
    if (!item) return;
    const createdDate = item.createdAt ? new Date(item.createdAt) : new Date(item.id);
    const dateStr = createdDate.toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    document.getElementById('detailContainer').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; gap:8px;">
                <button class="action-btn" onclick="duplicateItem(${item.id})">衍生新筆記</button>
                <button class="action-btn" onclick="exportItem(${item.id})" style="background-color:var(--color-grammar); color:#121212;">匯出此筆記</button>
                <button id="btn_toggleEn_${item.id}" class="action-btn" onclick="toggleEnInput(${item.id})" style="background-color:var(--input-bg); border:1px solid #555;">${item.en ? '隱藏英文欄位' : '顯示英文欄位'}</button>
            </div>
            <span style="font-size:12px; color:var(--text-sub);">建立時間: ${dateStr}</span>
        </div>

        <div class="input-group" style="display: flex; gap: 30px; margin-bottom: 20px; flex-wrap: wrap;">
            <!-- 左欄：分類 (50%) -->
            <div style="flex: 1; min-width: 300px;">
                <label style="display: block; margin-bottom: 10px;">分類</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select id="detailCat_${item.id}" onchange="autoSave(${item.id}, 'cat', this.value); renderSubcategoryOptions('detailCat_${item.id}', 'detailSubcatPills_${item.id}', ${item.id}); autoSave(${item.id}, 'subcats', []);" style="flex: 1; height: 38px; margin-bottom: 0; padding: 6px 12px;">
                        ${Object.entries(categoryMap).map(([key, value]) => `<option value="${key}" ${item.cat === key ? 'selected' : ''}>${value.label}</option>`).join('')}
                    </select>
                    <button class="action-btn" onclick="manageCategories()" style="font-size: 13px; height: 38px; padding: 0 15px; background-color: var(--input-bg); border: 1px solid #555; white-space: nowrap;">管理分類</button>
                </div>
            </div>

            <!-- 右欄：子分類 (50%) -->
            <div style="flex: 1; min-width: 300px;">
                <label style="display: block; margin-bottom: 10px;">子分類 (選填 - 可複選)</label>
                <div id="detailSubcatPills_${item.id}" style="display: flex; flex-wrap: wrap; gap: 6px; min-height: 38px; align-items: center;">
                </div>
            </div>
        </div>

        <div class="input-group">
            <label>標題</label>
            <input type="text" value="${item.title || ''}" oninput="autoSave(${item.id}, 'title', this.value)" placeholder="這篇筆記的標題...">
        </div>

        <div id="enInputGroup_${item.id}" style="display: ${item.en ? 'block' : 'none'}; margin-bottom: 20px;">
            <label>英文內容</label>
            <div class="jp-action-bar" style="margin-top: 8px;">
                <button class="action-btn" onclick="copyToClipboard('detailEn_${item.id}')" style="background-color:var(--input-bg);">複製內容</button>
                    <button id="btn_detailEnUS_${item.id}" class="action-btn" onclick="playAudio('detailEn_${item.id}', 'en-US', document.getElementById('ttsRateEn_${item.id}').value)" title="朗讀/暫停美式">🇺🇸 朗讀(美式)</button>
                    <button id="btn_detailEnGB_${item.id}" class="action-btn" onclick="playAudio('detailEn_${item.id}', 'en-GB', document.getElementById('ttsRateEn_${item.id}').value)" title="朗讀/暫停英式">🇬🇧 朗讀(英式)</button>
                    <button id="btn_detailEnAU_${item.id}" class="action-btn" onclick="playAudio('detailEn_${item.id}', 'en-AU', document.getElementById('ttsRateEn_${item.id}').value)" title="朗讀/暫停澳式">🇦🇺 朗讀(澳式)</button>
                    
                    <div style="display:flex; align-items:center; gap:10px; margin-left:2px; background:var(--input-bg); padding:6px 12px; border-radius:8px; border:1px solid #444;">
                        <span style="font-size:14px; color:var(--text-sub);">語速</span>
                        <input type="range" id="ttsRateEn_${item.id}" min="0.5" max="1.5" step="0.25" value="1.0" list="steplist_en_${item.id}" style="width:130px; height:10px; padding:0; background:var(--color-grammar); accent-color:var(--color-grammar); cursor:pointer;" oninput="document.getElementById('ttsRateValEn_${item.id}').innerText = Number(this.value).toFixed(2).replace(/\\.?0+$/, '') + 'x'">
                        <datalist id="steplist_en_${item.id}">
                            <option value="0.5"></option>
                            <option value="0.75"></option>
                            <option value="1.0"></option>
                            <option value="1.25"></option>
                            <option value="1.5"></option>
                        </datalist>
                        <span id="ttsRateValEn_${item.id}" style="font-size:14px; font-weight:bold; color:var(--text-main); width:48px; display:inline-block; text-align:right;">1x</span>
                    </div>
                </div>
                <textarea id="detailEn_${item.id}" oninput="autoResize(this); autoSave(${item.id}, 'en', this.value)" placeholder="例：The hotel can accommodate up to 500 guests.">${item.en || ''}</textarea>
            </div>
        </div>

        <div class="input-group">
            <label>日文內容</label>
            <div class="jp-action-bar">
                <button class="action-btn" onclick="copyToClipboard('detailJp_${item.id}')" style="background-color:var(--input-bg);">複製內容</button>
                <button id="btn_toggleFurigana_${item.id}" class="action-btn" onclick="toggleFurigana(${item.id})" style="background-color:var(--input-bg);">顯示平假名</button>
                <select class="template-select" id="detailTemplateSelect" style="padding:4px 8px;"></select>
                <button class="action-btn" onclick="insertTemplate('detailJp_${item.id}', 'detailTemplateSelect', ${item.id})">插入模板</button>
                <button class="action-btn" onclick="manageTemplates()">管理模板</button>
                ${item.cat === 'vocab' || item.jp ? `
                <button id="btn_detailJp_${item.id}" class="action-btn" onclick="playAudio('detailJp_${item.id}', 'ja-JP', document.getElementById('ttsRateJp_${item.id}').value)" title="朗讀/暫停日文">🔊 朗讀</button>
                <div style="display:flex; align-items:center; gap:10px; margin-left:2px; background:var(--input-bg); padding:6px 12px; border-radius:8px; border:1px solid #444;">
                    <span style="font-size:14px; color:var(--text-sub);">語速</span>
                    <input type="range" id="ttsRateJp_${item.id}" min="0.5" max="1.5" step="0.25" value="1.0" list="steplist_jp_${item.id}" style="width:130px; height:10px; padding:0; background:var(--color-grammar); accent-color:var(--color-grammar); cursor:pointer;" oninput="document.getElementById('ttsRateValJp_${item.id}').innerText = Number(this.value).toFixed(2).replace(/\\.?0+$/, '') + 'x'">
                    <datalist id="steplist_jp_${item.id}">
                        <option value="0.5"></option>
                        <option value="0.75"></option>
                        <option value="1.0"></option>
                        <option value="1.25"></option>
                        <option value="1.5"></option>
                    </datalist>
                    <span id="ttsRateValJp_${item.id}" style="font-size:14px; font-weight:bold; color:var(--text-main); width:48px; display:inline-block; text-align:right;">1x</span>
                </div>
                ` : ''}
            </div>
            <div id="furiganaBox_${item.id}" class="furigana-display-box"></div>
            <textarea id="detailJp_${item.id}" oninput="autoResize(this); autoSave(${item.id}, 'jp', this.value)" placeholder="例：昨日[きのう]は暑[あつ]かった。">${item.jp || ''}</textarea>
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
        if (typeof autoResize === 'function') {
            if (document.getElementById(`detailJp_${item.id}`)) autoResize(document.getElementById(`detailJp_${item.id}`));
            if (document.getElementById(`detailEn_${item.id}`)) autoResize(document.getElementById(`detailEn_${item.id}`));
            if (document.getElementById(`detailNote_${item.id}`)) autoResize(document.getElementById(`detailNote_${item.id}`));
        }
        if (typeof renderSubcategoryOptions === 'function') renderSubcategoryOptions(`detailCat_${item.id}`, `detailSubcatPills_${item.id}`, item.id);
        if (typeof renderTemplateSelects === 'function') renderTemplateSelects();
    }, 50);
}

// --- Calendar Logic ---

window.changeCalendarMonth = function(delta) {
    if (typeof currentCalendarDate === 'undefined') return;
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

window.selectCalendarDate = function(dateStr) {
    if (selectedDates.has(dateStr)) {
        selectedDates.delete(dateStr);
    } else {
        selectedDates.add(dateStr);
    }
    
    renderCalendar();
    renderList();
}

window.renderCalendar = function() {
    const calendarEl = document.getElementById('inlineCalendar');
    if (!calendarEl || typeof currentCalendarDate === 'undefined') return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    const datesWithNotes = new Set();
    jpData.forEach(item => {
        const d = item.createdAt ? new Date(item.createdAt) : new Date(item.id);
        const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        datesWithNotes.add(dStr);
    });

    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

    let html = `
        <div class="calendar-header">
            <button onclick="changeCalendarMonth(-1)">&lt;</button>
            <span>${year}年 ${monthNames[month]}</span>
            <button onclick="changeCalendarMonth(1)">&gt;</button>
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

    for (let i = 0; i < startingDay; i++) {
        html += `<div class="calendar-cell empty"></div>`;
    }

    for (let i = 1; i <= totalDays; i++) {
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
        const isActive = selectedDates.has(dateStr) ? 'active' : '';
        const hasNote = datesWithNotes.has(dateStr) ? '<div class="dot"></div>' : '';

        html += `<div class="calendar-cell ${isActive}" onclick="selectCalendarDate('${dateStr}')">
                    ${i}
                    ${hasNote}
                 </div>`;
    }

    html += `</div>`;
    calendarEl.innerHTML = html;
}
