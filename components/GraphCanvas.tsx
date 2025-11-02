'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import type { AnimationMode, AnimationState } from './DagVisualizer'
import { topologicalSortSteps, topologicalSortStepsDetailed, dfsStepsDetailed, bfsStepsDetailed, type DFSStep, type BFSStep } from '@/lib/dagUtils'

interface GraphCanvasProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  mode: AnimationMode
  animationState: AnimationState
  currentStep: number
  speed: number
  onGraphUpdate: (nodes: GraphNode[], edges: GraphEdge[]) => void
  onError: (error: string | null) => void
  onDataStructureUpdate?: (visited: Map<string, number>, queue?: string[], stack?: string[], currentNode?: string) => void
  theme: 'light' | 'dark'
}

export default function GraphCanvas({
  nodes,
  edges,
  mode,
  animationState,
  currentStep,
  speed,
  onGraphUpdate,
  onError,
  onDataStructureUpdate,
  theme,
}: GraphCanvasProps) {
  // Apply default styles to nodes
  const nodesWithStyles = nodes.map(node => ({
    ...node,
    style: {
      background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
      color: '#ffffff',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      width: 60,
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
      ...node.style,
    },
  }))
  
  const [displayNodes, setDisplayNodes] = useState<GraphNode[]>(nodesWithStyles)
  const [displayEdges, setDisplayEdges] = useState<GraphEdge[]>(edges)
  const [topologicalSteps, setTopologicalSteps] = useState<Array<{ removedNode: string; remainingNodes: string[] }>>([])
  const [topologicalDetailedSteps, setTopologicalDetailedSteps] = useState<Array<{ 
    removedNode: string
    queue: string[]
    visited: Map<string, number>
  }>>([])
  const [dfsDetailedSteps, setDfsDetailedSteps] = useState<DFSStep[]>([])
  const [bfsDetailedSteps, setBfsDetailedSteps] = useState<BFSStep[]>([])
  const [currentAnimationStep, setCurrentAnimationStep] = useState(0)
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set())
  
  // Initialize visited map for all nodes
  const initializeVisitedMap = useCallback(() => {
    const visitedMap = new Map<string, number>()
    nodes.forEach(node => visitedMap.set(node.id, 0))
    return visitedMap
  }, [nodes])

  // Animate topological sort step
  const animateTopologicalStep = useCallback((stepIndex: number) => {
    // Always use detailed steps if available, fallback to simple steps
    const detailedStep = topologicalDetailedSteps[stepIndex]
    const simpleStep = topologicalSteps[stepIndex]
    const step = detailedStep || simpleStep
    if (!step) return

    const removedNode = detailedStep ? detailedStep.removedNode : (simpleStep ? simpleStep.removedNode : '')
    if (!removedNode) return

    // Highlight the removed node
    setDisplayNodes((currentNodes) => {
      const updatedNodes = currentNodes.map(node => {
        if (node.id === removedNode) {
          return {
            ...node,
            style: {
              ...node.style,
              background: '#f87171',
              border: '3px solid #dc2626',
              transition: 'all 0.5s ease',
            },
          }
        }
        return node
      })

      // After a brief moment, fade out the removed node
      setTimeout(() => {
        setDisplayNodes((fadeNodes) => {
          return fadeNodes.map(node => {
            if (node.id === removedNode) {
              return {
                ...node,
                style: {
                  ...node.style,
                  opacity: 0.3,
                  background: '#94a3b8',
                },
              }
            }
            return node
          })
        })
      }, speed * 5)

      return updatedNodes
    })
    
    // Update data structures - always use detailed steps if available
    if (topologicalDetailedSteps[stepIndex]) {
      const detailedStep = topologicalDetailedSteps[stepIndex]
      onDataStructureUpdate?.(detailedStep.visited, detailedStep.queue, undefined, removedNode)
    } else if (simpleStep && 'remainingNodes' in simpleStep) {
      // Fallback: create visited map from remaining nodes
      const visitedMap = new Map<string, number>()
      nodes.forEach(node => {
        if (node.id === removedNode || !simpleStep.remainingNodes.includes(node.id)) {
          visitedMap.set(node.id, 1)
        } else {
          visitedMap.set(node.id, 0)
        }
      })
      onDataStructureUpdate?.(visitedMap, [], undefined, removedNode)
    }
  }, [topologicalSteps, topologicalDetailedSteps, speed, onDataStructureUpdate, nodes])

  // Animate DFS step with detailed data structures
  const animateDfsStep = useCallback((stepIndex: number) => {
    const step = dfsDetailedSteps[stepIndex]
    if (!step) return

    // Update visited nodes set for visual highlighting
    setVisitedNodes((prev) => {
      const updatedVisited = new Set(prev)
      if (step.visited.get(step.currentNode) === 1) {
        updatedVisited.add(step.currentNode)
      }
      
      setDisplayNodes((currentNodes) => {
        return currentNodes.map(node => {
          if (step.visited.get(node.id) === 1) {
            return {
              ...node,
              style: {
                ...node.style,
                background: '#60a5fa',
                border: '3px solid #3b82f6',
                transition: 'all 0.5s ease',
              },
            }
          }
          return node
        })
      })
      
      return updatedVisited
    })
    
    // Update data structures (visited array, stack)
    onDataStructureUpdate?.(step.visited, undefined, step.stack, step.currentNode)
  }, [dfsDetailedSteps, onDataStructureUpdate])

  // Animate BFS step with detailed data structures
  const animateBfsStep = useCallback((stepIndex: number) => {
    const step = bfsDetailedSteps[stepIndex]
    if (!step) return

    // Update visited nodes set for visual highlighting
    setVisitedNodes((prev) => {
      const updatedVisited = new Set(prev)
      if (step.visited.get(step.currentNode) === 1) {
        updatedVisited.add(step.currentNode)
      }
      
      setDisplayNodes((currentNodes) => {
        return currentNodes.map(node => {
          if (step.visited.get(node.id) === 1) {
            return {
              ...node,
              style: {
                ...node.style,
                background: '#10b981',
                border: '3px solid #059669',
                transition: 'all 0.5s ease',
              },
            }
          }
          return node
        })
      })
      
      return updatedVisited
    })
    
    // Update data structures (visited array, queue)
    onDataStructureUpdate?.(step.visited, step.queue, undefined, step.currentNode)
  }, [bfsDetailedSteps, onDataStructureUpdate])


  // Helper function to create styled nodes
  const createStyledNodes = useCallback((nodeList: GraphNode[]) => {
    return nodeList.map(node => ({
      ...node,
      style: {
        background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
        color: '#ffffff',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
        ...node.style,
      },
    }))
  }, [])

  // Recalculate steps when graph changes or mode changes
  useEffect(() => {
    const visitedMap = initializeVisitedMap()
    const styledNodes = createStyledNodes(nodes)
    
    if (mode === 'topological') {
      const simpleSteps = topologicalSortSteps(nodes, edges)
      const detailedSteps = topologicalSortStepsDetailed(nodes, edges)
      setTopologicalSteps(simpleSteps)
      setTopologicalDetailedSteps(detailedSteps)
      setCurrentAnimationStep(0)
      setDisplayNodes(styledNodes)
      setDisplayEdges(edges)
      setVisitedNodes(new Set())
      // Initialize with first step's queue if available
      const initialQueue = detailedSteps.length > 0 ? detailedSteps[0].queue : []
      onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
    } else if (mode === 'dfs') {
      const detailedSteps = dfsStepsDetailed(nodes, edges)
      setDfsDetailedSteps(detailedSteps)
      setCurrentAnimationStep(0)
      setDisplayNodes(styledNodes)
      setDisplayEdges(edges)
      setVisitedNodes(new Set())
      onDataStructureUpdate?.(visitedMap, undefined, [])
    } else if (mode === 'bfs') {
      const detailedSteps = bfsStepsDetailed(nodes, edges)
      setBfsDetailedSteps(detailedSteps)
      setCurrentAnimationStep(0)
      setDisplayNodes(styledNodes)
      setDisplayEdges(edges)
      setVisitedNodes(new Set())
      // Initialize with first step's queue if available
      const initialQueue = detailedSteps.length > 0 ? detailedSteps[0].queue : []
      onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
    }
  }, [nodes, edges, mode, initializeVisitedMap, onDataStructureUpdate, createStyledNodes])

  // Handle animation steps
  useEffect(() => {
    if (animationState !== 'running') return

    const timeoutId = setTimeout(() => {
      if (mode === 'topological') {
        const maxSteps = topologicalDetailedSteps.length || topologicalSteps.length
        if (currentAnimationStep < maxSteps) {
          animateTopologicalStep(currentAnimationStep)
          setCurrentAnimationStep(prev => prev + 1)
        } else {
          // Reset for loop
          setCurrentAnimationStep(0)
          const styledNodes = createStyledNodes(nodes)
          setDisplayNodes(styledNodes)
          setDisplayEdges(edges)
          setVisitedNodes(new Set())
          const visitedMap = initializeVisitedMap()
          const initialQueue = topologicalDetailedSteps.length > 0 ? topologicalDetailedSteps[0].queue : []
          onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
        }
      } else if (mode === 'dfs') {
        if (currentAnimationStep < dfsDetailedSteps.length) {
          animateDfsStep(currentAnimationStep)
          setCurrentAnimationStep(prev => prev + 1)
        } else {
          // Reset for loop
          setCurrentAnimationStep(0)
          const styledNodes = createStyledNodes(nodes)
          setDisplayNodes(styledNodes)
          setDisplayEdges(edges)
          setVisitedNodes(new Set())
          const visitedMap = initializeVisitedMap()
          onDataStructureUpdate?.(visitedMap, undefined, [])
        }
      } else if (mode === 'bfs') {
        if (currentAnimationStep < bfsDetailedSteps.length) {
          animateBfsStep(currentAnimationStep)
          setCurrentAnimationStep(prev => prev + 1)
        } else {
          // Reset for loop
          setCurrentAnimationStep(0)
          const styledNodes = createStyledNodes(nodes)
          setDisplayNodes(styledNodes)
          setDisplayEdges(edges)
          setVisitedNodes(new Set())
          const visitedMap = initializeVisitedMap()
          const initialQueue = bfsDetailedSteps.length > 0 ? bfsDetailedSteps[0].queue : []
          onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
        }
      }
    }, speed * 10)

    return () => clearTimeout(timeoutId)
  }, [animationState, currentAnimationStep, speed, mode, topologicalSteps, topologicalDetailedSteps, dfsDetailedSteps, bfsDetailedSteps, nodes, edges, animateTopologicalStep, animateDfsStep, animateBfsStep, initializeVisitedMap, onDataStructureUpdate, createStyledNodes])

  // Handle manual step forward
  useEffect(() => {
    if (animationState === 'idle' && currentStep > currentAnimationStep) {
      if (mode === 'topological') {
        const maxSteps = topologicalDetailedSteps.length || topologicalSteps.length
        if (currentAnimationStep < maxSteps) {
          animateTopologicalStep(currentAnimationStep)
          setCurrentAnimationStep(prev => prev + 1)
        }
      } else if (mode === 'dfs' && currentAnimationStep < dfsDetailedSteps.length) {
        animateDfsStep(currentAnimationStep)
        setCurrentAnimationStep(prev => prev + 1)
      } else if (mode === 'bfs' && currentAnimationStep < bfsDetailedSteps.length) {
        animateBfsStep(currentAnimationStep)
        setCurrentAnimationStep(prev => prev + 1)
      }
    }
  }, [currentStep, animationState, currentAnimationStep, mode, topologicalSteps, topologicalDetailedSteps, dfsDetailedSteps, bfsDetailedSteps, animateTopologicalStep, animateDfsStep, animateBfsStep, onDataStructureUpdate])

  // Reset visualization - only called explicitly, not in useEffect
  const handleReset = useCallback(() => {
    const styledNodes = createStyledNodes(nodes)
    setDisplayNodes(styledNodes)
    setDisplayEdges(edges)
    setCurrentAnimationStep(0)
    setVisitedNodes(new Set())
    const visitedMap = initializeVisitedMap()
    if (mode === 'dfs') {
      onDataStructureUpdate?.(visitedMap, undefined, [])
    } else if (mode === 'topological') {
      const initialQueue = topologicalDetailedSteps.length > 0 ? topologicalDetailedSteps[0].queue : []
      onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
    } else if (mode === 'bfs') {
      const initialQueue = bfsDetailedSteps.length > 0 ? bfsDetailedSteps[0].queue : []
      onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
    } else {
      onDataStructureUpdate?.(visitedMap, undefined, undefined)
    }
  }, [nodes, edges, mode, initializeVisitedMap, onDataStructureUpdate, createStyledNodes, topologicalDetailedSteps, bfsDetailedSteps])

  // Reset when animation state changes to idle, but only if it was previously running/paused
  // Skip on initial mount to avoid conflicts with the initialization useEffect
  const prevAnimationStateRef = useRef<AnimationState>(animationState)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (prevAnimationStateRef.current !== 'idle' && animationState === 'idle') {
      handleReset()
    }
    prevAnimationStateRef.current = animationState
  }, [animationState, handleReset])

  const nodeTypes = {}
  const edgeTypes = {}

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setDisplayNodes((nds) => {
      return nds.map((node) => {
        const change = changes.find((c) => 'id' in c && c.id === node.id)
        if (!change || !('id' in change)) return node
        if (change.type === 'position' && 'position' in change && change.position) {
          return { ...node, position: change.position }
        }
        if (change.type === 'dimensions' && 'dimensions' in change && change.dimensions) {
          return { ...node, width: change.dimensions.width, height: change.dimensions.height }
        }
        return node
      })
    })
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    // Handle edge changes if needed
  }, [])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: params.source,
        target: params.target,
        type: 'smoothstep',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed },
      }
      const updatedEdges = [...displayEdges, newEdge]
      setDisplayEdges(updatedEdges)
      onGraphUpdate(displayNodes, updatedEdges)
    },
    [displayEdges, displayNodes, onGraphUpdate]
  )

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-slate-700/30 shadow-inner">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-slate-900/20"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1.5}
          color={theme === 'dark' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(71, 85, 105, 0.2)'}
        />
        <Controls 
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '0.75rem',
          }}
        />
        <MiniMap
          nodeColor={theme === 'dark' ? '#8b5cf6' : '#6366f1'}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '0.75rem',
          }}
        />
      </ReactFlow>
    </div>
  )
}

