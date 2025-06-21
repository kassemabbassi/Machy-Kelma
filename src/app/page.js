'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy, Clock, Target, BookOpen, Sparkles, Brain, Star, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Confetti from 'react-confetti';

// Utility function to capitalize strings
const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '');

// Game configurations based on difficulty
const DIFFICULTY_CONFIGS = {
  easy: { gridSize: 10, wordCount: 6, maxWordLength: 6, minWordLength: 3, gameDuration: 240 },
  medium: { gridSize: 12, wordCount: 8, maxWordLength: 8, minWordLength: 4, gameDuration: 300 },
  hard: { gridSize: 14, wordCount: 10, maxWordLength: 10, minWordLength: 5, gameDuration: 360 },
  master: { gridSize: 16, wordCount: 12, maxWordLength: 12, minWordLength: 6, gameDuration: 420 },
};

// Available domains
const DOMAINS = [
  { id: 'technology', name: 'Technology', icon: '💻', description: 'Programming, AI, web development', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'science', name: 'Science', icon: '🔬', description: 'Physics, chemistry, biology', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'business', name: 'Business', icon: '💼', description: 'Marketing, finance, management', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'health', name: 'Health', icon: '🏥', description: 'Medicine, nutrition, fitness', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'education', name: 'Education', icon: '📚', description: 'Pedagogy, learning, training', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'environment', name: 'Environment', icon: '🌱', description: 'Ecology, climate, nature', gradient: 'from-blue-500 to-cyan-400' },
];

// Fallback words for each domain
const FALLBACK_WORDS = {
  technology: ['CODE', 'DATA', 'WEB', 'API', 'TECH', 'SMART', 'LEARN', 'SYSTEM', 'CLOUD', 'NETWORK', 'SERVER', 'DATABASE', 'ALGORITHM', 'PROGRAM', 'SOFTWARE', 'HARDWARE', 'INTERNET', 'COMPUTER', 'DEVELOP', 'INNOVATE'],
  science: ['ATOM', 'CELL', 'DNA', 'GENE', 'MASS', 'ENERGY', 'FORCE', 'LIGHT', 'SPACE', 'MATTER', 'THEORY', 'METHOD', 'EXPERIMENT', 'RESEARCH', 'LABORATORY', 'SCIENTIST', 'DISCOVERY', 'INVENTION', 'HYPOTHESIS', 'OBSERVATION'],
  business: ['BRAND', 'SALES', 'PROFIT', 'MARKET', 'PLAN', 'GOAL', 'TEAM', 'LEAD', 'GROWTH', 'VALUE', 'TRADE', 'CLIENT', 'STRATEGY', 'INVESTMENT', 'ENTREPRENEUR', 'MANAGEMENT', 'FINANCE', 'ECONOMY', 'INDUSTRY', 'COMMERCE'],
  health: ['HEART', 'BRAIN', 'BLOOD', 'BONE', 'MUSCLE', 'HEALTH', 'DIET', 'EXERCISE', 'SLEEP', 'WELLNESS', 'IMMUNE', 'STRESS', 'MEDICINE', 'DOCTOR', 'HOSPITAL', 'TREATMENT', 'DISEASE', 'PREVENTION', 'NUTRITION', 'FITNESS'],
  education: ['LEARN', 'TEACH', 'STUDY', 'BOOK', 'CLASS', 'EXAM', 'SKILL', 'KNOW', 'MIND', 'THINK', 'IDEA', 'WISDOM', 'SCHOOL', 'UNIVERSITY', 'PROFESSOR', 'STUDENT', 'LESSON', 'CURRICULUM', 'KNOWLEDGE', 'EDUCATION'],
  environment: ['TREE', 'OCEAN', 'EARTH', 'WIND', 'RAIN', 'SUN', 'NATURE', 'GREEN', 'CLEAN', 'PLANET', 'FOREST', 'WATER', 'ECOLOGY', 'CLIMATE', 'WEATHER', 'ANIMAL', 'PLANT', 'SUSTAINABLE', 'RENEWABLE', 'POLLUTION'],
};

