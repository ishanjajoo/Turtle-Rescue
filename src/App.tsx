/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Turtle as TurtleIcon, 
  Wind, 
  Waves, 
  Skull, 
  CheckCircle2, 
  RotateCcw,
  Info,
  ChevronUp
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
  LEAF_CAPACITY 
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

const TurtleSprite = ({ isInShell, isDead, isMoving }: { isInShell: boolean; isDead: boolean; isMoving: boolean }) => {
  return (
    <motion.div 
      className="relative w-full h-full flex items-center justify-center"
      animate={isMoving ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 0.4, repeat: isMoving ? Infinity : 0 }}
    >
      <div className={`
        relative w-16 h-16 transition-all duration-500 flex items-center justify-center
        ${isInShell ? 'scale-75 rotate-12' : 'scale-100'}
        ${isDead ? 'grayscale opacity-40 rotate-180' : ''}
      `}>
        {/* Shadow */}
        {!isDead && (
          <div className="absolute bottom-2 w-10 h-4 bg-black/20 rounded-full blur-md -z-10" />
        )}

        <video 
          key="turtle-video"
          src="/Turtle animation png.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          className="w-full h-full object-contain drop-shadow-md"
          style={{
            mixBlendMode: 'multiply',
            filter: isInShell ? 'sepia(0.5) saturate(2) hue-rotate(-30deg)' : 'none'
          }}
        />
        
        {/* Status Overlays */}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skull className="w-6 h-6 text-red-900/50" />
          </div>
        )}
        {isInShell && (
          <div className="absolute -top-1 -right-1 bg-[#5d4037] text-white text-[8px] px-1 rounded-full font-bold uppercase tracking-tighter shadow-sm border border-white/20">
            Shell
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [showTutorial, setShowTutorial] = useState(true);

  const resetGame = () => {
    setState(INITIAL_STATE);
  };

  const processTurn = useCallback((action: (prevState: GameState) => GameState) => {
    setState(prev => {
      if (prev.isGameOver) return prev;

      // 1. Apply Player Action
      let newState = action(prev);

      // 2. Hatch Egg
      if (newState.nextEggIndex < MAX_TURTLES) {
        const newTurtle: Turtle = {
          id: newState.nextEggIndex + 1,
          col: newState.nextEggIndex,
          row: 5,
          state: 'active',
          isInShell: false,
        };
        newState = {
          ...newState,
          turtles: [...newState.turtles, newTurtle],
          nextEggIndex: newState.nextEggIndex + 1,
        };
      }

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

    if (state.isShellModeActive) {
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
    } else {
      // Move Action
      processTurn((prev) => ({
        ...prev,
        turtles: prev.turtles.map(t => {
          if (t.id === turtleId && t.state === 'active') {
            return { ...t, row: t.row - 1 };
          }
          return t;
        }),
        lastAction: 'Moved Turtle',
      }));
    }
  };

  const placeLeaf = (row: number, col: number) => {
    if (state.leafCount <= 0 || row === 0 || row === 5 || state.isGameOver || state.isShellModeActive) return;
    if (state.leaves.some(l => l.row === row && l.col === col)) return;

    processTurn((prev) => ({
      ...prev,
      leaves: [...prev.leaves, { id: Date.now(), row, col }],
      leafCount: prev.leafCount - 1,
      lastAction: 'Placed Leaf',
    }));
  };

  const toggleShellMode = () => {
    if (state.isGameOver) return;
    setState(prev => ({ ...prev, isShellModeActive: !prev.isShellModeActive }));
  };

  const skipTurn = () => {
    if (state.isGameOver) return;
    processTurn((prev) => ({
      ...prev,
      lastAction: 'Skipped Turn',
    }));
  };

  return (
    <div className="min-h-screen relative font-sans text-[#4a3728] selection:bg-[#d2b48c] selection:text-white overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      
      {/* Fallback/Overlay for readability */}
      <div className="absolute inset-0 bg-white/10 -z-10" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-end border-b-2 border-[#4a3728] pb-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
              Turtle <span className="text-[#2e8b57]">Rescue</span>
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest opacity-60 mt-2">
              Level 01 • Operation Ocean
            </p>
          </div>
          <div className="flex gap-4 text-right">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold opacity-50">Safe</span>
              <span className="text-2xl font-mono leading-none">
                {state.turtles.filter(t => t.state === 'safe').length}/5
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold opacity-50">Lost</span>
              <span className="text-2xl font-mono leading-none text-red-700">
                {state.turtles.filter(t => t.state === 'dead').length}
              </span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8 items-start">
          {/* Grid Area */}
          <div className={`
            relative aspect-[5/6] bg-transparent overflow-hidden
            ${state.isShellModeActive ? 'ring-4 ring-[#8b4513] ring-inset' : ''}
          `}>
            {/* Goal Row (Transparent to show video background) */}
            <div className="absolute top-0 left-0 right-0 h-[16.66%] flex items-center justify-center overflow-hidden">
              {/* Optional: Add a subtle foam line if the video doesn't have one at the right spot */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 blur-sm"></div>
            </div>

            {/* Grid Nodes (Invisible but clickable) */}
            <div className="absolute inset-0 grid grid-rows-6 grid-cols-5">
              {[...Array(GRID_ROWS * GRID_COLS)].map((_, i) => {
                const row = Math.floor(i / GRID_COLS);
                const col = i % GRID_COLS;
                const isSpawn = row === 5;
                const isGoal = row === 0;
                const isCrabRow = row === 3;

                return (
                  <div 
                    key={i}
                    onClick={() => placeLeaf(row, col)}
                    className={`
                      relative flex items-center justify-center cursor-pointer
                      hover:bg-white/5 transition-colors
                      ${isSpawn ? 'bg-black/5' : ''}
                      ${isGoal ? 'pointer-events-none' : ''}
                    `}
                  >
                    {/* Crab Row Indicator (Subtle) */}
                    {isCrabRow && col === 0 && (
                      <div className="absolute left-1 top-1 text-[8px] font-bold opacity-5 uppercase">Crab Zone</div>
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
                      isMoving={state.lastAction === 'Moved Turtle' && state.turnCount > 0} 
                    />
                    {state.isShellModeActive && turtle.state === 'active' && (
                      <div className="absolute inset-0 rounded-full ring-2 ring-white animate-pulse pointer-events-none"></div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Predators */}
            {/* Seagull */}
            <motion.div
              animate={{ 
                top: `${(state.seagull.row / GRID_ROWS) * 100}%`,
                left: `${(state.seagull.col / GRID_COLS) * 100}%`,
              }}
              className="absolute z-40 pointer-events-none"
              style={{
                width: `${100 / GRID_COLS}%`,
                height: `${100 / GRID_ROWS}%`,
              }}
            >
              <div className="w-full h-full flex items-center justify-center p-1">
                <div className="w-full h-full bg-white rounded-lg flex items-center justify-center shadow-xl border-2 border-gray-300">
                  <span className="text-2xl">🐦</span>
                </div>
              </div>
            </motion.div>

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
              <div className="w-full h-full flex items-center justify-center p-1">
                <div className="w-full h-full bg-red-500 rounded-lg flex items-center justify-center shadow-xl border-2 border-red-700">
                  <span className="text-2xl">🦀</span>
                </div>
              </div>
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

          {/* Controls & Info */}
          <div className="flex flex-col gap-4">
            {/* Inventory */}
            <div className="bg-white p-4 border-2 border-[#4a3728] shadow-[4px_4px_0px_0px_rgba(74,55,40,1)]">
              <h3 className="text-[10px] uppercase font-bold opacity-50 mb-3 tracking-widest">Inventory</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#2e8b57] rounded-full flex items-center justify-center border border-[#1e5d3a]">
                    <Wind size={14} className="text-white" />
                  </div>
                  <span className="font-bold">Leaves</span>
                </div>
                <span className="text-xl font-mono">{state.leafCount}</span>
              </div>
              <p className="text-[10px] leading-tight opacity-70">
                Place on grid to protect up to 3 turtles from predators for one turn.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={toggleShellMode}
                disabled={state.isGameOver}
                className={`
                  w-full py-3 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2
                  ${state.isShellModeActive 
                    ? 'bg-[#8b4513] text-white ring-4 ring-[#4a3728]' 
                    : 'bg-white text-[#4a3728] border-2 border-[#4a3728] hover:bg-[#8b4513] hover:text-white'}
                `}
              >
                {state.isShellModeActive ? 'Select a Turtle' : 'Hide in Shell'}
              </button>
              <button 
                onClick={skipTurn}
                disabled={state.isGameOver}
                className="w-full bg-[#4a3728] text-white py-3 font-bold uppercase tracking-widest hover:bg-[#2e8b57] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Skip Turn <ChevronUp size={18} />
              </button>
              <button 
                onClick={resetGame}
                className="w-full border-2 border-[#4a3728] py-2 font-bold uppercase text-[10px] tracking-widest hover:bg-[#4a3728] hover:text-white transition-colors"
              >
                Reset Level
              </button>
            </div>

            {/* Last Action */}
            {state.lastAction && (
              <div className="text-[10px] uppercase font-mono opacity-50 text-center italic">
                Last: {state.lastAction} (Turn {state.turnCount})
              </div>
            )}

            {/* Tutorial Toggle */}
            <button 
              onClick={() => setShowTutorial(!showTutorial)}
              className="mt-auto flex items-center gap-2 text-[10px] uppercase font-bold opacity-50 hover:opacity-100 transition-opacity"
            >
              <Info size={14} /> {showTutorial ? 'Hide' : 'Show'} Guide
            </button>
          </div>
        </div>

        {/* Tutorial Overlay */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#4a3728] text-white p-6 border-2 border-white shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black uppercase italic">How to Play</h3>
                <button onClick={() => setShowTutorial(false)} className="text-white/50 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px] leading-relaxed">
                <div>
                  <p className="font-bold text-[#2e8b57] mb-1 uppercase">1. Movement</p>
                  Click a turtle to move it up 1 step. <strong>Only one turtle moves per turn!</strong>
                </div>
                <div>
                  <p className="font-bold text-[#2e8b57] mb-1 uppercase">2. Protection</p>
                  Use the <strong>Shell</strong> button to hide a turtle for 1 turn. It won't move while hidden.
                </div>
                <div>
                  <p className="font-bold text-[#2e8b57] mb-1 uppercase">3. Predators</p>
                  Avoid the <strong>Seagull</strong> and <strong>Crab</strong>. They move every turn, regardless of which turtle you move!
                </div>
              </div>
            </motion.div>
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
