'use client'

import { motion } from 'framer-motion'
import type { AnimationMode, AnimationState } from './DagVisualizer'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import { topologicalSortStepsDetailed, dfsStepsDetailed, bfsStepsDetailed } from '@/lib/dagUtils'

interface ControlsPanelProps {
  mode: AnimationMode
  animationState: AnimationState
  currentStep: number
  speed: number
  onModeChange: (mode: AnimationMode) => void
  onStateChange: (state: AnimationState) => void
  onStepChange: (step: number) => void
  onSpeedChange: (speed: number) => void
  onReset: () => void
  nodes: GraphNode[]
  edges: GraphEdge[]
  theme: 'light' | 'dark'
}

export default function ControlsPanel({
  mode,
  animationState,
  currentStep,
  speed,
  onModeChange,
  onStateChange,
  onStepChange,
  onSpeedChange,
  onReset,
  nodes,
  edges,
  theme,
}: ControlsPanelProps) {
  const topologicalStepCount = nodes.length > 0 ? topologicalSortStepsDetailed(nodes, edges).length : 0
  const dfsStepCount = nodes.length > 0 ? dfsStepsDetailed(nodes, edges).length : 0
  const bfsStepCount = nodes.length > 0 ? bfsStepsDetailed(nodes, edges).length : 0
  const maxSteps = mode === 'topological' 
    ? topologicalStepCount 
    : mode === 'dfs' 
    ? dfsStepCount 
    : bfsStepCount

  const handlePlayPause = () => {
    if (animationState === 'running') {
      onStateChange('paused')
    } else {
      onStateChange('running')
    }
  }

  const handleStepForward = () => {
    if (animationState === 'idle' && currentStep < maxSteps) {
      onStepChange(currentStep + 1)
    }
  }

  const buttonClass = `px-5 py-2.5 rounded-xl font-medium transition-all duration-300 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/50 hover:border-slate-600 shadow-soft hover:shadow-glow-blue`

  const activeButtonClass = `px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-glow border border-purple-400/30`

  return (
    <div className="mt-8 p-6 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3 text-slate-200">
          Animation Mode:
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => onModeChange('topological')}
            className={mode === 'topological' ? activeButtonClass : buttonClass}
          >
            Topological Sort
          </button>
          <button
            onClick={() => onModeChange('dfs')}
            className={mode === 'dfs' ? activeButtonClass : buttonClass}
          >
            DFS Traversal
          </button>
          <button
            onClick={() => onModeChange('bfs')}
            className={mode === 'bfs' ? activeButtonClass : buttonClass}
          >
            BFS Traversal
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={handlePlayPause}
          disabled={nodes.length === 0}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
            nodes.length === 0
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-soft hover:shadow-glow-blue'
          }`}
        >
          {animationState === 'running' ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={handleStepForward}
          disabled={animationState === 'running' || currentStep >= maxSteps || nodes.length === 0}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
            animationState === 'running' || currentStep >= maxSteps || nodes.length === 0
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-soft hover:shadow-glow-blue'
          }`}
        >
          ⏭ Step
        </button>

        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-soft hover:shadow-glow transform hover:scale-[1.02] active:scale-[0.98]"
        >
          ↻ Reset
        </button>
      </div>

      {/* Speed Control */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3 text-slate-200">
          Speed: <span className="text-purple-400">{Math.round(((speed - 10) / (90 - 10)) * 100)}%</span>
        </label>
        <input
          type="range"
          min="10"
          max="90"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((speed - 10) / (90 - 10)) * 100}%, #475569 ${((speed - 10) / (90 - 10)) * 100}%, #475569 100%)`
          }}
        />
      </div>

      {/* Progress */}
      <div className="text-sm">
        <div className="flex justify-between mb-2">
          <span className="font-semibold text-slate-200">Progress:</span>
          <span className="text-slate-300">{currentStep} / {maxSteps}</span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / maxSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 h-3 rounded-full shadow-glow"
          />
        </div>
      </div>
    </div>
  )
}