// Fallback hints for each domain
const FALLBACK_HINTS = {
  technology: {
    CODE: 'Software development process',
    DATA: 'Information storage unit',
    WEB: 'Internet browsing platform',
    API: 'App communication interface',
    TECH: 'Gadget innovation field',
    SMART: 'Intelligent device feature',
    LEARN: 'AI training process',
    SYSTEM: 'Integrated software framework',
    CLOUD: 'Online data storage',
    NETWORK: 'Connected device web',
    SERVER: 'Data hosting machine',
    DATABASE: 'Structured data repository',
    ALGORITHM: 'Step-by-step problem solver',
    PROGRAM: 'Set of instructions',
    SOFTWARE: 'Computer programs and applications',
    HARDWARE: 'Physical computer components',
    INTERNET: 'Global network of computers',
    COMPUTER: 'Electronic device for processing',
    DEVELOP: 'Create or improve software',
    INNOVATE: 'Introduce new ideas or methods',
  },
  science: {
    ATOM: 'Smallest chemical unit',
    CELL: 'Life’s basic structure',
    DNA: 'Genetic code molecule',
    GENE: 'Heredity instruction segment',
    MASS: 'Matter quantity measure',
    ENERGY: 'Power for motion',
    FORCE: 'Push or pull',
    LIGHT: 'Visible electromagnetic wave',
    SPACE: 'Cosmic exploration realm',
    MATTER: 'Physical substance base',
    THEORY: 'Scientific explanation model',
    METHOD: 'Research process steps',
    EXPERIMENT: 'Test of hypothesis',
    RESEARCH: 'Systematic investigation',
    LABORATORY: 'Controlled environment for experiments',
    SCIENTIST: 'Person who conducts research',
    DISCOVERY: 'Finding something new',
    INVENTION: 'Creating something new',
    HYPOTHESIS: 'Testable prediction',
    OBSERVATION: 'Act of noticing',
  },
  business: {
    BRAND: 'Company identity marker',
    SALES: 'Revenue generating activity',
    PROFIT: 'Financial gain result',
    MARKET: 'Customer demand space',
    PLAN: 'Strategic business outline',
    GOAL: 'Targeted success aim',
    TEAM: 'Collaborative work group',
    LEAD: 'Guide organizational direction',
    GROWTH: 'Business expansion phase',
    VALUE: 'Customer benefit offer',
    TRADE: 'Goods exchange process',
    CLIENT: 'Service recipient partner',
    STRATEGY: 'Plan to achieve goals',
    INVESTMENT: 'Money spent for profit',
    ENTREPRENEUR: 'Person who starts businesses',
    MANAGEMENT: 'Directing business operations',
    FINANCE: 'Managing money matters',
    ECONOMY: 'System of production and consumption',
    INDUSTRY: 'Sector of economic activity',
    COMMERCE: 'Buying and selling goods',
  },
  health: {
    HEART: 'Blood circulation organ',
    BRAIN: 'Thought processing center',
    BLOOD: 'Vital fluid transport',
    BONE: 'Skeletal support structure',
    MUSCLE: 'Movement enabling tissue',
    HEALTH: 'Well-being state goal',
    DIET: 'Nutrition intake plan',
    EXERCISE: 'Physical fitness activity',
    SLEEP: 'Restorative body process',
    WELLNESS: 'Holistic health balance',
    IMMUNE: 'Disease defense system',
    STRESS: 'Mental strain response',
    MEDICINE: 'Substance to treat disease',
    DOCTOR: 'Medical professional',
    HOSPITAL: 'Place for medical treatment',
    TREATMENT: 'Medical care for illness',
    DISEASE: 'Abnormal condition affecting health',
    PREVENTION: 'Measures to avoid illness',
    NUTRITION: 'Food and health science',
    FITNESS: 'Physical health and strength',
  },
  education: {
    LEARN: 'Knowledge acquisition process',
    TEACH: 'Skill sharing act',
    STUDY: 'Focused learning effort',
    BOOK: 'Knowledge source material',
    CLASS: 'Group learning session',
    EXAM: 'Knowledge assessment test',
    SKILL: 'Practical ability gained',
    KNOW: 'Understand information deeply',
    MIND: 'Cognitive thinking faculty',
    THINK: 'Idea generation process',
    IDEA: 'Creative thought spark',
    WISDOM: 'Applied knowledge insight',
    SCHOOL: 'Institution for education',
    UNIVERSITY: 'Higher education institution',
    PROFESSOR: 'Teacher at university level',
    STUDENT: 'Person who learns',
    LESSON: 'Educational session',
    CURRICULUM: 'Course of study',
    KNOWLEDGE: 'Information and understanding',
    EDUCATION: 'Process of learning',
  },
  environment: {
    TREE: 'Carbon dioxide absorber',
    OCEAN: 'Vast water ecosystem',
    EARTH: 'Our living planet',
    WIND: 'Natural air movement',
    RAIN: 'Water cycle component',
    SUN: 'Energy source star',
    NATURE: 'Wildlife and ecosystems',
    GREEN: 'Forest color symbol',
    CLEAN: 'Pollution-free environment goal',
    PLANET: 'Celestial body home',
    FOREST: 'Dense tree habitat',
    WATER: 'Life sustaining liquid',
    ECOLOGY: 'Study of ecosystems',
    CLIMATE: 'Long-term weather patterns',
    WEATHER: 'Short-term atmospheric conditions',
    ANIMAL: 'Living creature',
    PLANT: 'Photosynthetic organism',
    SUSTAINABLE: 'Environmentally friendly',
    RENEWABLE: 'Energy from natural sources',
    POLLUTION: 'Contamination of environment',
  },
};

