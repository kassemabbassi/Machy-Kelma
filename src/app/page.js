'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy, Clock, Target, BookOpen, Sparkles, Brain, X } from 'lucide-react';

// Configuration du jeu
const GRID_SIZE = 12;
const GAME_DURATION = 300; // 5 minutes en secondes

// Domaines disponibles
const DOMAINS = [
  { id: 'technology', name: 'Technologie', icon: '💻', description: 'Programmation, IA, web development' },
  { id: 'science', name: 'Sciences', icon: '🔬', description: 'Physique, chimie, biologie' },
  { id: 'business', name: 'Business', icon: '💼', description: 'Marketing, finance, management' },
  { id: 'health', name: 'Santé', icon: '🏥', description: 'Médecine, nutrition, fitness' },
  { id: 'education', name: 'Éducation', icon: '📚', description: 'Pédagogie, apprentissage, formation' },
  { id: 'environment', name: 'Environnement', icon: '🌱', description: 'Écologie, climat, nature' }
];

// Configuration Gemini
// Ensure NEXT_PUBLIC_GEMINI_API_KEY is correctly set in your .env.local file
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Service Gemini
// Service Gemini
class GeminiService {
  static async generateWords(domain, count = 8) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      console.error("Gemini API Key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.");
      return ['REACT', 'CODE', 'WEB', 'API', 'DATA', 'TECH', 'SMART', 'LEARN'];
    }

    const prompt = `Generate exactly ${count} simple English words (3 to 12 letters long) related to the "${domain}" domain. 
    Respond ONLY with the words separated by commas, no explanations or numbering.
    Expected format example: WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Client': 'gemini-react-wordsearch'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("Gemini API did not return expected content.");
      }

      const words = generatedText
        .split(',')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 3 && word.length <= 12 && /^[A-Z]+$/.test(word))
        .slice(0, count);

      if (words.length < count) {
        console.warn(`Gemini returned fewer than ${count} words.`);
        return ['REACT', 'CODE', 'WEB', 'API', 'DATA', 'TECH', 'SMART', 'LEARN'];
      }

      return words;
    } catch (error) {
      console.error('Error generating words from Gemini:', error);
      return ['REACT', 'CODE', 'WEB', 'API', 'DATA', 'TECH', 'SMART', 'LEARN'];
    }
  }

  static async explainWord(word, domain) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      console.error("Gemini API Key is not configured. Cannot generate explanation.");
      return `${word} is an important term in the ${domain} domain. Keep exploring to learn more!`;
    }

    const prompt = `Explain the word "${word}" in the context of the "${domain}" domain in French. 
    Provide a simple and short explanation (maximum 2 sentences) that aids learning.
    Be pedagogical and accessible.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Client': 'gemini-react-wordsearch'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const explanationText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!explanationText) {
        throw new Error("Gemini API did not return an explanation.");
      }

      return explanationText.trim();
    } catch (error) {
      console.error('Error explaining word with Gemini:', error);
      return `${word} est un terme important dans le domaine ${domain}. Continuez à explorer pour en apprendre plus !`;
    }
  }
}

// Générateur de matrice avec mots cachés
const generateGrid = (words) => {
  const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
  const placedWords = [];
  
  // Function to check if a word can be placed without conflict
  const canPlace = (word, startRow, startCol, dx, dy) => {
    for (let i = 0; i < word.length; i++) {
      const row = startRow + dy * i;
      const col = startCol + dx * i;

      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return false; // Out of bounds
      }
      if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
        return false; // Conflict with existing letter
      }
    }
    return true;
  };

  // Function to place a word in the grid
  const placeWord = (word) => {
    const directions = [
      [0, 1],   // Horizontal right
      [1, 0],   // Vertical down
      [1, 1],   // Diagonal down-right
      [0, -1],  // Horizontal left
      [-1, 0],  // Vertical up
      [-1, -1], // Diagonal up-left
      [1, -1],  // Diagonal down-left
      [-1, 1]   // Diagonal up-right
    ];
    
    let attempts = 0;
    while (attempts < 200) { // Increased attempts for better placement
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const [dy, dx] = direction; // dy for row change, dx for col change
      
      const startRow = Math.floor(Math.random() * GRID_SIZE);
      const startCol = Math.floor(Math.random() * GRID_SIZE);
      
      if (canPlace(word, startRow, startCol, dx, dy)) {
        const positions = [];
        for (let i = 0; i < word.length; i++) {
          const row = startRow + dy * i;
          const col = startCol + dx * i;
          grid[row][col] = word[i];
          positions.push([row, col]);
        }
        
        placedWords.push({
          word,
          positions,
          found: false
        });
        return true;
      }
      attempts++;
    }
    return false; // Could not place the word
  };
  
  // Sort words by length to place longer words first (improves placement success)
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  // Place all words
  sortedWords.forEach(word => placeWord(word));
  
  // Fill empty cells with random letters
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === '') {
        grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }
  
  return { grid, placedWords };
};

