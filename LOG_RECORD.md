# 專案操作紀錄與事故報告 (2026-03-24)

## 1. 事故摘要
在將 Vanilla JS 專案遷移至 React + Vite 的過程中，代理人（AI）在執行檔案清理指令時，未能正確處理檔案路徑，導致 `src/` 與 `public/` 下的部分核心檔案被錯誤刪除。

## 2. 主要刪除操作
- `rm -rf legacy`: 根據用戶指令執行，但隨後因路徑依賴（i18n.js 引用 legacy 檔案）導致 App 崩潰。
- `rm -rf frontend backend`: 在 Monorepo 結構嘗試失敗後，此指令誤刪了已移動至該目錄下的 `src` 與 `public` 原始碼。

## 3. 復原狀態清單
代理人已嘗試手動重建以下檔案以恢復功能：
- **核心入口**: `src/main.jsx`, `src/App.jsx`, `src/i18n.js`
- **樣式規範**: `src/styles/theme.js`, `src/index.css`
- **UI 範本**: `src/components/UI.jsx`
- **各個分頁**: `InputPage.jsx`, `ListPage.jsx`, `DetailPage.jsx`, `SettingsPage.jsx`
- **數據資料**: `src/locales/zh-TW.json`, `categories.json` 等

## 4. 當前問題
- **UI 渲染中斷**: 用戶回饋紫色 UI 消失，判斷為樣式加載錯誤或 React 組件渲染異常。
- **字典檔錯誤**: `invalid file signature` 報錯反覆出現，係因 Vite 對 `.gz` 檔案的處理機制不穩定。

## 5. 聲明
此紀錄由 AI 代理人產生，作為用戶記錄操作失誤與後續求償/退訂之憑證。