// Enhanced Gemini Service with improved hint generation
class GeminiService {
  static async generateWords(domain, difficulty, count, usedWords) {
    const config = DIFFICULTY_CONFIGS[difficulty];
    if (!config || !domain || !count || !Array.isArray(usedWords)) {
      toast.error('Invalid parameters for word generation.');
      return this.getFallbackWords(domain, count, config);
    }

    const prompt = `Generate exactly ${count} unique English words highly relevant to the "${domain}" domain. 
    Exclude these used words: [${usedWords.join(',')}]. 
    Words must be ${config.minWordLength} to ${config.maxWordLength} letters, suitable for ${difficulty} difficulty. 
    Focus on educational, core concepts of the domain. Respond ONLY with words separated by commas, no explanations.`;

    try {
      toast.info('AI is generating words...');
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error('API key not configured. Using fallback words.');
        return this.getFallbackWords(domain, count, config);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Client': 'gemini-react-wordsearch' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.9 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        toast.error(`API error (${response.status}). Using fallback words.`);
        return this.getFallbackWords(domain, count, config);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        toast.warning('No words generated by AI. Using fallback words.');
        return this.getFallbackWords(domain, count, config);
      }

      const words = generatedText
        .split(',')
        .map((word) => word.trim().toUpperCase().replace(/[^A-Z]/g, ''))
        .filter((word) => word.length >= config.minWordLength && word.length <= config.maxWordLength && /^[A-Z]+$/.test(word) && !usedWords.includes(word))
        .slice(0, count);

      if (words.length < count) {
        const fallbackWords = this.getFallbackWords(domain, count - words.length, config, [...usedWords, ...words]);
        words.push(...fallbackWords);
      }

      toast.success(`Generated ${words.length} unique words for ${domain}!`);
      return words;
    } catch (error) {
      toast.error('Error generating words. Using fallback words.');
      console.error('Error generating words:', error);
      return this.getFallbackWords(domain, count, config);
    }
  }

  static getFallbackWords(domain, count, config, excludeWords = []) {
    const domainWords = FALLBACK_WORDS[domain] || FALLBACK_WORDS.technology;
    const filteredWords = domainWords.filter(
      (word) => !excludeWords.includes(word) && word.length >= config.minWordLength && word.length <= config.maxWordLength
    );
    return filteredWords.slice(0, count);
  }

  static async generateHint(word, domain, retries = 2) {
    if (!word || !domain) return this.getFallbackHint(word, domain);

    const prompt = `Provide a concise 4-word hint for the word "${word}" in the "${domain}" domain. 
    The hint must describe the word's meaning or context without using the word itself, any of its parts, or generic phrases like "related to". 
    Make it educational, domain-specific, and avoid direct references to the word. Respond ONLY with the 4-word hint.`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('API key not configured. Using fallback hint.');
        return this.getFallbackHint(word, domain);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Client': 'gemini-react-wordsearch' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 50, temperature: 0.4 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Hint generation failed for ${word}. Retries left: ${retries - 1}`);
        if (retries > 0) {
          return this.generateHint(word, domain, retries - 1);
        }
        return this.getFallbackHint(word, domain);
      }

      const data = await response.json();
      const hintText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (
        hintText &&
        !hintText.toUpperCase().includes(word.toUpperCase()) &&
        !hintText.toLowerCase().includes('related to') &&
        hintText.trim().split(/\s+/).length === 4
      ) {
        return hintText.trim().slice(0, 50);
      }

      console.warn(`Invalid hint for ${word}: "${hintText}". Retries left: ${retries - 1}`);
      if (retries > 0) {
        return this.generateHint(word, domain, retries - 1);
      }
      return this.getFallbackHint(word, domain);
    } catch (error) {
      console.error('Error generating hint:', error);
      if (retries > 0) {
        console.warn(`Retrying hint generation for ${word}. Retries left: ${retries - 1}`);
        return this.generateHint(word, domain, retries - 1);
      }
      return this.getFallbackHint(word, domain);
    }
  }

  static getFallbackHint(word, domain) {
    const domainHints = FALLBACK_HINTS[domain] || FALLBACK_HINTS.technology;
    return domainHints[word] || `Key ${domain} concept`;
  }

  static async explainWord(word, domain) {
    if (!word || !domain) return this.getFallbackExplanation(word, domain);

    const prompt = `Explain "${word}" in the "${domain}" domain in English. 
    Limit to 15 words, focus on educational relevance. Respond ONLY with the explanation.`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) return this.getFallbackExplanation(word, domain);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Client': 'gemini-react-wordsearch' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 50, temperature: 0.5 },
        }),
      });

      if (!response.ok) return this.getFallbackExplanation(word, domain);

      const data = await response.json();
      const explanationText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return explanationText ? explanationText.trim().slice(0, 100) : this.getFallbackExplanation(word, domain);
    } catch (error) {
      console.error('Error explaining word:', error);
      return this.getFallbackExplanation(word, domain);
    }
  }

  static getFallbackExplanation(word, domain) {
    return `${word} is a key concept in ${domain}.`;
  }
}

