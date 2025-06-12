'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy, Clock, Target, BookOpen, Sparkles, Brain, X, Star } from 'lucide-react';

// Utility function to capitalize strings
const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

// Game configurations based on difficulty
const DIFFICULTY_CONFIGS = {
  easy: { gridSize: 10, wordCount: 6, maxWordLength: 6, minWordLength: 3, gameDuration: 240 },
  medium: { gridSize: 12, wordCount: 8, maxWordLength: 8, minWordLength: 4, gameDuration: 300 },
  hard: { gridSize: 14, wordCount: 10, maxWordLength: 10, minWordLength: 5, gameDuration: 360 },
  master: { gridSize: 16, wordCount: 12, maxWordLength: 12, minWordLength: 6, gameDuration: 420 }
};

// Available domains
const DOMAINS = [
  { id: 'technology', name: 'Technology', icon: '💻', description: 'Programming, AI, web development' },
  { id: 'science', name: 'Science', icon: '🔬', description: 'Physics, chemistry, biology' },
  { id: 'business', name: 'Business', icon: '💼', description: 'Marketing, finance, management' },
  { id: 'health', name: 'Health', icon: '🏥', description: 'Medicine, nutrition, fitness' },
  { id: 'education', name: 'Education', icon: '📚', description: 'Pedagogy, learning, training' },
  { id: 'environment', name: 'Environment', icon: '🌱', description: 'Ecology, climate, nature' }
];

