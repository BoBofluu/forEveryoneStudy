// js/data.js

// ==== Global Data State & Initialization ====

// Initial setup for templates
let templates = JSON.parse(localStorage.getItem('jpTemplates')) || [];

// Main learning data array
let jpData = JSON.parse(localStorage.getItem('jpLearningData_v2')) || [];

// Category Map
let categoryMap = {};

// Preset Color Swatches
const PRESET_COLORS = [
    '#f87171', '#fb923c', '#fde047', '#4ade80', '#2dd4bf', 
    '#60a5fa', '#818cf8', '#c084fc', '#f472b6', '#a8a29e'
];

// Sets to track currently selected filters
let selectedFilterCats = new Set();
let selectedFilterSubcats = new Set();
let currentCatFilter = 'all';

let currentCalendarDate = new Date();
let selectedCalendarDate = null;
let currentInputSubcats = new Set();

// ==== Data Initialization (Hybrid Mode) ====
async function initData() {
    try {
        const localCats = localStorage.getItem('jpCategories');
        
        if (localCats) {
            // 1. 如果瀏覽器有紀錄，優先讀取自定義分類
            categoryMap = JSON.parse(localCats);
        } else {
            // 2. 如果是第一次開啟，讀取 JSON 檔案作為預設值
            const response = await fetch('js/categories.json');
            if (!response.ok) throw new Error('Failed to load categories.json');
            categoryMap = await response.json();
            
            // 初始存入 localStorage 方便後續修改
            localStorage.setItem('jpCategories', JSON.stringify(categoryMap));
        }
        
        selectedFilterCats = new Set(Object.keys(categoryMap));
        
    } catch (error) {
        console.error('Error initializing data:', error);
        categoryMap = { 'other': { label: '其他', class: 'cat-other', subcats: [] } };
        selectedFilterCats = new Set(['other']);
    }
}

// ==== Global Storage Utilities ====
function saveToLocal() {
    localStorage.setItem('jpLearningData_v2', JSON.stringify(jpData));
}

function saveCategoriesToLocal() {
    localStorage.setItem('jpCategories', JSON.stringify(categoryMap));
}