// Enhanced grid generator with better placement algorithm
const generateGrid = (words, gridSize) => {
  if (!words?.length || !gridSize) return { grid: [], placedWords: [] };

  const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
  const placedWords = [];

  const directions = [
    [0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1],
  ];

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
    let attempts = 0;
    const maxAttempts = 500;

    while (attempts < maxAttempts) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const [dy, dx] = direction;
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
  let placedCount = 0;

  sortedWords.forEach((word) => {
    if (placeWord(word)) placedCount++;
  });

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === '') grid[i][j] = alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }

  if (placedCount < words.length) toast.warning(`Only ${placedCount}/${words.length} words placed.`);

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
  const [usedWords, setUsedWords] = useState([]);

  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionLine, setSelectionLine] = useState(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1024, height: 768 });

  const gridRef = useRef(null);
  const intervalRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const currentConfig = useMemo(() => (selectedDifficulty ? DIFFICULTY_CONFIGS[selectedDifficulty] : null), [selectedDifficulty]);
  const progressPercentage = useMemo(
    () => (generatedWords.length > 0 ? (foundWords.length / generatedWords.length) * 100 : 0),
    [foundWords.length, generatedWords.length]
  );

  const selectDomain = useCallback((domain) => {
    setSelectedDomain(domain);
    setGameState('difficulty-selection');
    setUsedWords([]);
    setGeneratedWords([]);
    setWordHints([]);
    toast.success(`Selected ${domain.name} domain!`);
  }, []);

  const selectDifficulty = useCallback(
    async (difficulty) => {
      setSelectedDifficulty(difficulty);
      setGameState('loading');
      setIsLoading(true);

      setGeneratedWords([]);
      setWordHints([]);
      setWordExplanations([]);
      setGrid([]);
      setWordsData([]);
      setFoundWords([]);
      setScore(0);
      setSelectedCells([]);
      setSelectionLine(null);

      const config = DIFFICULTY_CONFIGS[difficulty];
      const words = await GeminiService.generateWords(selectedDomain.id, difficulty, config.wordCount, usedWords);

      if (!words?.length) {
        toast.error('Failed to generate words.');
        setGameState('domain-selection');
        setIsLoading(false);
        return;
      }

      const hints = await Promise.all(
        words.map(async (word) => {
          setIsLoading(true);
          const hint = await GeminiService.generateHint(word, selectedDomain.id);
          setIsLoading(false);
          return hint || GeminiService.getFallbackHint(word, selectedDomain.id);
        })
      );

      setGeneratedWords(words);
      setWordHints(hints);
      setUsedWords((prev) => [...new Set([...prev, ...words])].slice(-200));

      const { grid: newGrid, placedWords } = generateGrid(words, config.gridSize);
      if (!placedWords?.length) {
        toast.error('Failed to place words in grid.');
        setGameState('domain-selection');
        setIsLoading(false);
        return;
      }

      setGrid(newGrid);
      setWordsData(placedWords);
      setTimeLeft(config.gameDuration);

      setGameState('playing');
      toast.success(`Game started! Find ${placedWords.length} words.`);
      setIsLoading(false);
    },
    [selectedDomain, usedWords]
  );

  const addWordExplanation = useCallback(
    async (word) => {
      if (!selectedDomain?.id || !word) return;

      const explanation = await GeminiService.explainWord(word, selectedDomain.id);
      setWordExplanations((prev) => [...prev, { word, explanation }]);
      toast.success(`Learned about: ${word}`);
    },
    [selectedDomain]
  );

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('finished');
            toast.info("Time's up!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (generatedWords.length > 0 && foundWords.length === generatedWords.length && gameState === 'playing') {
      setGameState('finished');
      setShowConfetti(true);
      toast.success('You found all words!');
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [foundWords.length, generatedWords.length, gameState]);

  const handleMouseDown = useCallback(
    (row, col) => {
      if (gameState !== 'playing' || row == null || col == null) return;
      setIsSelecting(true);
      setSelectedCells([{ row, col }]);
    },
    [gameState]
  );

  const handleMouseEnter = useCallback(
    (row, col) => {
      if (!isSelecting || gameState !== 'playing' || row == null || col == null) return;

      const start = selectedCells[0];
      if (!start) return;

      const newSelection = getLineCells(start.row, start.col, row, col);
      setSelectedCells(newSelection);

      if (gridRef.current && currentConfig) {
        const gridSize = currentConfig.gridSize;
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
            y2: endRect.top - containerRect.top + endRect.height / 2,
          });
        }
      }
    },
    [isSelecting, selectedCells, gameState, currentConfig]
  );

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || gameState !== 'playing') return;

    setIsSelecting(false);

    const currentSelectionLetters = selectedCells.map((cell) => grid[cell.row][cell.col]).join('');
    const foundWordData = wordsData.find(
      (wordData) => {
        const isMatch =
          wordData.word === currentSelectionLetters || wordData.word === currentSelectionLetters.split('').reverse().join('');
        return isMatch && !wordData.found;
      }
    );

    if (foundWordData) {
      setFoundWords((prev) => [...prev, foundWordData.word]);
      const points = foundWordData.word.length * 10;
      setScore((prev) => prev + points);
      setWordsData((prev) =>
        prev.map((word) => (word.word === foundWordData.word ? { ...word, found: true } : word))
      );

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      if (typeof window !== 'undefined' && 'vibrate' in window.navigator) window.navigator.vibrate([100, 50, 100]);

      toast.success(`Found "${foundWordData.word}"! +${points} points`);
      await addWordExplanation(foundWordData.word);
    }

    setTimeout(() => {
      setSelectedCells([]);
      setSelectionLine(null);
    }, 300);
  }, [isSelecting, selectedCells, grid, wordsData, gameState, addWordExplanation]);

  const getLineCells = useCallback(
    (startRow, startCol, endRow, endCol) => {
      const cells = [];
      const dx = Math.sign(endCol - startCol);
      const dy = Math.sign(endRow - startRow);
      const gridSize = currentConfig ? currentConfig.gridSize : 12;

      if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
        let currentRow = startRow;
        let currentCol = startCol;

        while (true) {
          if (currentRow < 0 || currentRow >= gridSize || currentCol < 0 || currentCol >= gridSize) break;
          cells.push({ row: currentRow, col: currentCol });
          if (currentRow === endRow && currentCol === endCol) break;
          currentRow += dy;
          currentCol += dx;
        }
      }
      return cells;
    },
    [currentConfig]
  );

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isCellSelected = useCallback(
    (row, col) => selectedCells.some((cell) => cell.row === row && cell.col === col),
    [selectedCells]
  );

  const isCellInFoundWord = useCallback(
    (row, col) => wordsData.find((wordData) => wordData.found && wordData.positions.some(([r, c]) => r === row && c === col)),
    [wordsData]
  );

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
    setSelectedCells([]);
    setSelectionLine(null);
    setUsedWords([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
    toast.info('Returned to main menu');
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-purple-100 p-2 sm:p-4 font-sans antialiased overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
        .glassmorphism {
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        .gradient-text {
          background: linear-gradient(135deg, #3b82f6, #06b6d4, #a855f7);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradient-shift 3s ease infinite;
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .flash {
          animation: flash 0.5s ease-in-out;
        }
        @keyframes flash {
          0%, 100% { background: rgba(52, 211, 153, 0.5); }
          50% { background: rgba(52, 211, 153, 1); }
        }
        .pulse-line {
          animation: pulse-line 1s ease-in-out infinite;
        }
        @keyframes pulse-line {
          0%, 100% { stroke-opacity: 0.8; }
          50% { stroke-opacity: 1; }
        }
        .grid-cell:hover {
          transform: scale(1.1);
          background-color: #e2e8f0;
          transition: all 0.2s ease-in-out;
        }
      `}</style>

      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} />}

      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black gradient-text mb-3 flex items-center justify-center gap-2 sm:gap-4 float">
            <Brain className="text-blue-600" size={windowSize.width < 640 ? 40 : 56} />
            Machy Kelma - AI Word Search
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="text-blue-800 text-lg sm:text-xl font-medium">
            Learn through AI-powered word discovery
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {gameState === 'domain-selection' && (
            <motion.div key="domain-selection" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 sm:space-y-10">
              <motion.div variants={itemVariants} className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-4 sm:mb-5 flex items-center justify-center gap-3">
                  <Sparkles className="text-blue-600 animate-pulse" size={windowSize.width < 640 ? 24 : 32} />
                  Choose Your Learning Domain
                </h2>
                <p className="text-blue-800 text-base sm:text-lg">AI will generate specialized words to boost your knowledge</p>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
                {DOMAINS.map((domain, index) => (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05, y: -8, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectDomain(domain)}
                    className="glassmorphism rounded-2xl sm:rounded-3xl p-5 sm:p-7 cursor-pointer group hover:bg-white/20 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${domain.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <div className="relative text-center">
                      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300">{domain.icon}</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2 group-hover:text-blue-600 transition-colors">{domain.name}</h3>
                      <p className="text-blue-700 text-sm group-hover:text-blue-600 transition-colors">{domain.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {gameState === 'difficulty-selection' && (
            <motion.div key="difficulty-selection" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 sm:space-y-10">
              <motion.div variants={itemVariants} className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-4 sm:mb-5 flex items-center justify-center gap-3">
                  <Star className="text-blue-600 animate-pulse" size={windowSize.width < 640 ? 24 : 32} />
                  Select Difficulty Level
                </h2>
                <p className="text-blue-800 text-base sm:text-lg">
                  Choose your challenge for{' '}
                  <span className={`font-semibold bg-gradient-to-r ${selectedDomain?.gradient} bg-clip-text text-transparent`}>{selectedDomain?.name}</span>
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
                {Object.entries(DIFFICULTY_CONFIGS).map(([difficulty, config], index) => (
                  <motion.div
                    key={difficulty}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05, y: -8, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectDifficulty(difficulty)}
                    className="glassmorphism rounded-2xl sm:rounded-3xl p-5 sm:p-7 cursor-pointer hover:bg-white/20 transition-all duration-300 group"
                  >
                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-3 group-hover:gradient-text transition-all">{capitalize(difficulty)}</h3>
                      <div className="space-y-2 text-blue-700 text-sm">
                        <p>{config.gridSize}×{config.gridSize} grid</p>
                        <p>{config.wordCount} words</p>
                        <p>{Math.floor(config.gameDuration / 60)} minutes</p>
                        <p className="text-xs opacity-75">
                          {difficulty === 'easy' && 'Perfect for beginners'}
                          {difficulty === 'medium' && 'Good challenge level'}
                          {difficulty === 'hard' && 'For experienced players'}
                          {difficulty === 'master' && 'Ultimate challenge'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {gameState === 'loading' && (
            <motion.div
              key="loading"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center space-y-8 flex flex-col items-center justify-center min-h-[50vh]"
            >
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ rotate: { duration: 2, repeat: Infinity, ease: 'linear' }, scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' } }}
                className="text-6xl sm:text-7xl mb-6"
              >
                🧠
              </motion.div>

              <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold gradient-text mb-4">
                AI is Generating Words...
              </motion.h2>

              <motion.p variants={itemVariants} className="text-blue-800 text-base sm:text-lg">
                Preparing {selectedDifficulty ? capitalize(selectedDifficulty) : ''} game for{' '}
                <span className={`font-semibold bg-gradient-to-r ${selectedDomain?.gradient} bg-clip-text text-transparent`}>{selectedDomain?.name}</span>
              </motion.p>

              <motion.div variants={itemVariants} className="mt-8 w-64 sm:w-80">
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden glassmorphism">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && (
            <motion.div key="game" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                <motion.div variants={itemVariants} className="glassmorphism rounded-xl sm:rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-2xl sm:text-3xl">{selectedDomain?.icon}</span>
                    <div>
                      <div className="text-blue-800 text-lg sm:text-xl font-bold">
                        {selectedDomain?.name} - {selectedDifficulty ? capitalize(selectedDifficulty) : ''}
                      </div>
                      <div className="text-blue-700 text-xs sm:text-sm">Learning Domain</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="glassmorphism rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-blue-800 font-bold text-lg sm:text-xl mb-4 sm:mb-5 flex items-center gap-3">
                    <Clock className="text-blue-600" size={20} /> Stats
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Clock className="text-blue-600" size={18} />
                        <span className="text-blue-700 text-sm sm:text-base">Time Left</span>
                      </div>
                      <div className={`font-mono text-lg sm:text-2xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-blue-800'}`}>
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Trophy className="text-blue-600" size={18} />
                        <span className="text-blue-700 text-sm sm:text-base">Score</span>
                      </div>
                      <div className="text-blue-800 font-bold text-lg sm:text-2xl">{score}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Target className="text-blue-600" size={18} />
                        <span className="text-blue-700 text-sm sm:text-base">Progress</span>
                      </div>
                      <div className="text-blue-800 font-bold text-lg sm:text-2xl">
                        {foundWords.length}/{generatedWords.length}
                      </div>
                    </div>

                    <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="glassmorphism rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-blue-800 font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-3">
                    <BookOpen size={20} className="text-blue-600" />
                    Word Hints
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-48 sm:max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {wordHints.map((hint, index) => {
                      const isFound = foundWords.includes(generatedWords[index]);
                      return (
                        <motion.div
                          key={`${generatedWords[index]}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-2 sm:p-3 rounded-lg text-center text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 ${
                            isFound
                              ? 'bg-emerald-400/30 text-emerald-800 line-through'
                              : 'bg-blue-400/20 text-blue-800 hover:bg-blue-400/30'
                          }`}
                        >
                          {hint}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 sm:px-5 py-3 rounded-xl font-bold text-sm sm:text-lg flex items-center justify-center gap-3 hover:from-blue-600 hover:to-cyan-500 transition-all duration-200"
                  >
                    {gameState === 'playing' ? <Pause size={20} /> : <Play size={20} />}
                    {gameState === 'playing' ? 'Pause Game' : 'Resume Game'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToMainMenu}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 sm:px-5 py-3 rounded-xl font-bold text-sm sm:text-lg flex items-center justify-center gap-3 hover:from-blue-700 hover:to-blue-500 transition-all duration-200"
                  >
                    <RotateCcw size={20} />
                    Change Domain
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectDifficulty(selectedDifficulty)}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 sm:px-5 py-3 rounded-xl font-bold text-sm sm:text-lg flex items-center justify-center gap-3 hover:from-blue-600 hover:to-cyan-500 transition-all duration-200"
                  >
                    <RefreshCw size={20} />
                    New Game
                  </motion.button>
                </motion.div>
              </div>

              <div className="xl:col-span-3 flex flex-col gap-4 sm:gap-6">
                <motion.div variants={itemVariants} className="relative p-2 sm:p-4 glassmorphism rounded-2xl sm:rounded-3xl">
                  <div
                    ref={gridRef}
                    className="grid gap-1 sm:gap-2 justify-center"
                    style={{ gridTemplateColumns: `repeat(${currentConfig ? currentConfig.gridSize : 12}, 1fr)`, userSelect: 'none', touchAction: 'none' }}
                    onMouseLeave={() => isSelecting && handleMouseUp()}
                  >
                    {grid.map((row, i) =>
                      row.map((letter, j) => {
                        const isSelected = isCellSelected(i, j);
                        const foundWordData = isCellInFoundWord(i, j);

                        return (
                          <motion.div
                            key={`${i}-${j}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (i + j) * 0.01 }}
                            className={`
                              grid-cell w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center 
                              text-sm sm:text-lg md:text-xl font-extrabold uppercase
                              rounded-md border border-blue-200 cursor-pointer transition-colors duration-200
                              ${isSelected
                                ? 'bg-cyan-400 text-white border-cyan-500'
                                : foundWordData
                                ? 'bg-emerald-400 text-white border-emerald-500'
                                : 'bg-white text-blue-800'
                              }
                            `}
                            onMouseDown={() => handleMouseDown(i, j)}
                            onMouseEnter={() => handleMouseEnter(i, j)}
                            onMouseUp={handleMouseUp}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              handleMouseDown(i, j);
                            }}
                            onTouchMove={(e) => {
                              e.preventDefault();
                              const touch = e.touches[0];
                              const element = document.elementFromPoint(touch.clientX, touch.clientY);
                              if (element && element.dataset.row && element.dataset.col) {
                                handleMouseEnter(parseInt(element.dataset.row), parseInt(element.dataset.col));
                              }
                            }}
                            onTouchEnd={handleMouseUp}
                            data-row={i}
                            data-col={j}
                          >
                            {letter}
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {selectionLine && (
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      <motion.line
                        x1={selectionLine.x1}
                        y1={selectionLine.y1}
                        x2={selectionLine.x2}
                        y2={selectionLine.y2}
                        stroke="url(#selection-gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="pulse-line"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.9 }}
                        transition={{ duration: 0.2 }}
                      />
                      <defs>
                        <linearGradient id="selection-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}

                  {gameState === 'paused' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-blue-800/80 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-sm"
                    >
                      <div className="text-center">
                        <Pause className="text-white mx-auto mb-4" size={48} />
                        <div className="text-white text-2xl sm:text-3xl font-bold">Game Paused</div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="glassmorphism rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-blue-800 font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-3">
                    <Sparkles size={20} className="text-blue-600" />
                    Word Explanations
                  </h3>
                  <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {wordExplanations.length === 0 ? (
                      <p className="text-blue-700 text-sm text-center py-8">Find words to see explanations here.</p>
                    ) : (
                      wordExplanations.map(({ word, explanation }, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/20 p-3 sm:p-4 rounded-lg hover:bg-white/30 transition-all duration-200"
                        >
                          <span className="text-blue-800 font-bold text-sm sm:text-base">{word}</span>
                          <p className="text-blue-700 text-xs sm:text-sm mt-1">{explanation}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {gameState === 'finished' && (
            <motion.div key="finished" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center space-y-8 sm:space-y-10">
              <motion.div variants={itemVariants} className="glassmorphism rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-lg mx-auto">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                >
                  <Trophy classFracme="text-blue-600 mx-auto mb-6" size={64} />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-4 sm:mb-5">
                  {foundWords.length === generatedWords.length ? 'Perfect Score!' : 'Great Effort!'}
                </h2>

                <div className="text-blue-700 text-base sm:text-lg space-y-3">
                  <p className="text-xl sm:text-2xl">
                    Final Score: <span className="font-extrabold text-blue-800 gradient-text">{score}</span>
                  </p>
                  <p>
                    Words Found: <span className="font-bold text-blue-800">{foundWords.length}/{generatedWords.length}</span>
                  </p>
                  <p>
                    Time Used:{' '}
                    <span className="font-bold text-blue-800">{formatTime(currentConfig ? currentConfig.gameDuration - timeLeft : 0)}</span>
                  </p>
                  <p>
                    Domain:{' '}
                    <span className="font-bold text-blue-800">
                      {selectedDomain?.name} ({selectedDifficulty ? capitalize(selectedDifficulty) : ''})
                    </span>
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center max-w-xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectDifficulty(selectedDifficulty)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-blue-400/25 transition-all duration-200"
                >
                  <Play size={20} />
                  Play Again
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToMainMenu}
                  className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-blue-400/25 transition-all duration-200"
                >
                  <RotateCcw size={20} />
                  New Domain
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 glassmorphism rounded-full px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-3 sm:gap-4 z-50"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                <Brain className="text-blue-600" size={20} />
              </motion.div>
              <span className="text-blue-800 text-xs sm:text-sm font-medium">AI Processing...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WordSearchGame;