import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight, CheckSquare, Square, Filter, X } from 'lucide-react';
import { clsx } from 'clsx';
import MiniCalendar from '../components/MiniCalendar';
import { theme } from '../styles/theme';

function ListPage({ words, categories, onViewDetail, onDelete }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [currentCatFilters, setCurrentCatFilters] = useState(new Set(['all'])); 
  const [selectedSubcats, setSelectedSubcats] = useState(new Set()); 
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchOptions, setSearchOptions] = useState({ title: true, category: true, subcat: true, en: true, jp: true, note: true });

  const toggleCatFilter = (id) => {
    const newFilters = new Set(currentCatFilters);
    if (id === 'all') { newFilters.clear(); newFilters.add('all'); }
    else {
        newFilters.delete('all');
        if (newFilters.has(id)) { newFilters.delete(id); if (newFilters.size === 0) newFilters.add('all'); }
        else newFilters.add(id);
    }
    setCurrentCatFilters(newFilters);
  };

  const toggleSearchOption = (key) => setSearchOptions(prev => ({ ...prev, [key]: !prev[key] }));
  const handleToggleAllOptions = (value) => {
    const newOptions = {};
    Object.keys(searchOptions).forEach(key => newOptions[key] = value);
    setSearchOptions(newOptions);
  };

  const toggleDate = (dateStr) => {
    const newSet = new Set(selectedDates);
    if (newSet.has(dateStr)) newSet.delete(dateStr);
    else newSet.add(dateStr);
    setSelectedDates(newSet);
  };

  const toggleSubcatFilter = (subId) => {
    const newSet = new Set(selectedSubcats);
    if (newSet.has(subId)) newSet.delete(subId);
    else newSet.add(subId);
    setSelectedSubcats(newSet);
  };

  const filteredWords = useMemo(() => {
    let result = [...words];
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(w => {
        const matchesTitle = searchOptions.title && w.title?.toLowerCase().includes(lowerSearch);
        const matchesCat = searchOptions.category && categories[w.category]?.label?.toLowerCase().includes(lowerSearch);
        const matchesSubcat = searchOptions.subcat && w.subcategories?.some(subId => {
            const subLabel = categories[w.category]?.subcats?.find(s => s.id === subId)?.label;
            return subLabel?.toLowerCase().includes(lowerSearch);
        });
        const matchesEn = searchOptions.en && w.en_content?.toLowerCase().includes(lowerSearch);
        const matchesJp = searchOptions.jp && w.jp_content?.toLowerCase().includes(lowerSearch);
        const matchesNote = searchOptions.note && w.note?.toLowerCase().includes(lowerSearch);
        return matchesTitle || matchesCat || matchesSubcat || matchesEn || matchesJp || matchesNote;
      });
    }
    if (!currentCatFilters.has('all')) result = result.filter(w => currentCatFilters.has(w.category));
    if (selectedSubcats.size > 0) result = result.filter(w => w.subcategories?.some(subId => selectedSubcats.has(subId)));
    if (selectedDates.size > 0) result = result.filter(w => {
        const dateStr = new Date(w.created_at).toISOString().split('T')[0];
        return selectedDates.has(dateStr);
    });
    result.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
    return result;
  }, [words, searchTerm, sortOrder, selectedDates, searchOptions, categories, currentCatFilters, selectedSubcats]);

  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className="sticky top-14 bg-[#1a1a1a]/95 backdrop-blur-md z-40 py-4 border-b border-[#3f3f3f] flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" size={16} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('placeholder_search')} className="w-full bg-[#2c2c2c] border border-[#3f3f3f] rounded-xl pl-10 pr-3 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#818cf8]" />
            </div>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-[#2c2c2c] border border-[#3f3f3f] rounded-xl px-3 text-[14px] text-white focus:outline-none">
              <option value="newest">{t('sort_newest')}</option><option value="oldest">{t('sort_oldest')}</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 bg-white/5 border border-[#3f3f3f] rounded-xl">
            {[{ key: 'title', label: t('label_title') }, { key: 'category', label: t('label_category') }, { key: 'subcat', label: t('label_subcategory') }, { key: 'en', label: t('label_en_content') }, { key: 'jp', label: t('label_content') }, { key: 'note', label: t('label_note') }].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer text-[14px] text-[#b3b3b3] hover:text-white transition-colors">
                <input type="checkbox" className="hidden" checked={searchOptions[key]} onChange={() => toggleSearchOption(key)} />
                {searchOptions[key] ? <CheckSquare size={14} className="text-[#818cf8]" /> : <Square size={14} />}
                <span>{label}</span>
              </label>
            ))}
            <div className="flex gap-2 ml-auto">
              <button onClick={() => handleToggleAllOptions(true)} className="text-[14px] text-[#b3b3b3] hover:text-[#818cf8]">{t('all')}</button>
              <button onClick={() => handleToggleAllOptions(false)} className="text-[14px] text-[#b3b3b3] hover:text-[#818cf8]">{t('clear')}</button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => toggleCatFilter('all')} className={clsx(theme.pill.base, currentCatFilters.has('all') ? theme.pill.active : theme.pill.inactive)}>{t('all')}</button>
            {Object.entries(categories).map(([id, cat]) => (
                <button key={id} onClick={() => toggleCatFilter(id)} className={clsx(theme.pill.base, currentCatFilters.has(id) ? theme.pill.active : theme.pill.inactive)}>{cat.label}</button>
            ))}
            <button onClick={() => setIsFilterModalOpen(true)} className={clsx("ml-auto p-2 rounded-[10px] border border-[#3f3f3f] transition-all bg-transparent flex items-center gap-2 text-[14px] font-bold", selectedSubcats.size > 0 ? "text-[#818cf8] border-[#818cf8]" : "text-[#b3b3b3] hover:text-white")}>
              <Filter size={16} /><span>{t('btn_filter')}</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end md:w-[280px]">
            <MiniCalendar selectedDates={selectedDates} onToggleDate={toggleDate} words={words} />
            {selectedDates.size > 0 && <button onClick={() => setSelectedDates(new Set())} className="mt-2 text-[14px] text-[#818cf8] underline">{t('clear')} ({selectedDates.size})</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
        {filteredWords.length > 0 ? (
          filteredWords.map(word => {
            const catColor = categories[word.category]?.customColor || '#fb923c';
            return (
              <div 
                key={word.id}
                onClick={() => onViewDetail(word.id)}
                className="relative bg-[#1e1e1e] border border-transparent rounded-[20px] p-[16px] flex flex-col group active:scale-[0.98] transition-all duration-300 cursor-pointer hover:shadow-[0_8px_15px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 overflow-hidden h-[220px]"
              >
                <div className="absolute top-0 left-0 right-0 h-[6px] opacity-100" style={{ backgroundColor: catColor }}></div>
                
                <div className="flex flex-col gap-2 mt-1 shrink-0">
                    <div className="flex flex-wrap gap-1.5 items-center max-h-[72px] overflow-hidden">
                        <span className="px-[12px] py-[5px] rounded-[6px] text-sm font-bold text-[#121212] uppercase shadow-sm inline-block" style={{ backgroundColor: catColor }}>
                            {categories[word.category]?.label || t('cat_other_label')}
                        </span>
                        {word.subcategories?.map(subId => {
                            const sub = categories[word.category]?.subcats?.find(s => s.id === subId);
                            return sub ? (
                                <span key={subId} className="px-[12px] py-[5px] rounded-[6px] text-sm font-bold text-[#121212] uppercase shadow-sm inline-block opacity-80" style={{ backgroundColor: catColor }}>
                                    {sub.label}
                                </span>
                            ) : null;
                        })}
                    </div>
                    <span className="text-sm text-[#b3b3b3] font-medium leading-none">{new Date(word.created_at).toLocaleString()}</span>
                </div>

                <div className="flex flex-col gap-1 mt-2 min-h-0 overflow-hidden">
                    <h3 className="text-[17px] font-bold text-white truncate leading-tight">{word.title || t('msg_no_content')}</h3>
                    <p className="text-sm text-[#b3b3b3] line-clamp-2 leading-relaxed whitespace-pre-wrap overflow-hidden max-h-[3rem]">
                        {word.jp_content || word.en_content || t('msg_no_content')}
                    </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center"><p className="text-[14px] text-[#b3b3b3] font-medium italic">{t('msg_no_results')}</p></div>
        )}
      </div>

      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#121212] border border-[#3f3f3f] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-[#3f3f3f]"><h2 className="font-bold text-white text-[14px]">{t('btn_filter')}</h2><button onClick={() => setIsFilterModalOpen(false)} className="p-1 hover:bg-[#2c2c2c] rounded-lg transition-colors text-white"><X size={20} /></button></div>
                <div className="p-4 overflow-y-auto flex flex-col gap-6 text-white">
                    {Object.entries(categories).map(([id, cat]) => (
                        <div key={id} className="flex flex-col gap-3">
                            <h3 className="text-[14px] font-bold text-[#818cf8] border-l-2 border-[#818cf8] pl-2">{cat.label}</h3>
                            <div className="flex flex-wrap gap-2 ml-2">{cat.subcats?.map(sub => (<button key={sub.id} onClick={() => toggleSubcatFilter(sub.id)} className={clsx(theme.pill.base, selectedSubcats.has(sub.id) ? theme.pill.active : theme.pill.inactive)}>{sub.label}</button>))}</div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-[#3f3f3f] flex gap-3"><button onClick={() => setSelectedSubcats(new Set())} className="flex-1 py-2.5 text-[14px] text-[#b3b3b3] border border-[#3f3f3f] rounded-[10px] hover:bg-[#2c2c2c] transition-colors">清除子分類</button><button onClick={() => setIsFilterModalOpen(false)} className="flex-1 py-2.5 text-[14px] bg-[#818cf8] text-white rounded-[10px] font-bold active:scale-95 transition-all">完成</button></div>
            </div>
        </div>
      )}
    </div>
  );
}

export default ListPage;
