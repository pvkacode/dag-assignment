'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import GraphCanvas from './GraphCanvas'
import ControlsPanel from './ControlsPanel'
import InputPanel from './InputPanel'
import DataStructuresPanel from './DataStructuresPanel'
import { useTheme } from '@/contexts/ThemeContext'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import { generateRandomDAG, createSampleDAG, hasCycle } from '@/lib/dagUtils'

export type AnimationMode = 'topological' | 'dfs' | 'bfs'
export type AnimationState = 'idle' | 'running' | 'paused'

export default function DagVisualizer() {
  const { theme } = useTheme()
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [mode, setMode] = useState<AnimationMode>('topological')
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [speed, setSpeed] = useState(50)
  const [error, setError] = useState<string | null>(null)
  
  // Data structure states for visualization
  const [visited, setVisited] = useState<Map<string, number>>(new Map())
  const [queue, setQueue] = useState<string[]>([])
  const [stack, setStack] = useState<string[]>([])
  const [currentNode, setCurrentNode] = useState<string | undefined>()

  // Generate random DAG
  const handleGenerateRandom = useCallback((numNodes: number, numEdges: number) => {
    const { nodes: newNodes, edges: newEdges } = generateRandomDAG(numNodes, numEdges)
    setNodes(newNodes)
    setEdges(newEdges)
    setError(null)
    setCurrentStep(0)
    setAnimationState('idle')
  }, [])

  // Initialize visited map for all nodes
  const initializeVisitedMap = useCallback(() => {
    const visitedMap = new Map<string, number>()
    nodes.forEach(node => visitedMap.set(node.id, 0))
    return visitedMap
  }, [nodes])

  // Load sample DAG
  useEffect(() => {
    const { nodes: sampleNodes, edges: sampleEdges } = createSampleDAG()
    setNodes(sampleNodes)
    setEdges(sampleEdges)
  }, [])

  // Initialize visited map when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const initialVisited = initializeVisitedMap()
      setVisited(initialVisited)
    }
  }, [nodes, initializeVisitedMap])

  // Handle graph updates
  const handleGraphUpdate = useCallback((newNodes: GraphNode[], newEdges: GraphEdge[]) => {
    setNodes(newNodes)
    setEdges(newEdges)
    setError(null)
    setCurrentStep(0)
    setAnimationState('idle')
  }, [])

  // Validate graph
  const validateGraph = useCallback(() => {
    if (hasCycle(nodes, edges)) {
      setError('Graph contains cycles! Please ensure it is a DAG.')
      return false
    }
    setError(null)
    return true
  }, [nodes, edges])

  // Memoize onDataStructureUpdate to prevent infinite loops
  const handleDataStructureUpdate = useCallback((visitedMap: Map<string, number>, queueArr?: string[], stackArr?: string[], currNode?: string) => {
    setVisited(visitedMap)
    setQueue(queueArr || [])
    setStack(stackArr || [])
    setCurrentNode(currNode)
  }, [])

  return (
    <div className="min-h-screen transition-all duration-500">
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="mb-12"
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
            DAG Visualizer
          </h1>
          <p className="text-xl text-slate-300 font-light leading-relaxed">
            Interactive visualization of Directed Acyclic Graphs with Topological Sort and DFS
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 bg-red-500/10 backdrop-blur-lg text-red-200 rounded-2xl border border-red-500/30 shadow-soft"
          >
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Input Panel - Left Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-1"
          >
            <InputPanel
              nodes={nodes}
              edges={edges}
              onGraphUpdate={handleGraphUpdate}
              onGenerateRandom={handleGenerateRandom}
              onValidate={validateGraph}
              theme={theme}
            />
          </motion.div>

          {/* Graph Canvas - Main Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-3"
          >
            <div className="rounded-2xl shadow-2xl p-8 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 space-y-6">
              {/* Controls Panel - Moved to top */}
              <ControlsPanel
                mode={mode}
                animationState={animationState}
                currentStep={currentStep}
                speed={speed}
                onModeChange={setMode}
                onStateChange={setAnimationState}
                onStepChange={setCurrentStep}
                onSpeedChange={setSpeed}
                onReset={() => {
                  setCurrentStep(0)
                  setAnimationState('idle')
                  const initialVisited = initializeVisitedMap()
                  setVisited(initialVisited)
                  setQueue([])
                  setStack([])
                  setCurrentNode(undefined)
                }}
                nodes={nodes}
                edges={edges}
                theme={theme}
              />

              <GraphCanvas
                nodes={nodes}
                edges={edges}
                mode={mode}
                animationState={animationState}
                currentStep={currentStep}
                speed={speed}
                onGraphUpdate={handleGraphUpdate}
                onError={setError}
                onDataStructureUpdate={handleDataStructureUpdate}
                theme={theme}
              />

              {/* Data Structures Panel */}
              <DataStructuresPanel
                nodes={nodes}
                edges={edges}
                visited={visited}
                queue={(mode === 'topological' || mode === 'bfs') ? queue : undefined}
                stack={mode === 'dfs' ? stack : undefined}
                currentNode={currentNode}
                mode={mode}
                theme={theme}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

