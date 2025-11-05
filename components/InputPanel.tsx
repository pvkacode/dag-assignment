'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import { createSampleDAG } from '@/lib/dagUtils'

interface InputPanelProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onGraphUpdate: (nodes: GraphNode[], edges: GraphEdge[]) => void
  onGenerateRandom: (numNodes: number, numEdges: number) => void
  onValidate: () => void
  theme: 'light' | 'dark'
}

export default function InputPanel({
  nodes,
  edges,
  onGraphUpdate,
  onGenerateRandom,
  onValidate,
  theme,
}: InputPanelProps) {
  const { theme: currentTheme, toggleTheme } = useTheme()
  const [numNodes, setNumNodes] = useState(8)
  const [numEdges, setNumEdges] = useState(10)
  const [numNodesInput, setNumNodesInput] = useState('8')
  const [numEdgesInput, setNumEdgesInput] = useState('10')

  const handleNodesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNumNodesInput(value)
    // Allow empty string for editing
    if (value === '') {
      return
    }
    const num = Number(value)
    if (!isNaN(num) && num >= 3 && num <= 20) {
      setNumNodes(num)
    }
  }

  const handleNodesBlur = () => {
    const num = Number(numNodesInput)
    if (isNaN(num) || num < 3) {
      setNumNodesInput('3')
      setNumNodes(3)
    } else if (num > 20) {
      setNumNodesInput('20')
      setNumNodes(20)
    } else {
      setNumNodesInput(String(numNodes))
    }
  }

  const handleEdgesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNumEdgesInput(value)
    // Allow empty string for editing
    if (value === '') {
      return
    }
    const num = Number(value)
    if (!isNaN(num) && num >= 1 && num <= 30) {
      setNumEdges(num)
    }
  }

  const handleEdgesBlur = () => {
    const num = Number(numEdgesInput)
    if (isNaN(num) || num < 1) {
      setNumEdgesInput('1')
      setNumEdges(1)
    } else if (num > 30) {
      setNumEdgesInput('30')
      setNumEdges(30)
    } else {
      setNumEdgesInput(String(numEdges))
    }
  }

  const handleGenerateRandom = () => {
    // Ensure values are valid before generating
    const validNodes = Math.min(20, Math.max(3, numNodes))
    const validEdges = Math.min(30, Math.max(1, numEdges))
    onGenerateRandom(validNodes, validEdges)
  }

  const handleLoadSample = () => {
    const { nodes: sampleNodes, edges: sampleEdges } = createSampleDAG()
    onGraphUpdate(sampleNodes, sampleEdges)
  }

  const buttonClass = `w-full px-5 py-3 rounded-xl font-medium transition-all duration-300 mb-3 bg-slate-800/60 hover:bg-slate-700/60 text-slate-200 border border-slate-700/50 hover:border-slate-600 shadow-soft hover:shadow-glow-blue`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 rounded-2xl shadow-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/50"
    >
      <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">
        Graph Controls
      </h2>

      {/* Theme Toggle */}
      <div className="mb-6">
        <button
          onClick={toggleTheme}
          className="w-full px-5 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-400 hover:via-purple-400 hover:to-fuchsia-400 text-white shadow-soft hover:shadow-glow transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      {/* Generate Random Graph */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">
          Generate Random DAG
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-400">
              Number of Nodes
            </label>
            <input
              type="number"
              min="3"
              max="20"
              value={numNodesInput}
              onChange={handleNodesChange}
              onBlur={handleNodesBlur}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 text-white border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-400">
              Number of Edges
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={numEdgesInput}
              onChange={handleEdgesChange}
              onBlur={handleEdgesBlur}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 text-white border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
            />
          </div>
          <button
            onClick={handleGenerateRandom}
            className="w-full px-5 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-soft hover:shadow-glow-blue transform hover:scale-[1.02] active:scale-[0.98]"
          >
            🎲 Generate Random
          </button>
        </div>
      </div>

      {/* Sample Graph */}
      <div className="mb-6">
        <button
          onClick={handleLoadSample}
          className={buttonClass}
        >
          📋 Load Sample DAG
        </button>
      </div>

      {/* Validate Graph */}
      <div className="mb-6">
        <button
          onClick={onValidate}
          className={buttonClass}
        >
          ✓ Validate DAG
        </button>
      </div>

      {/* Graph Info */}
      <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-3 text-slate-200">
          Graph Info
        </h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p className="flex justify-between">
            <span>Nodes:</span>
            <span className="font-bold text-purple-400">{nodes.length}</span>
          </p>
          <p className="flex justify-between">
            <span>Edges:</span>
            <span className="font-bold text-cyan-400">{edges.length}</span>
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-5 rounded-xl bg-blue-500/10 border border-blue-400/30 backdrop-blur-sm">
        <h3 className="text-sm font-semibold mb-3 text-blue-300">
          💡 Tips
        </h3>
        <ul className="text-xs space-y-1.5 text-blue-200/80">
          <li>• Drag nodes to reposition</li>
          <li>• Connect nodes by dragging</li>
          <li>• Select mode above to animate</li>
          <li>• Use speed slider to adjust</li>
        </ul>
      </div>
    </motion.div>
  )
}