const WordSearchGame = () => {
  const [gameState, setGameState] = useState('domain-selection'); // 'domain-selection', 'loading', 'playing', 'paused', 'finished'
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [generatedWords, setGeneratedWords] = useState([]);
  const [grid, setGrid] = useState([]);
  const [wordsData, setWordsData] = useState([]); // Stores word, its positions, and found status
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]); // Only stores the string words that have been found
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionLine, setSelectionLine] = useState(null);
  const [wordExplanation, setWordExplanation] = useState(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState(null); // To handle and display errors

  const gridRef = useRef(null);
  const intervalRef = useRef(null);
  
  // Memoized function for selecting a domain and generating words
  const selectDomain = useCallback(async (domain) => {
    setSelectedDomain(domain);
    setGameState('loading');
    setError(null); // Clear previous errors
    
    try {
      const words = await GeminiService.generateWords(domain.name, 8);
      setGeneratedWords(words);
      
      const { grid: newGrid, placedWords } = generateGrid(words);
      setGrid(newGrid);
      setWordsData(placedWords);
      setFoundWords([]);
      setScore(0);
      setTimeLeft(GAME_DURATION);
      setSelectedCells([]);
      setSelectionLine(null);
      setWordExplanation(null);
      
      setGameState('playing');
    } catch (err) {
      console.error('Error during game setup:', err);
      setError("Failed to load words. Please check your API key and network connection.");
      setGameState('domain-selection'); // Go back to selection on error
    }
  }, []); // Empty dependency array means this function is created once

  // Memoized function to get the explanation of a found word
  const getWordExplanation = useCallback(async (word) => {
    if (!selectedDomain) return;
    
    setIsLoadingExplanation(true);
    try {
      const explanation = await GeminiService.explainWord(word, selectedDomain.name);
      setWordExplanation({ word, explanation });
      setShowExplanation(true);
    } catch (err) {
      console.error('Error fetching explanation:', err);
      // Display a user-friendly message for explanation failure
      setWordExplanation({ word, explanation: `Désolé, impossible d'obtenir l'explication pour "${word}" pour le moment.` });
      setShowExplanation(true);
    } finally {
      setIsLoadingExplanation(false);
    }
  }, [selectedDomain]); // Recreate if selectedDomain changes

  // Game timer effect
  useEffect(() => {
    if (gameState === 'playing') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('finished');
            clearInterval(intervalRef.current); // Clear interval when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => clearInterval(intervalRef.current); // Cleanup on component unmount
  }, [gameState]);
  
  // Check if all words are found
  useEffect(() => {
    if (generatedWords.length > 0 && foundWords.length === generatedWords.length && gameState === 'playing') {
      setGameState('finished');
    }
  }, [foundWords.length, generatedWords.length, gameState]);
  
  // Handle mouse down event on a grid cell
  const handleMouseDown = useCallback((row, col) => {
    if (gameState !== 'playing') return;
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  }, [gameState]);
  
  // Handle mouse enter event on a grid cell during selection
  const handleMouseEnter = useCallback((row, col) => {
    if (!isSelecting || gameState !== 'playing') return;
    
    const start = selectedCells[0];
    if (!start) return;
    
    const newSelection = getLineCells(start.row, start.col, row, col);
    setSelectedCells(newSelection);
    
    // Calculate the selection line coordinates for rendering
    if (gridRef.current) {
      const startCell = gridRef.current.children[start.row * GRID_SIZE + start.col];
      const endCell = gridRef.current.children[row * GRID_SIZE + col];
      
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
  }, [isSelecting, selectedCells, gameState]); // Added gameState to dependencies

  // Handle mouse up event to finalize selection and check for word
  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || gameState !== 'playing') return;
    
    setIsSelecting(false);
    
    const currentSelectionLetters = selectedCells.map(cell => grid[cell.row][cell.col]).join('');
    
    const foundWordData = wordsData.find(wordData => {
        // Check if the selected word (or its reverse) matches an unfound target word
        const isMatch = wordData.word === currentSelectionLetters || 
                        wordData.word === currentSelectionLetters.split('').reverse().join('');
        return isMatch && !wordData.found;
    });
    
    if (foundWordData) {
      // Word found!
      setFoundWords(prev => [...prev, foundWordData.word]);
      setScore(prev => prev + foundWordData.word.length * 10);
      
      // Mark the word as found in wordsData
      setWordsData(prev => 
        prev.map(word => 
          word.word === foundWordData.word ? { ...word, found: true } : word
        )
      );
      
      // Get the explanation of the word
      await getWordExplanation(foundWordData.word);
    }
    
    // Reset selection after a short delay
    setTimeout(() => {
      setSelectedCells([]);
      setSelectionLine(null);
    }, foundWordData ? 500 : 200); // Keep selection visible longer if word was found
  }, [isSelecting, selectedCells, grid, wordsData, gameState, getWordExplanation]); // Added grid and getWordExplanation to dependencies

  // Utility function to calculate cells in a straight line
  const getLineCells = useCallback((startRow, startCol, endRow, endCol) => {
    const cells = [];
    const dx = Math.sign(endCol - startCol);
    const dy = Math.sign(endRow - startRow);
    
    // Check if it's a valid straight line (horizontal, vertical, or diagonal)
    if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
      let currentRow = startRow;
      let currentCol = startCol;
      
      while (true) {
        cells.push({ row: currentRow, col: currentCol });
        if (currentRow === endRow && currentCol === endCol) {
          break; // Reached the end point
        }
        currentRow += dy;
        currentCol += dx;
        
        if (currentRow < 0 || currentRow >= GRID_SIZE || 
            currentCol < 0 || currentCol >= GRID_SIZE) {
          return []; // Invalid path (went out of bounds before reaching end)
        }
      }
    }
    return cells;
  }, []);

  // Formatter for time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Check if a cell is currently selected
  const isCellSelected = useCallback((row, col) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  }, [selectedCells]);
  
  // Check if a cell is part of a found word
  const isCellInFoundWord = useCallback((row, col) => {
    return wordsData.some(wordData => 
      wordData.found && wordData.positions.some(([r, c]) => r === row && c === col)
    );
  }, [wordsData]);

  // Function to return to the main menu
  const goToMainMenu = useCallback(() => {
    setGameState('domain-selection');
    setSelectedDomain(null);
    setGeneratedWords([]);
    setGrid([]);
    setWordsData([]);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setWordExplanation(null);
    setShowExplanation(false);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 font-sans antialiased">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3 flex items-center justify-center gap-4 drop-shadow-lg">
            <Brain className="text-purple-300" size={56} strokeWidth={2.5} />
            AI Word Search
          </h1>
          <p className="text-blue-200 text-xl font-medium">
            Apprenez en découvrant des mots avec l'intelligence artificielle
          </p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-600/70 text-white p-4 rounded-xl mb-6 shadow-lg flex items-center justify-between max-w-2xl mx-auto"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Domaine Selection Screen */}
          {gameState === 'domain-selection' && (
            <motion.div
              key="domain-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="space-y-10"
            >
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 flex items-center justify-center gap-3">
                  <Sparkles className="text-yellow-300" size={32} />
                  Choisissez votre domaine d'apprentissage
                </h2>
                <p className="text-blue-200 text-lg">
                  L'IA va générer des mots spécialisés pour enrichir vos connaissances
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {DOMAINS.map(domain => (
                  <motion.div
                    key={domain.id}
                    whileHover={{ scale: 1.03, y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectDomain(domain)}
                    className="bg-white/10 backdrop-blur-md rounded-3xl p-7 cursor-pointer transition-all duration-300 hover:bg-white/20 border border-white/15 shadow-xl"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-4 transition-transform duration-300 ease-in-out group-hover:rotate-6">{domain.icon}</div>
                      <h3 className="text-2xl font-bold text-white mb-2">{domain.name}</h3>
                      <p className="text-blue-200 text-sm opacity-90">{domain.description}</p>
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
              transition={{ duration: 0.5 }}
              className="text-center space-y-8 flex flex-col items-center justify-center min-h-[50vh]"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-7xl mb-6"
              >
                🧠
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-4">
                L'IA génère vos mots...
              </h2>
              <p className="text-blue-200 text-lg">
                Préparation du jeu sur le thème de la {selectedDomain?.name}
              </p>
              <div className="mt-8 w-64">
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-400 to-purple-400 h-2.5 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
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
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-10"
            >
              {/* Control Panel */}
              <div className="lg:col-span-1 space-y-8">
                {/* Selected Domain */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{selectedDomain?.icon}</span>
                    <div>
                      <div className="text-white text-xl font-bold">{selectedDomain?.name}</div>
                      <div className="text-blue-200 text-sm opacity-90">Domaine d'apprentissage</div>
                    </div>
                  </div>
                </div>

                {/* Game Stats */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 shadow-lg">
                  <h3 className="text-white font-bold text-xl mb-5 flex items-center gap-3">
                    <Clock className="text-blue-300" size={24} /> Statistiques
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="text-blue-300" size={20} />
                        <span className="text-blue-200 text-md">Temps restant</span>
                      </div>
                      <div className="text-white font-mono text-2xl font-semibold">
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="text-yellow-300" size={20} />
                        <span className="text-blue-200 text-md">Score</span>
                      </div>
                      <div className="text-white font-bold text-2xl">{score}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="text-green-300" size={20} />
                        <span className="text-blue-200 text-md">Progression</span>
                      </div>
                      <div className="text-white font-bold text-2xl">
                        {foundWords.length}/{generatedWords.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Word List */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 shadow-lg">
                  <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                    <BookOpen size={24} className="text-purple-300" />
                    Mots à trouver
                  </h3>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {generatedWords.map(word => (
                      <motion.div
                        key={word}
                        initial={{ opacity: 0.8 }}
                        animate={{ 
                          opacity: foundWords.includes(word) ? 1 : 0.8,
                          scale: foundWords.includes(word) ? 1.02 : 1
                        }}
                        className={`p-3 rounded-lg transition-all duration-300 text-center text-sm font-semibold tracking-wide
                          ${foundWords.includes(word) 
                            ? 'bg-green-500/40 text-green-100 line-through' 
                            : 'bg-blue-500/30 text-blue-100 hover:bg-blue-500/40'
                          }`}
                      >
                        {word}
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
                    className="w-full bg-yellow-500 text-white px-5 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-md hover:bg-yellow-600 transition-colors"
                  >
                    {gameState === 'playing' ? <Pause size={24} /> : <Play size={24} />}
                    {gameState === 'playing' ? 'Mettre en Pause' : 'Reprendre le jeu'}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToMainMenu}
                    className="w-full bg-red-600 text-white px-5 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-md hover:bg-red-700 transition-colors"
                  >
                    <RotateCcw size={24} />
                    Changer de domaine
                  </motion.button>
                </div>
              </div>

              {/* Game Grid */}
              <div className="lg:col-span-3 flex justify-center items-center">
                <div className="relative p-2 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/15">
                  <div 
                    ref={gridRef}
                    className="grid gap-1.5"
                    style={{ 
                      gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                      userSelect: 'none',
                      touchAction: 'none' // Prevent default touch actions like scrolling
                    }}
                    onMouseLeave={() => { // End selection if mouse leaves grid
                      if (isSelecting) handleMouseUp();
                    }}
                  >
                    {grid.map((row, i) =>
                      row.map((letter, j) => (
                        <motion.div
                          key={`${i}-${j}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (i + j) * 0.015, type: "spring", stiffness: 200, damping: 20 }}
                          className={`
                            w-9 h-9 md:w-11 md:h-11 flex items-center justify-center text-lg md:text-xl font-extrabold uppercase
                            rounded-xl cursor-pointer transition-all duration-200 ease-out transform
                            ${isCellSelected(i, j) 
                              ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300' 
                              : isCellInFoundWord(i, j)
                              ? 'bg-green-600/60 text-green-100 shadow-md animate-pulse-once' // Add a pulse animation class
                              : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
                            }
                          `}
                          onMouseDown={() => handleMouseDown(i, j)}
                          onMouseEnter={() => handleMouseEnter(i, j)}
                          onMouseUp={handleMouseUp}
                          onTouchStart={(e) => { // Handle touch events for mobile
                            e.preventDefault(); // Prevent scrolling
                            handleMouseDown(i, j);
                          }}
                          onTouchMove={(e) => {
                            e.preventDefault();
                            const touch = e.touches[0];
                            const targetCell = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (targetCell && targetCell.dataset.row && targetCell.dataset.col) {
                              const r = parseInt(targetCell.dataset.row);
                              const c = parseInt(targetCell.dataset.col);
                              handleMouseEnter(r, c);
                            }
                          }}
                          onTouchEnd={handleMouseUp}
                          data-row={i} // Custom data attributes for touch events
                          data-col={j}
                        >
                          {letter}
                        </motion.div>
                      ))
                    )}
                  </div>
                  
                  {/* Selection Line */}
                  {selectionLine && (
                    <svg
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 10 }}
                    >
                      <motion.line
                        x1={selectionLine.x1}
                        y1={selectionLine.y1}
                        x2={selectionLine.x2}
                        y2={selectionLine.y2}
                        stroke="#8B5CF6" // Purple stroke
                        strokeWidth="5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.1, ease: "linear" }}
                      />
                    </svg>
                  )}
                  
                  {/* Paused Overlay */}
                  {gameState === 'paused' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center animate-fade-in">
                      <div className="text-white text-3xl font-bold tracking-wide">
                        Jeu en pause
                      </div>
                    </div>
                  )}
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
              transition={{ duration: 0.5 }}
              className="text-center space-y-10"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 max-w-lg mx-auto border border-white/15 shadow-2xl">
                <Trophy className="text-yellow-400 mx-auto mb-6 drop-shadow-lg" size={80} strokeWidth={2} />
                <h2 className="text-4xl font-bold text-white mb-5">
                  {foundWords.length === generatedWords.length ? 'Félicitations, vous avez tout trouvé !' : 'Temps écoulé ! Continuez à apprendre !'}
                </h2>
                <div className="text-blue-100 text-lg space-y-3">
                  <p className="text-2xl">Score final: <span className="font-extrabold text-white">{score}</span></p>
                  <p>Mots trouvés: <span className="font-bold text-white">{foundWords.length}/{generatedWords.length}</span></p>
                  <p>Temps passé: <span className="font-bold text-white">{formatTime(GAME_DURATION - timeLeft)}</span></p>
                  <p>Domaine: <span className="font-bold text-white">{selectedDomain?.name}</span></p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center max-w-xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(74, 144, 226, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectDomain(selectedDomain)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                  <Play size={24} />
                  Rejouer
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(52, 211, 153, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToMainMenu}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 shadow-xl hover:from-green-700 hover:to-teal-700 transition-all duration-300"
                >
                  <RotateCcw size={24} />
                  Changer de domaine
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word Explanation Modal */}
        <AnimatePresence>
          {showExplanation && wordExplanation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowExplanation(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl relative"
              >
                <button
                  onClick={() => setShowExplanation(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                  aria-label="Close explanation"
                >
                  <X size={28} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-xl shadow-md">
                    <Brain className="text-white" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {wordExplanation.word}
                    </h3>
                    <p className="text-blue-200 text-sm opacity-90">
                      Explication par l'IA
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
                  <p className="text-white text-lg leading-relaxed font-light">
                    {wordExplanation.explanation}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-blue-300 text-xs font-medium">
                  <Sparkles size={18} />
                  <span>Généré par Gemini AI</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Explanation Indicator */}
        <AnimatePresence>
          {isLoadingExplanation && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed bottom-6 right-6 bg-white/15 backdrop-blur-lg rounded-full px-6 py-3 flex items-center gap-4 shadow-lg border border-white/20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="text-purple-300" size={24} />
              </motion.div>
              <span className="text-white text-sm font-medium">
                L'IA prépare l'explication...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WordSearchGame;