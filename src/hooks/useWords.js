import useLocalStorage from './useLocalStorage';

function useWords() {
  const [words, setWords] = useLocalStorage('jpLearningData_v2', []);

  const addWord = (word) => {
    const newWord = {
      ...word,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setWords(prev => [newWord, ...prev]);
  };

  const updateWord = (id, updatedFields) => {
    setWords(prevWords => prevWords.map(w => w.id === id ? { ...w, ...updatedFields } : w));
  };

  const deleteWord = (id) => {
    setWords(prevWords => prevWords.filter(w => w.id !== id));
  };

  const getWord = (id) => {
    return words.find(w => w.id === id);
  };

  return { words, addWord, updateWord, deleteWord, getWord, setWords };
}

export default useWords;