// Gemini Service
class GeminiService {
  static async generateWords(domain, difficulty, count, usedWords) {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const prompt = `Generate exactly ${count} unique English words related to the "${domain}" domain, not included in this list: [${usedWords.join(',')}]. 
    Words must be ${config.minWordLength} to ${config.maxWordLength} letters long, suitable for ${difficulty} difficulty (e.g., simple for easy, technical for hard/master). 
    Respond ONLY with words separated by commas, no explanations or numbering.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Client': 'gemini-react-wordsearch' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) throw new Error("No content returned.");
      const words = generatedText
        .split(',')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= config.minWordLength && word.length <= config.maxWordLength && /^[A-Z]+$/.test(word))
        .slice(0, count);

      return words.length < count ? ['CODE', 'DATA', 'WEB', 'API', 'TECH', 'SMART', 'LEARN', 'SYSTEM', 'CLOUD', 'NETWORK', 'SERVER', 'DATABASE'].slice(0, count) : words;
    } catch (error) {
      console.error('Error generating words:', error);
      return ['CODE', 'DATA', 'WEB', 'API', 'TECH', 'SMART', 'LEARN', 'SYSTEM', 'CLOUD', 'NETWORK', 'SERVER', 'DATABASE'].slice(0, count);
    }
  }

  static async generateHint(word, domain) {
    const prompt = `Generate a hint for the word "${word}" in the "${domain}" domain in English. 
    The hint must be exactly 4 words, using simple, clear, everyday language suitable for beginners. 
    Avoid technical or obscure terms. Respond ONLY with the hint.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Client': 'gemini-react-wordsearch' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
      const data = await response.json();
      const hintText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return hintText ? hintText.trim() : `Basic ${domain} term`;
    } catch (error) {
      console.error('Error generating hint:', error);
      return `Basic ${domain} term`;
    }
  }

  static async explainWord(word, domain) {
    const prompt = `Explain the word "${word}" in the context of the "${domain}" domain in English. 
    Provide a simple and short explanation (1-2 sentences, max 20 words) that aids learning.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Client': 'gemini-react-wordsearch' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
      const data = await response.json();
      const explanationText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return explanationText ? explanationText.trim() : `${word} is a key term in ${domain}.`;
    } catch (error) {
      console.error('Error explaining word:', error);
      return `${word} is a key term in ${domain}.`;
    }
  }
}

// Grid generator
const generateGrid = (words, gridSize) => {
  const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
  const placedWords = [];

  const canPlace = (word, startRow, startCol, dx, dy) => {
    for (let i = 0; i < word.length; i++) {
      const row = startRow + dy * i;
      const col = startCol + dx * i;
      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return false;
      if (grid[row][col] !== '' && grid[row][col] !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (word) => {
    const directions = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
    let attempts = 0;
    while (attempts < 200) {
      const [dy, dx] = directions[Math.floor(Math.random() * directions.length)];
      const startRow = Math.floor(Math.random() * gridSize);
      const startCol = Math.floor(Math.random() * gridSize);

      if (canPlace(word, startRow, startCol, dx, dy)) {
        const positions = [];
        for (let i = 0; i < word.length; i++) {
          const row = startRow + dy * i;
          const col = startCol + dx * i;
          grid[row][col] = word[i];
          positions.push([row, col]);
        }
        placedWords.push({ word, positions, found: false });
        return true;
      }
      attempts++;
    }
    return false;
  };

  const sortedWords = [...words].sort((a, b) => b.length - a.length);
  sortedWords.forEach(word => placeWord(word));

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === '') {
        grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return { grid, placedWords };
};

const WordSearchGame = () => {
  const [gameState, setGameState] = useState('domain-selection');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [generatedWords, setGeneratedWords] = useState([]);
  const [wordHints, setWordHints] = useState([]);
  const [wordExplanations, setWordExplanations] = useState([]);
  const [grid, setGrid] = useState([]);
  const [wordsData, setWordsData] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionLine, setSelectionLine] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const gridRef = useRef(null);
  const intervalRef = useRef(null);

  const selectDomain = useCallback((domain) => {
    setSelectedDomain(domain);
    setGameState('difficulty-selection');
    setError(null);
  }, []);

  const selectDifficulty = useCallback(async (difficulty) => {
    setSelectedDifficulty(difficulty);
    setGameState('loading');
    setIsLoading(true);
    setError(null);

    try {
      const config = DIFFICULTY_CONFIGS[difficulty];
      const words = await GeminiService.generateWords(selectedDomain.name, difficulty, config.wordCount, usedWords);
      const hints = await Promise.all(words.map(word => GeminiService.generateHint(word, selectedDomain.name)));
      
      setGeneratedWords(words);
      setWordHints(hints);
      setUsedWords(prev => [...new Set([...prev, ...words])].slice(-100)); // Keep last 100 words

      const { grid: newGrid, placedWords } = generateGrid(words, config.gridSize);
      setGrid(newGrid);
      setWordsData(placedWords);
      setFoundWords([]);
      setWordExplanations([]);
      setScore(0);
      setTimeLeft(config.gameDuration);
      setSelectedCells([]);
      setSelectionLine(null);

      setGameState('playing');
    } catch (err) {
      console.error('Error during game setup:', err);
      setError("Failed to load game. Check API key and network.");
      setGameState('domain-selection');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDomain]);

  const addWordExplanation = useCallback(async (word) => {
    if (!selectedDomain) return;

    setIsLoading(true);
    try {
      const explanation = await GeminiService.explainWord(word, selectedDomain.name);
      setWordExplanations(prev => [...prev, { word, explanation }]);
    } catch (err) {
      console.error('Error fetching explanation:', err);
      setWordExplanations(prev => [...prev, { word, explanation: `Unable to explain ${word}.` }]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDomain]);

  useEffect(() => {
    if (gameState === 'playing') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('finished');
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [gameState]);

  useEffect(() => {
    if (generatedWords.length > 0 && foundWords.length === generatedWords.length && gameState === 'playing') {
      setGameState('finished');
    }
  }, [foundWords.length, generatedWords.length, gameState]);

  const handleMouseDown = useCallback((row, col) => {
    if (gameState !== 'playing') return;
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  }, [gameState]);

  const handleMouseEnter = useCallback((row, col) => {
    if (!isSelecting || gameState !== 'playing') return;

    const start = selectedCells[0];
    if (!start) return;

    const newSelection = getLineCells(start.row, start.col, row, col);
    setSelectedCells(newSelection);

    if (gridRef.current && selectedDifficulty) {
      const gridSize = DIFFICULTY_CONFIGS[selectedDifficulty].gridSize;
      const startCell = gridRef.current.children[start.row * gridSize + start.col];
      const endCell = gridRef.current.children[row * gridSize + col];

      if (startCell && endCell) {
        const startRect = startCell.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();
        const containerRect = gridRef.current.getBoundingClientRect();

        setSelectionLine({
          x1: startRect.left - containerRect.left + startRect.width / 2,
          y1: startRect.top - containerRect.top + startRect.height / 2,
          x2: endRect.left - containerRect.left + endRect.width / 2,
          y2: endRect.top - containerRect.top + endRect.height / 2
        });
      }
    }
  }, [isSelecting, selectedCells, gameState, selectedDifficulty]);

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || gameState !== 'playing') return;

    setIsSelecting(false);

    const currentSelectionLetters = selectedCells.map(cell => grid[cell.row][cell.col]).join('');
    const foundWordData = wordsData.find(wordData => {
      const isMatch = wordData.word === currentSelectionLetters || wordData.word === currentSelectionLetters.split('').reverse().join('');
      return isMatch && !wordData.found;
    });

    if (foundWordData) {
      setFoundWords(prev => [...prev, foundWordData.word]);
      setScore(prev => prev + foundWordData.word.length * 10);
      setWordsData(prev => prev.map(word => word.word === foundWordData.word ? { ...word, found: true } : word));
      await addWordExplanation(foundWordData.word);
    }

    setTimeout(() => {
      setSelectedCells([]);
      setSelectionLine(null);
    }, foundWordData ? 500 : 200);
  }, [isSelecting, selectedCells, grid, wordsData, gameState, addWordExplanation]);

  const getLineCells = useCallback((startRow, startCol, endRow, endCol) => {
    const cells = [];
    const dx = Math.sign(endCol - startCol);
    const dy = Math.sign(endRow - startRow);
    const gridSize = selectedDifficulty ? DIFFICULTY_CONFIGS[selectedDifficulty].gridSize : 12;

    if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
      let currentRow = startRow;
      let currentCol = startCol;

      while (true) {
        cells.push({ row: currentRow, col: currentCol });
        if (currentRow === endRow && currentCol === endCol) break;
        currentRow += dy;
        currentCol += dx;

        if (currentRow < 0 || currentRow >= gridSize || currentCol < 0 || currentCol >= gridSize) return [];
      }
    }
    return cells;
  }, [selectedDifficulty]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCellSelected = useCallback((row, col) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  }, [selectedCells]);

  const isCellInFoundWord = useCallback((row, col) => {
    return wordsData.some(wordData => wordData.found && wordData.positions.some(([r, c]) => r === row && c === col));
  }, [wordsData]);

  const goToMainMenu = useCallback(() => {
    setGameState('domain-selection');
    setSelectedDomain(null);
    setSelectedDifficulty(null);
    setGeneratedWords([]);
    setWordHints([]);
    setWordExplanations([]);
    setGrid([]);
    setWordsData([]);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(0);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-blue-900 p-4 font-sans antialiased">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
          margin: 0;
          padding: 0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a78bfa;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8b5cf6;
        }
        .animate-pulse-once {
          animation: pulse 0.5s ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .glassmorphism {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .gradient-text {
          background: linear-gradient(to right, #a78bfa, #60a5fa);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold gradient-text mb-3 flex items-center justify-center gap-4">
            <Brain className="text-purple-400" size={56} />
            AI Word Search
          </h1>
          <p className="text-blue-200 text-xl font-medium">
            Learn through AI-powered word discovery
          </p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-600/80 text-white p-4 rounded-xl mb-6 shadow-lg flex items-center justify-between max-w-2xl mx-auto glassmorphism"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Domain Selection Screen */}
          {gameState === 'domain-selection' && (
            <motion.div
              key="domain-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-10"
            >
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-5 flex items-center justify-center gap-3">
                  <Sparkles className="text-yellow-400" size={32} />
                  Choose Your Learning Domain
                </h2>
                <p className="text-blue-300 text-lg">
                  AI will generate specialized words to boost your knowledge
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {DOMAINS.map(domain => (
                  <motion.div
                    key={domain.id}
                    whileHover={{ scale: 1.05, y: -8, boxShadow: "0 12px 24px rgba(0,0,0,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectDomain(domain)}
                    className="glassmorphism rounded-3xl p-7 cursor-pointer hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-4">{domain.icon}</div>
                      <h3 className="text-2xl font-bold text-white mb-2">{domain.name}</h3>
                      <p className="text-blue-300 text-sm">{domain.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Difficulty Selection Screen */}
          {gameState === 'difficulty-selection' && (
            <motion.div
              key="difficulty-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-10"
            >
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-5 flex items-center justify-center gap-3">
                  <Star className="text-yellow-400" size={32} />
                  Select Difficulty Level
                </h2>
                <p className="text-blue-300 text-lg">
                  Choose your challenge for {selectedDomain?.name}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                {Object.keys(DIFFICULTY_CONFIGS).map(difficulty => (
                  <motion.div
                    key={difficulty}
                    whileHover={{ scale: 1.05, y: -8, boxShadow: "0 12px 24px rgba(0,0,0,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectDifficulty(difficulty)}
                    className="glassmorphism rounded-3xl p-7 cursor-pointer hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">{capitalize(difficulty)}</h3>
                      <p className="text-blue-300 text-sm">
                        {difficulty === 'easy' && 'Simple words, small grid'}
                        {difficulty === 'medium' && 'Moderate words, medium grid'}
                        {difficulty === 'hard' && 'Complex words, large grid'}
                        {difficulty === 'master' && 'Technical words, huge grid'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loading Screen */}
          {gameState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-8 flex flex-col items-center justify-center min-h-[50vh]"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-7xl mb-6"
              >
                🧠
              </motion.div>
              <h2 className="text-3xl font-bold gradient-text mb-4">
                AI is Generating Words...
              </h2>
              <p className="text-blue-300 text-lg">
                Preparing {selectedDifficulty ? capitalize(selectedDifficulty) : ''} game for {selectedDomain?.name}
              </p>
              <div className="mt-8 w-64">
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-400 to-purple-400 h-2.5 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Game Screen */}
          {(gameState === 'playing' || gameState === 'paused') && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Control Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Selected Domain and Difficulty */}
                <div className="glassmorphism rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{selectedDomain?.icon}</span>
                    <div>
                      <div className="text-white text-xl font-bold">{selectedDomain?.name} - {selectedDifficulty ? capitalize(selectedDifficulty) : ''}</div>
                      <div className="text-blue-300 text-sm">Learning Domain</div>
                    </div>
                  </div>
                </div>

                {/* Game Stats */}
                <div className="glassmorphism rounded-2xl p-6">
                  <h3 className="text-white font-bold text-xl mb-5 flex items-center gap-3">
                    <Clock className="text-blue-400" size={24} /> Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="text-blue-400" size={20} />
                        <span className="text-blue-300">Time Left</span>
                      </div>
                      <div className="text-white font-mono text-2xl">{formatTime(timeLeft)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="text-yellow-400" size={20} />
                        <span className="text-blue-300">Score</span>
                      </div>
                      <div className="text-white font-bold text-2xl">{score}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="text-green-400" size={20} />
                        <span className="text-blue-300">Progress</span>
                      </div>
                      <div className="text-white font-bold text-2xl">{foundWords.length}/{generatedWords.length}</div>
                    </div>
                  </div>
                </div>

                {/* Hints List */}
                <div className="glassmorphism rounded-2xl p-6">
                  <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                    <BookOpen size={24} className="text-purple-400" />
                    Word Hints
                  </h3>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {wordHints.map((hint, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0.8 }}
                        animate={{ 
                          opacity: foundWords.includes(generatedWords[index]) ? 1 : 0.8,
                          scale: foundWords.includes(generatedWords[index]) ? 1.02 : 1
                        }}
                        className={`p-3 rounded-lg text-center text-sm font-semibold tracking-wide
                          ${foundWords.includes(generatedWords[index]) 
                            ? 'bg-green-500/40 text-green-100 line-through' 
                            : 'bg-blue-500/30 text-blue-100 hover:bg-blue-500/40'
                          }`}
                      >
                        {hint}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Game Controls */}
                <div className="space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-5 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:from-yellow-600 hover:to-orange-600"
                  >
                    {gameState === 'playing' ? <Pause size={24} /> : <Play size={24} />}
                    {gameState === 'playing' ? 'Pause Game' : 'Resume Game'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToMainMenu}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:from-red-700 hover:to-pink-700"
                  >
                    <RotateCcw size={24} />
                    Change Domain
                  </motion.button>
                </div>
              </div>

              {/* Game Grid and Explanations */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="relative p-2 glassmorphism rounded-3xl">
                  <div 
                    ref={gridRef}
                    className="grid gap-1"
                    style={{ 
                      gridTemplateColumns: `repeat(${selectedDifficulty ? DIFFICULTY_CONFIGS[selectedDifficulty].gridSize : 12}, 1fr)`,
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                    onMouseLeave={() => isSelecting && handleMouseUp()}
                  >
                    {grid.map((row, i) =>
                      row.map((letter, j) => (
                        <motion.div
                          key={`${i}-${j}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (i + j) * 0.01 }}
                          className={`
                            w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg md:text-xl font-extrabold uppercase
                            rounded-lg cursor-pointer transition-all duration-200
                            ${isCellSelected(i, j) 
                              ? 'bg-blue-500 text-white scale-105 ring-2 ring-blue-300' 
                              : isCellInFoundWord(i, j)
                              ? 'bg-green-600/60 text-green-100 animate-pulse-once'
                              : 'bg-white/20 text-white hover:bg-white/30'
                            }
                          `}
                          onMouseDown={() => handleMouseDown(i, j)}
                          onMouseEnter={() => handleMouseEnter(i, j)}
                          onMouseUp={handleMouseUp}
                          onTouchStart={(e) => { e.preventDefault(); handleMouseDown(i, j); }}
                          onTouchMove={(e) => {
                            e.preventDefault();
                            const touch = e.touches[0];
                            const targetCell = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (targetCell && targetCell.dataset.row && targetCell.dataset.col) {
                              handleMouseEnter(parseInt(targetCell.dataset.row), parseInt(targetCell.dataset.col));
                            }
                          }}
                          onTouchEnd={handleMouseUp}
                          data-row={i}
                          data-col={j}
                        >
                          {letter}
                        </motion.div>
                      ))
                    )}
                  </div>
                  
                  {selectionLine && (
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                      <motion.line
                        x1={selectionLine.x1}
                        y1={selectionLine.y1}
                        x2={selectionLine.x2}
                        y2={selectionLine.y2}
                        stroke="#a78bfa"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.1 }}
                      />
                    </svg>
                  )}
                  
                  {gameState === 'paused' && (
                    <div className="absolute inset-0 bg-gray-900/90 rounded-3xl flex items-center justify-center">
                      <div className="text-white text-3xl font-bold">Game Paused</div>
                    </div>
                  )}
                </div>

                {/* Explanations List */}
                <div className="glassmorphism rounded-2xl p-6">
                  <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                    <Sparkles size={24} className="text-yellow-400" />
                    Word Explanations
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {wordExplanations.length === 0 ? (
                      <p className="text-blue-300 text-sm">Find words to see explanations here.</p>
                    ) : (
                      wordExplanations.map(({ word, explanation }, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/10 p-3 rounded-lg"
                        >
                          <span className="text-white font-bold">{word}</span>
                          <p className="text-blue-200 text-sm">{explanation}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* End Game Screen */}
          {gameState === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-10"
            >
              <div className="glassmorphism rounded-3xl p-10 max-w-lg mx-auto">
                <Trophy className="text-yellow-400 mx-auto mb-6" size={80} />
                <h2 className="text-4xl font-bold gradient-text mb-5">
                  {foundWords.length === generatedWords.length ? 'You Found All Words!' : 'Time’s Up! Keep Learning!'}
                </h2>
                <div className="text-blue-200 text-lg space-y-3">
                  <p className="text-2xl">Final Score: <span className="font-extrabold text-white">{score}</span></p>
                  <p>Words Found: <span className="font-bold text-white">{foundWords.length}/{generatedWords.length}</span></p>
                  <p>Time Used: <span className="font-bold text-white">{formatTime(selectedDifficulty ? DIFFICULTY_CONFIGS[selectedDifficulty].gameDuration - timeLeft : 0)}</span></p>
                  <p>Domain: <span className="font-bold text-white">{selectedDomain?.name} ({selectedDifficulty ? capitalize(selectedDifficulty) : ''})</span></p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center max-w-xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(74, 144, 226, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectedDifficulty && selectDifficulty(selectedDifficulty)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3"
                >
                  <Play size={24} />
                  Replay
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(52, 211, 153, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToMainMenu}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3"
                >
                  <RotateCcw size={24} />
                  Change Domain
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed bottom-6 right-6 glassmorphism rounded-full px-6 py-3 flex items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="text-purple-400" size={24} />
              </motion.div>
              <span className="text-white text-sm font-medium">AI is processing...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WordSearchGame;