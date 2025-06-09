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
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Service Gemini
class GeminiService {
  static async generateWords(domain, count = 8) {
    const prompt = `Génère exactement ${count} mots en anglais (uniquement des mots simples de 3 à 12 lettres) liés au domaine "${domain}". 
    Réponds UNIQUEMENT avec les mots séparés par des virgules, sans explication ni numérotation.
    Exemple de format attendu: WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Nettoyer et extraire les mots
      const words = generatedText
        .replace(/[^\w,]/g, '')
        .split(',')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 3 && word.length <= 12)
        .slice(0, count);

      return words.length >= count ? words : ['REACT', 'CODE', 'WEB', 'API', 'DATA', 'TECH', 'SMART', 'LEARN'];
    } catch (error) {
      console.error('Erreur Gemini:', error);
      // Mots de fallback
      return ['REACT', 'CODE', 'WEB', 'API', 'DATA', 'TECH', 'SMART', 'LEARN'];
    }
  }

  static async explainWord(word, domain) {
    const prompt = `Explique le mot "${word}" dans le contexte du domaine "${domain}" en français. 
    Donne une explication simple et courte (maximum 2 phrases) qui aide à l'apprentissage.
    Sois pédagogique et accessible.`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error('Erreur Gemini:', error);
      return `${word} est un terme important dans le domaine ${domain}. Continuez à explorer pour en apprendre plus !`;
    }
  }
}

// Générateur de matrice avec mots cachés
const generateGrid = (words) => {
  const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
  const placedWords = [];
  
  // Fonction pour placer un mot dans la grille
  const placeWord = (word) => {
    const directions = [
      [0, 1],   // Horizontal droite
      [1, 0],   // Vertical bas
      [1, 1],   // Diagonal bas-droite
      [0, -1],  // Horizontal gauche
      [-1, 0],  // Vertical haut
      [-1, -1], // Diagonal haut-gauche
      [1, -1],  // Diagonal bas-gauche
      [-1, 1]   // Diagonal haut-droite
    ];
    
    let attempts = 0;
    while (attempts < 100) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const [dx, dy] = direction;
      
      const startRow = Math.floor(Math.random() * GRID_SIZE);
      const startCol = Math.floor(Math.random() * GRID_SIZE);
      
      const endRow = startRow + dx * (word.length - 1);
      const endCol = startCol + dy * (word.length - 1);
      
      if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
        let canPlace = true;
        const positions = [];
        
        for (let i = 0; i < word.length; i++) {
          const row = startRow + dx * i;
          const col = startCol + dy * i;
          positions.push([row, col]);
          
          if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          positions.forEach(([row, col], i) => {
            grid[row][col] = word[i];
          });
          
          placedWords.push({
            word,
            positions,
            found: false
          });
          return true;
        }
      }
      attempts++;
    }
    return false;
  };
  
  // Placer tous les mots
  words.forEach(word => placeWord(word));
  
  // Remplir les cases vides avec des lettres aléatoires
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
  const [wordsData, setWordsData] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionLine, setSelectionLine] = useState(null);
  const [wordExplanation, setWordExplanation] = useState(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const gridRef = useRef(null);
  const intervalRef = useRef(null);
  
  // Sélectionner un domaine et générer les mots
  const selectDomain = async (domain) => {
    setSelectedDomain(domain);
    setGameState('loading');
    
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
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      setGameState('domain-selection');
    }
  };
  
  // Obtenir l'explication d'un mot trouvé
  const getWordExplanation = async (word) => {
    if (!selectedDomain) return;
    
    setIsLoadingExplanation(true);
    try {
      const explanation = await GeminiService.explainWord(word, selectedDomain.name);
      setWordExplanation({ word, explanation });
      setShowExplanation(true);
    } catch (error) {
      console.error('Erreur lors de l\'explication:', error);
    } finally {
      setIsLoadingExplanation(false);
    }
  };
  
  // Timer du jeu
  useEffect(() => {
    if (gameState === 'playing') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('finished');
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
  
  // Vérifier si tous les mots sont trouvés
  useEffect(() => {
    if (foundWords.length === generatedWords.length && gameState === 'playing' && generatedWords.length > 0) {
      setGameState('finished');
    }
  }, [foundWords.length, generatedWords.length, gameState]);
  
  // Gestion de la sélection
  const handleMouseDown = (row, col) => {
    if (gameState !== 'playing') return;
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };
  
  const handleMouseEnter = (row, col) => {
    if (!isSelecting || gameState !== 'playing') return;
    
    const start = selectedCells[0];
    if (!start) return;
    
    const newSelection = getLineCells(start.row, start.col, row, col);
    setSelectedCells(newSelection);
    
    // Calculer la ligne de sélection
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
  };
  
  const handleMouseUp = async () => {
    if (!isSelecting || gameState !== 'playing') return;
    
    setIsSelecting(false);
    
    // Vérifier si le mot sélectionné est valide
    const selectedWord = selectedCells.map(cell => grid[cell.row][cell.col]).join('');
    const reverseWord = selectedWord.split('').reverse().join('');
    
    const foundWord = wordsData.find(wordData => 
      (wordData.word === selectedWord || wordData.word === reverseWord) && !wordData.found
    );
    
    if (foundWord) {
      // Mot trouvé !
      setFoundWords(prev => [...prev, foundWord.word]);
      setScore(prev => prev + foundWord.word.length * 10);
      
      // Marquer le mot comme trouvé
      setWordsData(prev => 
        prev.map(word => 
          word.word === foundWord.word ? { ...word, found: true } : word
        )
      );
      
      // Obtenir l'explication du mot
      await getWordExplanation(foundWord.word);
    }
    
    // Réinitialiser la sélection
    setTimeout(() => {
      setSelectedCells([]);
      setSelectionLine(null);
    }, foundWord ? 500 : 200);
  };
  
  // Calculer les cellules en ligne droite
  const getLineCells = (startRow, startCol, endRow, endCol) => {
    const cells = [];
    const dx = Math.sign(endCol - startCol);
    const dy = Math.sign(endRow - startRow);
    
    // Vérifier si c'est une ligne droite valide
    if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
      let currentRow = startRow;
      let currentCol = startCol;
      
      while (currentRow !== endRow || currentCol !== endCol) {
        cells.push({ row: currentRow, col: currentCol });
        currentRow += dy;
        currentCol += dx;
        
        if (currentRow < 0 || currentRow >= GRID_SIZE || 
            currentCol < 0 || currentCol >= GRID_SIZE) {
          break;
        }
      }
      
      if (currentRow === endRow && currentCol === endCol) {
        cells.push({ row: currentRow, col: currentCol });
      }
    }
    
    return cells;
  };
  
  // Formater le temps
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fonction pour vérifier si une cellule est sélectionnée
  const isCellSelected = (row, col) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  };
  
  // Fonction pour vérifier si une cellule fait partie d'un mot trouvé
  const isCellInFoundWord = (row, col) => {
    return wordsData.some(wordData => 
      wordData.found && wordData.positions.some(([r, c]) => r === row && c === col)
    );
  };

  // Retourner au menu principal
  const goToMainMenu = () => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Brain className="text-purple-300" size={48} />
            AI Word Search
          </h1>
          <p className="text-blue-200 text-lg">
            Apprenez en découvrant des mots avec l'intelligence artificielle
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Sélection du domaine */}
          {gameState === 'domain-selection' && (
            <motion.div
              key="domain-selection"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                  <Sparkles className="text-yellow-300" />
                  Choisissez votre domaine d'apprentissage
                </h2>
                <p className="text-blue-200">
                  L'IA va générer des mots spécialisés pour enrichir vos connaissances
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DOMAINS.map(domain => (
                  <motion.div
                    key={domain.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectDomain(domain)}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:bg-white/20 border border-white/10"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{domain.icon}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{domain.name}</h3>
                      <p className="text-blue-200 text-sm">{domain.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Écran de chargement */}
          {gameState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-8"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-6xl mb-4"
                >
                  🧠
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  L'IA génère vos mots...
                </h2>
                <p className="text-blue-200">
                  Création de mots spécialisés en {selectedDomain?.name}
                </p>
                <div className="mt-6">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Jeu principal */}
          {(gameState === 'playing' || gameState === 'paused') && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Panneau de contrôle */}
              <div className="lg:col-span-1 space-y-6">
                {/* Domaine sélectionné */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{selectedDomain?.icon}</span>
                    <div>
                      <div className="text-white font-bold">{selectedDomain?.name}</div>
                      <div className="text-blue-200 text-xs">Domaine d'apprentissage</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-300" size={20} />
                      <div>
                        <div className="text-blue-200 text-sm">Temps restant</div>
                        <div className="text-white font-mono text-xl">
                          {formatTime(timeLeft)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Trophy className="text-yellow-300" size={20} />
                      <div>
                        <div className="text-blue-200 text-sm">Score</div>
                        <div className="text-white font-bold text-xl">{score}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Target className="text-green-300" size={20} />
                      <div>
                        <div className="text-blue-200 text-sm">Progression</div>
                        <div className="text-white font-bold text-xl">
                          {foundWords.length}/{generatedWords.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des mots */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <BookOpen size={20} />
                    Mots à trouver
                  </h3>
                  <div className="space-y-2">
                    {generatedWords.map(word => (
                      <motion.div
                        key={word}
                        initial={{ opacity: 0.7 }}
                        animate={{ 
                          opacity: foundWords.includes(word) ? 1 : 0.7,
                          scale: foundWords.includes(word) ? 1.05 : 1
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          foundWords.includes(word) 
                            ? 'bg-green-500/30 text-green-100 line-through' 
                            : 'bg-blue-500/20 text-blue-100'
                        }`}
                      >
                        {word}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Contrôles */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
                    className="w-full bg-yellow-500 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    {gameState === 'playing' ? <Pause size={20} /> : <Play size={20} />}
                    {gameState === 'playing' ? 'Pause' : 'Reprendre'}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToMainMenu}
                    className="w-full bg-red-500 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} />
                    Changer de domaine
                  </motion.button>
                </div>
              </div>

              {/* Grille de jeu */}
              <div className="lg:col-span-3 flex justify-center">
                <div className="relative">
                  <div 
                    ref={gridRef}
                    className="grid grid-cols-12 gap-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl"
                    style={{ 
                      gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                      userSelect: 'none' 
                    }}
                  >
                    {grid.map((row, i) =>
                      row.map((letter, j) => (
                        <motion.div
                          key={`${i}-${j}`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (i + j) * 0.01 }}
                          className={`
                            w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-sm md:text-base font-bold
                            rounded-lg cursor-pointer transition-all duration-200
                            ${isCellSelected(i, j) 
                              ? 'bg-blue-500 text-white shadow-lg scale-110' 
                              : isCellInFoundWord(i, j)
                              ? 'bg-green-500/50 text-green-100'
                              : 'bg-white/20 text-white hover:bg-white/30'
                            }
                          `}
                          onMouseDown={() => handleMouseDown(i, j)}
                          onMouseEnter={() => handleMouseEnter(i, j)}
                          onMouseUp={handleMouseUp}
                        >
                          {letter}
                        </motion.div>
                      ))
                    )}
                  </div>
                  
                  {/* Ligne de sélection */}
                  {selectionLine && (
                    <svg
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 10 }}
                    >
                      <motion.line
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        x1={selectionLine.x1}
                        y1={selectionLine.y1}
                        x2={selectionLine.x2}
                        y2={selectionLine.y2}
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  
                  {gameState === 'paused' && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <div className="text-white text-2xl font-bold">
                        Jeu en pause
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Écran de fin */}
          {gameState === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-8"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto">
                <Trophy className="text-yellow-400 mx-auto mb-4" size={64} />
                <h2 className="text-3xl font-bold text-white mb-4">
                  {foundWords.length === generatedWords.length ? 'Félicitations !' : 'Temps écoulé !'}
                </h2>
                <div className="text-blue-100 space-y-2">
                  <p className="text-xl">Score final: <span className="font-bold text-white">{score}</span></p>
                  <p>Mots trouvés: <span className="font-bold text-white">{foundWords.length}/{generatedWords.length}</span></p>
                  <p>Temps: <span className="font-bold text-white">{formatTime(GAME_DURATION - timeLeft)}</span></p>
                  <p>Domaine: <span className="font-bold text-white">{selectedDomain?.name}</span></p>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectDomain(selectedDomain)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                >
                  <Play size={20} />
                  Rejouer
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToMainMenu}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                >
                  <RotateCcw size={20} />
                  Changer de domaine
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal d'explication des mots */}
        <AnimatePresence>
          {showExplanation && wordExplanation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowExplanation(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-white/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                      <Brain className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {wordExplanation.word}
                      </h3>
                      <p className="text-blue-200 text-sm">
                        Explication par l'IA
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <p className="text-white leading-relaxed">
                    {wordExplanation.explanation}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-blue-200 text-sm">
                  <Sparkles size={16} />
                  <span>Généré par Gemini AI</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicateur de chargement d'explication */}
        {isLoadingExplanation && (
          <div className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="text-purple-300" size={20} />
            </motion.div>
            <span className="text-white text-sm">
              L'IA prépare l'explication...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordSearchGame;