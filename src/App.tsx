/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Turtle as TurtleIcon, 
  Wind, 
  Waves, 
  Skull, 
  CheckCircle2, 
  RotateCcw,
  Info,
  ChevronUp,
  Leaf as LeafIcon,
  Shield
} from 'lucide-react';
import { 
  Turtle, 
  Leaf, 
  Predator, 
  GameState, 
  SEAGULL_PATH, 
  CRAB_PATH, 
  GRID_ROWS, 
  GRID_COLS, 
  MAX_TURTLES, 
  INITIAL_LEAF_COUNT, 
  LEAF_CAPACITY,
  TURTLE_PATHS
} from './types';

const INITIAL_STATE: GameState = {
  level: 1,
  turtles: [],
  leaves: [],
  leafCount: INITIAL_LEAF_COUNT,
  nextEggIndex: 0,
  seagull: { type: 'seagull', row: 0, col: 2, pathIndex: 0 },
  crab: { type: 'crab', row: 3, col: 4, pathIndex: 0 },
  isGameOver: false,
  isWin: false,
  turnCount: 0,
  lastAction: null,
  isShellModeActive: false,
};

const TurtleSprite = ({ isInShell, isDead, row, col }: { isInShell: boolean; isDead: boolean; row: number; col: number }) => {
  const [isCrawling, setIsCrawling] = useState(false);
  const [rotation, setRotation] = useState(0);
  const prevPos = useRef({ row, col });

  useEffect(() => {
    if (prevPos.current.row !== row || prevPos.current.col !== col) {
      const dx = col - prevPos.current.col;
      const dy = row - prevPos.current.row;
      if (dx !== 0 || dy !== 0) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        setRotation(angle);
      }
      
      setIsCrawling(true);
      const timer = setTimeout(() => setIsCrawling(false), 1000);
      prevPos.current = { row, col };
      return () => clearTimeout(timer);
    }
  }, [row, col]);

  return (
    <motion.div 
      className="relative w-full h-full flex items-center justify-center"
      animate={{ 
        y: isCrawling ? [0, -2, 0] : 0,
        rotate: isCrawling ? [rotation - 8, rotation + 8, rotation - 8] : rotation
      }}
      transition={{ 
        y: { duration: 0.4, repeat: isCrawling ? 2 : 0 },
        rotate: { duration: 0.25, repeat: isCrawling ? 4 : 0 }
      }}
    >
      <div className={`
        relative w-16 h-16 transition-all duration-500 flex items-center justify-center
        ${isInShell ? 'scale-75' : 'scale-100'}
        ${isDead ? 'grayscale opacity-40 rotate-180' : ''}
      `}>
        {/* Shadow */}
        {!isDead && (
          <div className="absolute bottom-2 w-10 h-4 bg-black/20 rounded-full blur-md -z-10" />
        )}

        {/* Custom Cute Baby Turtle */}
        <div className="relative w-12 h-12 flex items-center justify-center">
           {/* Fins - Front Left */}
           <motion.div 
             className="absolute top-2 -left-1.5 w-6 h-3.5 bg-[#4ade80] rounded-full border-2 border-[#166534] origin-right z-0"
             animate={isCrawling ? { rotate: [-45, 45, -45] } : { rotate: 0 }}
             transition={{ duration: 0.2, repeat: isCrawling ? Infinity : 0 }}
           />
           {/* Fins - Front Right */}
           <motion.div 
             className="absolute top-2 -right-1.5 w-6 h-3.5 bg-[#4ade80] rounded-full border-2 border-[#166534] origin-left z-0"
             animate={isCrawling ? { rotate: [45, -45, 45] } : { rotate: 0 }}
             transition={{ duration: 0.2, repeat: isCrawling ? Infinity : 0 }}
           />
           {/* Fins - Back Left */}
           <motion.div 
             className="absolute bottom-2 -left-1 w-5 h-3 bg-[#4ade80] rounded-full border-2 border-[#166534] origin-right z-0"
             animate={isCrawling ? { rotate: [35, -35, 35] } : { rotate: 0 }}
             transition={{ duration: 0.2, repeat: isCrawling ? Infinity : 0, delay: 0.05 }}
           />
           {/* Fins - Back Right */}
           <motion.div 
             className="absolute bottom-2 -right-1 w-5 h-3 bg-[#4ade80] rounded-full border-2 border-[#166534] origin-left z-0"
             animate={isCrawling ? { rotate: [-35, 35, -35] } : { rotate: 0 }}
             transition={{ duration: 0.2, repeat: isCrawling ? Infinity : 0, delay: 0.05 }}
           />

           {/* Tail */}
           <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-3 bg-[#4ade80] rounded-full border border-[#166534] z-0" />

           {/* Shell */}
           <div className={`
             relative w-11 h-12 bg-[#22c55e] rounded-[45%] border-4 border-[#166534] shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.2)] z-10 flex items-center justify-center overflow-hidden
             ${isInShell ? 'bg-[#5d4037] border-[#3e2723]' : ''}
           `}>
             {/* Shell Pattern - Hexagonal-ish */}
             <div className="absolute inset-0 opacity-20 flex flex-col items-center justify-center gap-1">
                <div className="flex gap-1">
                  <div className="w-3 h-3 border border-black rotate-45" />
                  <div className="w-3 h-3 border border-black rotate-45" />
                </div>
                <div className="w-4 h-4 border border-black rotate-45" />
                <div className="flex gap-1">
                  <div className="w-3 h-3 border border-black rotate-45" />
                  <div className="w-3 h-3 border border-black rotate-45" />
                </div>
             </div>
           </div>

           {/* Head */}
           {!isInShell && (
             <motion.div 
               className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-6 h-7 bg-[#4ade80] rounded-full border-2 border-[#166534] z-20 flex flex-col items-center pt-1.5"
               animate={isCrawling ? { y: [0, -1, 0] } : {}}
             >
               <div className="flex gap-1.5">
                 <div className="w-2 h-2 bg-black rounded-full" />
                 <div className="w-2 h-2 bg-black rounded-full" />
               </div>
               {/* Blush */}
               <div className="flex justify-between w-full px-1 mt-0.5 opacity-50">
                 <div className="w-1.5 h-1 bg-pink-400 rounded-full" />
                 <div className="w-1.5 h-1 bg-pink-400 rounded-full" />
               </div>
             </motion.div>
           )}
        </div>
        
        {/* Status Overlays */}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <Skull className="w-6 h-6 text-red-900/50" />
          </div>
        )}
        {isInShell && (
          <div className="absolute -top-1 -right-1 bg-[#5d4037] text-white text-[8px] px-1 rounded-full font-bold uppercase tracking-tighter shadow-sm border border-white/20 z-30">
            Shell
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FlyingBird = ({ isShadow = false }: { isShadow?: boolean }) => {
  return (
    <div className={`relative ${isShadow ? 'opacity-20 blur-[2px] grayscale brightness-0' : 'drop-shadow-2xl'}`}>
      <motion.svg 
        viewBox="0 0 100 60" 
        className={`${isShadow ? 'w-16 h-10' : 'w-24 h-16'}`}
        fill={isShadow ? "black" : "#4a5568"}
      >
        {/* Body */}
        <path d="M30,30 Q50,20 70,30 Q50,40 30,30" fill={isShadow ? "black" : "#f7fafc"} stroke={isShadow ? "black" : "#cbd5e0"} strokeWidth="1" />
        {/* Left Wing */}
        <motion.path 
          d="M50,25 Q30,0 10,20 Q30,15 50,25" 
          fill={isShadow ? "black" : "#edf2f7"} 
          stroke={isShadow ? "black" : "#cbd5e0"} 
          strokeWidth="1"
          animate={{ rotateX: [0, 60, 0], y: [0, 5, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: "25px", originX: "50px" }}
        />
        {/* Right Wing */}
        <motion.path 
          d="M50,25 Q70,0 90,20 Q70,15 50,25" 
          fill={isShadow ? "black" : "#edf2f7"} 
          stroke={isShadow ? "black" : "#cbd5e0"} 
          strokeWidth="1"
          animate={{ rotateX: [0, 60, 0], y: [0, 5, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: "25px", originX: "50px" }}
        />
        {/* Head */}
        <circle cx="72" cy="28" r="4" fill={isShadow ? "black" : "#f7fafc"} stroke={isShadow ? "black" : "#cbd5e0"} strokeWidth="1" />
        <path d="M75,28 L82,28 L75,31 Z" fill={isShadow ? "black" : "#ecc94b"} />
      </motion.svg>
    </div>
  );
};

const BirdAnimation = ({ row, col, turnCount }: { row: number, col: number, turnCount: number }) => {
  if (turnCount === 0) return null;
  
  return (
    <motion.div
      key={turnCount}
      initial={{ x: -600, y: -400, opacity: 0, scale: 2.5, rotate: -30 }}
      animate={{ 
        x: [-600, 0, 0, 600],
        y: [-400, 0, 0, -400],
        opacity: [0, 1, 1, 0],
        scale: [2.5, 1, 1, 0.6],
        rotate: [-30, 0, 0, 30],
      }}
      transition={{ 
        duration: 2.5,
        times: [0, 0.2, 0.8, 1],
        ease: "easeInOut"
      }}
      className="absolute z-50 pointer-events-none"
      style={{
        top: `${(row / GRID_ROWS) * 100}%`,
        left: `${(col / GRID_COLS) * 100}%`,
        width: `${100 / GRID_COLS}%`,
        height: `${100 / GRID_ROWS}%`,
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
         <FlyingBird />
      </div>
    </motion.div>
  );
};

const CrabSprite = ({ col }: { col: number }) => {
  const [isMoving, setIsMoving] = useState(false);
  const prevCol = useRef(col);

  useEffect(() => {
    if (prevCol.current !== col) {
      setIsMoving(true);
      const timer = setTimeout(() => setIsMoving(false), 1000);
      prevCol.current = col;
      return () => clearTimeout(timer);
    }
  }, [col]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div 
        className="relative w-12 h-9 bg-[#ef4444] rounded-[40%] border-2 border-[#991b1b] shadow-lg flex items-center justify-center"
        animate={isMoving ? { x: [-1, 1, -1], y: [0, -2, 0] } : {}}
        transition={{ duration: 0.2, repeat: Infinity }}
      >
        {/* Eye Stalks */}
        <div className="absolute -top-3 left-3 w-0.5 h-3 bg-[#991b1b]" />
        <div className="absolute -top-4 left-3 -translate-x-1/2 w-2 h-2 bg-white rounded-full border border-[#991b1b] flex items-center justify-center">
          <div className="w-1 h-1 bg-black rounded-full" />
        </div>
        <div className="absolute -top-3 right-3 w-0.5 h-3 bg-[#991b1b]" />
        <div className="absolute -top-4 right-3 translate-x-1/2 w-2 h-2 bg-white rounded-full border border-[#991b1b] flex items-center justify-center">
          <div className="w-1 h-1 bg-black rounded-full" />
        </div>

        {/* Claws (Pincers) */}
        <motion.div 
          className="absolute -top-2 -left-4 w-5 h-4 bg-[#ef4444] rounded-full border-2 border-[#991b1b] origin-right"
          animate={{ rotate: [0, -30, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          <div className="absolute top-1 left-0 w-2 h-1 bg-[#991b1b] rounded-full" />
        </motion.div>
        <motion.div 
          className="absolute -top-2 -right-4 w-5 h-4 bg-[#ef4444] rounded-full border-2 border-[#991b1b] origin-left"
          animate={{ rotate: [0, 30, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          <div className="absolute top-1 right-0 w-2 h-1 bg-[#991b1b] rounded-full" />
        </motion.div>

        {/* Scuttling Legs */}
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={`left-${i}`}
            className="absolute -left-3 w-4 h-1 bg-[#dc2626] rounded-full origin-right"
            style={{ top: `${25 + i * 25}%` }}
            animate={isMoving ? { rotate: [-20, 20, -20] } : { rotate: -15 }}
            transition={{ duration: 0.1, repeat: Infinity, delay: i * 0.03 }}
          />
        ))}
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={`right-${i}`}
            className="absolute -right-3 w-4 h-1 bg-[#dc2626] rounded-full origin-left"
            style={{ top: `${25 + i * 25}%` }}
            animate={isMoving ? { rotate: [20, -20, 20] } : { rotate: 15 }}
            transition={{ duration: 0.1, repeat: Infinity, delay: i * 0.03 }}
          />
        ))}
      </motion.div>
    </div>
  );
};

const RevolvingShadow = ({ row, col }: { row: number, col: number }) => {
  return (
    <motion.div 
      className="absolute z-10 pointer-events-none"
      style={{
        top: `${(row / GRID_ROWS) * 100}%`,
        left: `${(col / GRID_COLS) * 100}%`,
        width: `${100 / GRID_COLS}%`,
        height: `${100 / GRID_ROWS}%`,
      }}
    >
      <motion.div 
        className="w-full h-full flex items-center justify-center"
        animate={{ 
          x: [0, 15, 0, -15, 0],
          y: [0, -10, 0, 10, 0],
          scale: [1, 1.1, 1, 0.9, 1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        <FlyingBird isShadow />
      </motion.div>
    </motion.div>
  );
};

const PathOverlay = () => {
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none" 
      viewBox="0 0 500 600" 
      preserveAspectRatio="none"
    >
      {TURTLE_PATHS.map((path, i) => {
        // Create a smooth path using Cubic Bezier curves
        let d = `M ${path[0][1] * 100 + 50} ${path[0][0] * 100 + 50}`;
        
        for (let j = 0; j < path.length - 1; j++) {
          const [r1, c1] = path[j];
          const [r2, c2] = path[j + 1];
          
          const x1 = c1 * 100 + 50;
          const y1 = r1 * 100 + 50;
          const x2 = c2 * 100 + 50;
          const y2 = r2 * 100 + 50;
          
          // Control points for a smooth curve
          const cx1 = x1;
          const cy1 = y1 - 50;
          const cx2 = x2;
          const cy2 = y2 + 50;
          
          d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
        }

        return (
          <g key={i}>
            {/* Outer glow/sand trail */}
            <path
              d={d}
              fill="none"
              stroke="#fdf5e6"
              strokeWidth="24"
              strokeLinecap="round"
              className="opacity-10 blur-md"
            />
            {/* Animated sand trail */}
            <path
              d={d}
              fill="none"
              stroke="#fdf5e6"
              strokeWidth="12"
              strokeLinecap="round"
              className="sand-trail"
            />
            {/* Inner path */}
            <path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeDasharray="4 8"
              className="opacity-20"
            />
          </g>
        );
      })}
    </svg>
  );
};

const VideoBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-60"
      >
        <source src="/videos/background mute.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [showTutorial, setShowTutorial] = useState(true);
  const [activeTool, setActiveTool] = useState<'move' | 'leaf' | 'shell'>('move');

  const resetGame = () => {
    setState(INITIAL_STATE);
    setActiveTool('move');
  };

  const processTurn = useCallback((action: (prevState: GameState) => GameState) => {
    setState(prev => {
      if (prev.isGameOver) return prev;

      // 1. Apply Player Action
      let newState = action(prev);

      // 3. Move Predators
      const nextSeagullIndex = (newState.seagull.pathIndex + 1) % SEAGULL_PATH.length;
      const nextCrabIndex = (newState.crab.pathIndex + 1) % CRAB_PATH.length;
      
      newState = {
        ...newState,
        seagull: {
          ...newState.seagull,
          pathIndex: nextSeagullIndex,
          row: SEAGULL_PATH[nextSeagullIndex],
        },
        crab: {
          ...newState.crab,
          pathIndex: nextCrabIndex,
          col: CRAB_PATH[nextCrabIndex],
        },
      };

      // 5. Apply Leaf Protection & 6. Resolve Attacks
      const protectedNodes = new Map<string, number>();
      newState.leaves.forEach(leaf => {
        protectedNodes.set(`${leaf.row},${leaf.col}`, LEAF_CAPACITY);
      });

      newState = {
        ...newState,
        turtles: newState.turtles.map(t => {
          if (t.state !== 'active') return t;

          const nodeKey = `${t.row},${t.col}`;
          const capacity = protectedNodes.get(nodeKey) || 0;
          
          let isProtected = false;
          if (capacity > 0) {
            isProtected = true;
            protectedNodes.set(nodeKey, capacity - 1);
          }

          if (t.isInShell) return t; // Shell is highest protection

          // Resolve Attacks
          if (t.row === newState.seagull.row && t.col === newState.seagull.col) {
            if (!isProtected) return { ...t, state: 'dead' as const };
          }

          if (t.row === 3 && t.col === newState.crab.col) {
            if (!isProtected) return { ...t, state: 'dead' as const };
          }

          return t;
        }),
      };

      // 7. Check Goal
      newState = {
        ...newState,
        turtles: newState.turtles.map(t => {
          if (t.state === 'active' && t.row === 0) {
            return { ...t, state: 'safe' as const };
          }
          return t;
        }),
      };

      // 8. Reset Shells (Turtle can be in shell for only 1 move)
      newState = {
        ...newState,
        turtles: newState.turtles.map(t => ({ ...t, isInShell: false })),
        isShellModeActive: false, // Reset shell mode
      };

      // 9. Check End Condition
      const safeCount = newState.turtles.filter(t => t.state === 'safe').length;
      const deadCount = newState.turtles.filter(t => t.state === 'dead').length;
      const totalProcessed = safeCount + deadCount;

      if (safeCount === MAX_TURTLES) {
        newState.isWin = true;
        newState.isGameOver = true;
      } else if (totalProcessed === MAX_TURTLES) {
        newState.isGameOver = true;
      }

      return { ...newState, turnCount: newState.turnCount + 1 };
    });
  }, []);

  const handleTurtleClick = (turtleId: number) => {
    if (state.isGameOver) return;

    if (activeTool === 'shell') {
      // Use Shell Action
      processTurn((prev) => ({
        ...prev,
        turtles: prev.turtles.map(t => {
          if (t.id === turtleId && t.state === 'active') {
            return { ...t, isInShell: true };
          }
          return t;
        }),
        lastAction: 'Used Shell',
      }));
      setActiveTool('move');
    } else if (activeTool === 'move') {
      // Move Action
      processTurn((prev) => ({
        ...prev,
        turtles: prev.turtles.map(t => {
          if (t.id === turtleId && t.state === 'active') {
            const nextStep = t.pathStep + 1;
            const path = TURTLE_PATHS[t.pathIndex];
            if (nextStep < path.length) {
              const [nextRow, nextCol] = path[nextStep];
              return { ...t, pathStep: nextStep, row: nextRow, col: nextCol };
            }
          }
          return t;
        }),
        lastAction: 'Moved Turtle',
      }));
    }
  };

  const placeLeaf = (row: number, col: number) => {
    if (activeTool !== 'leaf' || state.leafCount <= 0 || row === 0 || row === 5 || state.isGameOver) return;
    if (state.leaves.some(l => l.row === row && l.col === col)) return;

    processTurn((prev) => ({
      ...prev,
      leaves: [...prev.leaves, { id: Date.now(), row, col }],
      leafCount: prev.leafCount - 1,
      lastAction: 'Placed Leaf',
    }));
    setActiveTool('move');
  };

  const hatchTurtle = () => {
    if (state.isGameOver || state.nextEggIndex >= MAX_TURTLES) return;

    processTurn((prev) => {
      const pathIndex = prev.nextEggIndex;
      const [startRow, startCol] = TURTLE_PATHS[pathIndex][0];
      const newTurtle: Turtle = {
        id: prev.nextEggIndex + 1,
        col: startCol,
        row: startRow,
        state: 'active',
        isInShell: false,
        pathIndex: pathIndex,
        pathStep: 0,
      };
      return {
        ...prev,
        turtles: [...prev.turtles, newTurtle],
        nextEggIndex: prev.nextEggIndex + 1,
        lastAction: 'Hatched Turtle',
      };
    });
  };

  return (
    <div 
      className={`
        min-h-screen relative font-sans text-[#4a3728] selection:bg-[#d2b48c] selection:text-white overflow-hidden flex flex-col items-center justify-center p-4
        ${activeTool === 'leaf' ? 'cursor-crosshair' : ''}
        ${activeTool === 'shell' ? 'cursor-help' : ''}
      `}
    >
      {/* Background Spritesheet */}
      <VideoBackground />
      
      {/* Fallback/Overlay for readability */}
      <div className="absolute inset-0 bg-white/10 -z-10" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col gap-6">
        {/* Header / Top Controls */}
        <div className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border-2 border-[#4a3728] shadow-[4px_4px_0px_0px_rgba(74,55,40,1)]">
          <div className="flex gap-3">
            <div className="relative">
              <button 
                onClick={() => setActiveTool(activeTool === 'leaf' ? 'move' : 'leaf')}
                disabled={state.isGameOver || state.leafCount <= 0}
                className={`
                  w-14 h-14 rounded-xl transition-all flex flex-col items-center justify-center
                  ${activeTool === 'leaf' 
                    ? 'bg-[#2e8b57] text-white ring-4 ring-[#1e5d3a] scale-105 shadow-lg' 
                    : 'bg-[#f0fdf4] text-[#2e8b57] border-2 border-[#2e8b57] hover:bg-[#2e8b57] hover:text-white'}
                `}
              >
                <LeafIcon size={20} />
                <span className="text-[10px] font-black mt-0.5">{state.leafCount}</span>
              </button>
              {state.leafCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white" />
              )}
            </div>

            <button 
              onClick={() => setActiveTool(activeTool === 'shell' ? 'move' : 'shell')}
              disabled={state.isGameOver}
              className={`
                w-14 h-14 rounded-xl transition-all flex items-center justify-center
                ${activeTool === 'shell' 
                  ? 'bg-[#8b4513] text-white ring-4 ring-[#4a3728] scale-105 shadow-lg' 
                  : 'bg-[#fff7ed] text-[#8b4513] border-2 border-[#8b4513] hover:bg-[#8b4513] hover:text-white'}
              `}
            >
              <Shield size={24} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-[#4a3728] leading-none">Turtle Rescue</h1>
            <div className="flex gap-4 text-[10px] font-bold uppercase opacity-60 mt-1">
              <span>Saved: {state.turtles.filter(t => t.state === 'safe').length}</span>
              <span>Lost: {state.turtles.filter(t => t.state === 'dead').length}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowTutorial(!showTutorial)}
              className="w-10 h-10 rounded-full bg-[#4a3728]/10 flex items-center justify-center hover:bg-[#4a3728] hover:text-white transition-all"
            >
              <Info size={18} />
            </button>
            <button 
              onClick={resetGame}
              className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 border-2 border-red-200 hover:bg-red-600 hover:text-white transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col gap-6 items-center">
          {/* Grid Area */}
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <div className="relative aspect-[5/6] bg-transparent overflow-hidden rounded-2xl">
            {/* Goal Row (Transparent to show video background) */}
            <div className="absolute top-0 left-0 right-0 h-[16.66%] flex items-center justify-center overflow-hidden">
              {/* Optional: Add a subtle foam line if the video doesn't have one at the right spot */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 blur-sm"></div>
            </div>

            {/* Path Overlay */}
            <PathOverlay />

            {/* Grid Nodes (Interactive) */}
            <div className="absolute inset-0 grid grid-rows-6 grid-cols-5">
              {[...Array(GRID_ROWS * GRID_COLS)].map((_, i) => {
                const row = Math.floor(i / GRID_COLS);
                const col = i % GRID_COLS;
                
                // Check if this node is part of any path
                const isPartOfPath = TURTLE_PATHS.some(path => 
                  path.some(([r, c]) => r === row && c === col)
                );
                
                const isSpawn = row === 5;
                const isGoal = row === 0;
                const isCrabRow = row === 3;

                return (
                  <div 
                    key={i}
                    onClick={() => placeLeaf(row, col)}
                    className={`
                      relative flex items-center justify-center cursor-pointer
                      transition-all duration-300
                      ${isGoal ? 'pointer-events-none' : ''}
                      hover:bg-white/10
                    `}
                  >
                    {/* Node Indicator (Visible for all nodes) */}
                    {!isGoal && (
                      <div className={`
                        w-1.5 h-1.5 rounded-full 
                        ${isPartOfPath ? 'bg-white/60 scale-150 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/10'}
                        ${isSpawn ? 'bg-white/80 scale-[2] shadow-[0_0_12px_rgba(255,255,255,0.8)]' : ''}
                      `} />
                    )}
                    
                    {/* Crab Row Indicator (Subtle) */}
                    {isCrabRow && col === 0 && (
                      <div className="absolute left-1 top-1 text-[8px] font-bold opacity-10 uppercase text-white">Crab Zone</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leaves */}
            <AnimatePresence>
              {state.leaves.map(leaf => (
                <motion.div
                  key={leaf.id}
                  initial={{ scale: 2, opacity: 0, y: -50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="absolute z-20 pointer-events-none"
                  style={{
                    top: `${(leaf.row / GRID_ROWS) * 100}%`,
                    left: `${(leaf.col / GRID_COLS) * 100}%`,
                    width: `${100 / GRID_COLS}%`,
                    height: `${100 / GRID_ROWS}%`,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <div className="w-full h-full bg-[#2e8b57] rounded-full flex items-center justify-center shadow-md border-2 border-[#1e5d3a]">
                      <Wind size={20} className="text-white/50" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Turtles */}
            <AnimatePresence>
              {state.turtles.map(turtle => {
                if (turtle.state === 'safe') return null;
                return (
                  <motion.div
                    key={turtle.id}
                    layoutId={`turtle-${turtle.id}`}
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: turtle.state === 'dead' ? 0.8 : 1,
                      opacity: turtle.state === 'dead' ? 0.5 : 1,
                      top: `${(turtle.row / GRID_ROWS) * 100}%`,
                      left: `${(turtle.col / GRID_COLS) * 100}%`,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTurtleClick(turtle.id);
                    }}
                    className="absolute z-30 cursor-pointer"
                    style={{
                      width: `${100 / GRID_COLS}%`,
                      height: `${100 / GRID_ROWS}%`,
                    }}
                  >
                    <TurtleSprite 
                      isInShell={turtle.isInShell} 
                      isDead={turtle.state === 'dead'} 
                      row={turtle.row}
                      col={turtle.col}
                    />
                    {activeTool === 'shell' && turtle.state === 'active' && (
                      <div className="absolute inset-0 rounded-full ring-2 ring-white animate-pulse pointer-events-none"></div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Predators */}
            {/* Seagull Shadow (Next Position) */}
            {(() => {
              const nextSeagullIndex = (state.seagull.pathIndex + 1) % SEAGULL_PATH.length;
              const nextSeagullRow = SEAGULL_PATH[nextSeagullIndex];
              const nextSeagullCol = state.seagull.col;
              return (
                <RevolvingShadow row={nextSeagullRow} col={nextSeagullCol} />
              );
            })()}

            {/* Flying Bird Animation */}
            <BirdAnimation 
              row={state.seagull.row} 
              col={state.seagull.col} 
              turnCount={state.turnCount} 
            />

            {/* Crab */}
            <motion.div
              animate={{ 
                top: `${(state.crab.row / GRID_ROWS) * 100}%`,
                left: `${(state.crab.col / GRID_COLS) * 100}%`,
              }}
              className="absolute z-40 pointer-events-none"
              style={{
                width: `${100 / GRID_COLS}%`,
                height: `${100 / GRID_ROWS}%`,
              }}
            >
              <CrabSprite col={state.crab.col} />
            </motion.div>

            {/* Game Over Overlay */}
            <AnimatePresence>
              {state.isGameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-[#4a3728]/90 flex flex-col items-center justify-center text-center p-6"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {state.isWin ? (
                      <>
                        <CheckCircle2 size={64} className="text-[#2e8b57] mx-auto mb-4" />
                        <h2 className="text-4xl font-black text-white uppercase italic mb-2">Victory!</h2>
                        <p className="text-white/70 mb-6">All turtles reached the ocean safely.</p>
                      </>
                    ) : (
                      <>
                        <Skull size={64} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-4xl font-black text-white uppercase italic mb-2">Mission End</h2>
                        <p className="text-white/70 mb-6">
                          {state.turtles.filter(t => t.state === 'safe').length} turtles saved.
                          {state.turtles.filter(t => t.state === 'dead').length} lost.
                        </p>
                      </>
                    )}
                    <button 
                      onClick={resetGame}
                      className="bg-white text-[#4a3728] px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#2e8b57] hover:text-white transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RotateCcw size={18} /> Try Again
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Eggs at the bottom */}
          <div className="flex justify-center gap-8 py-8 bg-black/5 rounded-b-2xl border-t border-black/10">
            {[...Array(MAX_TURTLES)].map((_, i) => {
              const isHatched = i < state.nextEggIndex;
              return (
                <motion.button
                  key={i}
                  whileHover={!isHatched ? { scale: 1.15, y: -8 } : {}}
                  whileTap={!isHatched ? { scale: 0.9 } : {}}
                  onClick={hatchTurtle}
                  disabled={isHatched || state.isGameOver}
                  className={`
                    relative w-16 h-20 transition-all duration-700
                    ${isHatched 
                      ? 'opacity-10 grayscale scale-75' 
                      : 'cursor-pointer hover:drop-shadow-2xl'}
                  `}
                >
                  {/* Egg Shell - More detailed shape */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br from-[#fdf5e6] to-[#f5f5dc] rounded-t-[60%] rounded-b-[40%] border-2 border-[#d2b48c] shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.05),4px_4px_8px_rgba(0,0,0,0.1)]
                    ${isHatched ? 'border-dashed opacity-50' : ''}
                  `}>
                    {/* Texture Spots - Speckled pattern */}
                    {!isHatched && (
                      <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-4 left-3 w-1 h-1 bg-[#8b4513] rounded-full" />
                        <div className="absolute top-6 right-4 w-1.5 h-1.5 bg-[#8b4513] rounded-full" />
                        <div className="absolute bottom-8 left-5 w-1 h-1 bg-[#8b4513] rounded-full" />
                        <div className="absolute bottom-10 right-6 w-1 h-1 bg-[#8b4513] rounded-full" />
                        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-[#8b4513] rounded-full" />
                      </div>
                    )}

                    {/* Cracks - More jagged and detailed */}
                    {!isHatched && (
                      <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
                        <path 
                          d="M30,40 L45,35 L40,50 L60,45 L55,65 L75,60" 
                          fill="none" 
                          stroke="#8b4513" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M70,20 L60,30 L75,35 L65,50" 
                          fill="none" 
                          stroke="#8b4513" 
                          strokeWidth="1" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          opacity="0.5"
                        />
                      </svg>
                    )}
                  </div>
                  
                  {/* Peeking Turtle (Half-hatched) */}
                  {!isHatched && (
                    <motion.div 
                      animate={{ 
                        y: [0, -4, 0],
                        rotate: [-2, 2, -2]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 scale-50 drop-shadow-md"
                    >
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-6 h-7 bg-[#4ade80] rounded-full border-2 border-[#166534] flex flex-col items-center pt-1.5">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-black rounded-full" />
                            <div className="w-2 h-2 bg-black rounded-full" />
                          </div>
                        </div>
                        <div className="w-11 h-12 bg-[#22c55e] rounded-[45%] border-4 border-[#166534]" />
                      </div>
                    </motion.div>
                  )}

                  {/* Shadow */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 rounded-full blur-md" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

        {/* Tutorial Overlay (Modal) */}
        <AnimatePresence>
          {showTutorial && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTutorial(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#4a3728] text-white p-8 border-4 border-white shadow-2xl rounded-3xl overflow-hidden"
              >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#2e8b57]/20 rounded-full -ml-16 -mb-16 blur-2xl" />

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2e8b57] rounded-xl flex items-center justify-center shadow-lg rotate-3">
                        <Info size={24} className="text-white" />
                      </div>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter">How to Play</h3>
                    </div>
                    <button 
                      onClick={() => setShowTutorial(false)} 
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm leading-relaxed">
                    <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="font-black text-[#4ade80] mb-1 uppercase italic tracking-wider">1. Hatch</p>
                        <p className="text-white/80">Click an <strong>Egg</strong> at the bottom to start a turtle's journey. You have 5 turtles to save!</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="font-black text-[#4ade80] mb-1 uppercase italic tracking-wider">2. Move</p>
                        <p className="text-white/80">Click a turtle to move it 1 step along its path. Each move advances the game turn.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="font-black text-[#4ade80] mb-1 uppercase italic tracking-wider">3. Protection</p>
                        <p className="text-white/80">Use <strong>Leaves</strong> to shield paths or <strong>Shells</strong> to hide turtles from danger.</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="font-black text-[#4ade80] mb-1 uppercase italic tracking-wider">4. Predators</p>
                        <p className="text-white/80">Watch the <strong>Shadow</strong>! The Seagull strikes where the shadow is. Avoid the Crab zone!</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowTutorial(false)}
                    className="mt-10 w-full bg-white text-[#4a3728] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#4ade80] hover:text-[#166534] transition-all shadow-[0_4px_0_0_#d2b48c] active:shadow-none active:translate-y-1"
                  >
                    Got it, let's save them!
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none opacity-30 text-[10px] font-mono uppercase tracking-widest">
        <span>© 2026 Turtle Rescue Corp</span>
        <span>Build v1.0.43</span>
      </div>
    </div>
  );
}
