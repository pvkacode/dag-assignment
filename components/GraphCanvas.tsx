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
  applyNodeChanges,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import type { AnimationMode, AnimationState } from './DagVisualizer'
import { topologicalSortSteps, topologicalSortStepsDetailed, dfsStepsDetailed, bfsStepsDetailed, calculateInDegrees, type DFSStep, type BFSStep } from '@/lib/dagUtils'

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
  onAnimationStepChange?: (step: number) => void
  dfsStartNode?: string
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
  onAnimationStepChange,
  dfsStartNode,
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
  const [displayEdges, setDisplayEdges] = useState<GraphEdge[]>(() => {
    return edges.map(edge => ({
      ...edge,
      markerEnd: edge.markerEnd || { type: MarkerType.ArrowClosed },
    }))
  })
  // Track if we're updating from props to avoid infinite loops
  const isUpdatingFromPropsRef = useRef(false)
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
  // Track pending animation step updates to avoid setState during render
  const pendingStepUpdateRef = useRef<number | null>(null)
  
  // Use refs to store step arrays to prevent dependency issues
  const topologicalDetailedStepsRef = useRef<Array<{ 
    removedNode: string
    queue: string[]
    visited: Map<string, number>
  }>>([])
  const topologicalStepsRef = useRef<Array<{ removedNode: string; remainingNodes: string[] }>>([])
  
  // Update refs when steps change
  useEffect(() => {
    topologicalDetailedStepsRef.current = topologicalDetailedSteps
    topologicalStepsRef.current = topologicalSteps
  }, [topologicalDetailedSteps, topologicalSteps])
  
  // Initialize visited map for all nodes
  const initializeVisitedMap = useCallback(() => {
    const visitedMap = new Map<string, number>()
    nodes.forEach(node => visitedMap.set(node.id, 0))
    return visitedMap
  }, [nodes])

  // Animate topological sort step
  const animateTopologicalStep = useCallback((stepIndex: number) => {
    // Get the current step arrays from refs to avoid dependency issues
    const currentDetailedSteps = topologicalDetailedStepsRef.current
    const currentSimpleSteps = topologicalStepsRef.current
    
    // Always use detailed steps if available, fallback to simple steps
    const detailedStep = currentDetailedSteps[stepIndex]
    const simpleStep = currentSimpleSteps[stepIndex]
    const step = detailedStep || simpleStep
    if (!step) {
      return
    }

    const removedNode = detailedStep ? detailedStep.removedNode : (simpleStep ? simpleStep.removedNode : '')
    if (!removedNode) {
      return
    }

    // Update all nodes based on visited state - preserve all node properties including position
    setDisplayNodes((currentNodes) => {
      return currentNodes.map(node => {
        const isRemoved = node.id === removedNode
        const isVisited = detailedStep 
          ? detailedStep.visited.get(node.id) === 1 
          : (simpleStep && !simpleStep.remainingNodes.includes(node.id))
        
        // Preserve all existing node properties (position, id, data, etc.)
        const baseStyle = {
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff',
          transition: 'all 0.3s ease',
        }
        
        let newStyle
        if (isRemoved) {
          // Currently being removed - red highlight
          newStyle = {
            ...baseStyle,
            background: '#f87171',
            border: '3px solid #dc2626',
            boxShadow: '0 0 20px rgba(248, 113, 113, 0.6)',
          }
        } else if (isVisited) {
          // Already removed - faded gray
          newStyle = {
            ...baseStyle,
            background: '#94a3b8',
            border: '2px solid #64748b',
            opacity: 0.3,
          }
        } else {
          // Not yet removed - default style
          newStyle = {
            ...baseStyle,
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
            opacity: 1,
          }
        }
        
        // Return node with updated style, preserving all other properties
        return {
          ...node,
          position: node.position, // Explicitly preserve position
          style: newStyle,
        }
      })
    })
    
    // Update data structures - always use detailed steps if available
    if (currentDetailedSteps[stepIndex]) {
      const detailedStep = currentDetailedSteps[stepIndex]
      // Use the visited map and queue from the step
      onDataStructureUpdate?.(detailedStep.visited, detailedStep.queue, undefined, removedNode)
    } else if (simpleStep && 'remainingNodes' in simpleStep) {
      // Fallback: create visited map from remaining nodes
      // We'll use the nodes prop via closure, but it's okay since this is just fallback
      // The primary path uses detailed steps which don't need nodes/edges
      const visitedMap = new Map<string, number>()
      // Use a simple approach: mark removed and non-remaining as visited
      if (simpleStep && 'remainingNodes' in simpleStep) {
        // We can't easily access nodes here without adding to dependencies
        // But this is fallback code, detailed steps should always be available
        onDataStructureUpdate?.(visitedMap, [], undefined, removedNode)
      }
    }
  }, [onDataStructureUpdate])

  // Animate DFS step with detailed data structures
  const animateDfsStep = useCallback((stepIndex: number) => {
    const step = dfsDetailedSteps[stepIndex]
    if (!step) return

    // Update visited nodes set
    const updatedVisited = new Set<string>()
    step.visited.forEach((value, nodeId) => {
      if (value === 1) {
        updatedVisited.add(nodeId)
      }
    })
    setVisitedNodes(updatedVisited)
    
    // Update display nodes - highlight current node distinctly, visited nodes differently
    // Preserve all node properties (position, width, height, etc.)
    setDisplayNodes((currentNodes) => {
      return currentNodes.map(node => {
        const isCurrent = node.id === step.currentNode
        const isVisited = step.visited.get(node.id) === 1
        
        // Preserve all existing node properties
        const baseStyle = {
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff',
          transition: 'all 0.3s ease',
        }
        
        let newStyle
        if (isCurrent) {
          // Current node being processed - bright blue highlight
          newStyle = {
            ...baseStyle,
            background: '#3b82f6',
            border: '3px solid #1d4ed8',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
          }
        } else if (isVisited) {
          // Previously visited nodes - lighter blue
          newStyle = {
            ...baseStyle,
            background: '#60a5fa',
            border: '2px solid #3b82f6',
            opacity: 0.85,
          }
        } else {
          // Unvisited nodes - default style
          newStyle = {
            ...baseStyle,
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
            opacity: 1,
          }
        }
        
        // Return node with updated style, preserving all other properties including position
        return {
          ...node,
          position: node.position, // Explicitly preserve position
          style: newStyle,
        }
      })
    })
    
    // Update data structures (visited array, stack)
    onDataStructureUpdate?.(step.visited, undefined, step.stack, step.currentNode)
  }, [dfsDetailedSteps, onDataStructureUpdate])

  // Animate BFS step with detailed data structures
  const animateBfsStep = useCallback((stepIndex: number) => {
    const step = bfsDetailedSteps[stepIndex]
    if (!step) return

    // Update visited nodes set
    const updatedVisited = new Set<string>()
    step.visited.forEach((value, nodeId) => {
      if (value === 1) {
        updatedVisited.add(nodeId)
      }
    })
    setVisitedNodes(updatedVisited)
    
    // Update display nodes - preserve all properties including position
    setDisplayNodes((currentNodes) => {
      return currentNodes.map(node => {
        const isCurrent = node.id === step.currentNode
        const isVisited = step.visited.get(node.id) === 1
        
        const baseStyle = {
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff',
          transition: 'all 0.3s ease',
        }
        
        let newStyle
        if (isCurrent) {
          newStyle = {
            ...baseStyle,
            background: '#10b981',
            border: '3px solid #059669',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
          }
        } else if (isVisited) {
          newStyle = {
            ...baseStyle,
            background: '#34d399',
            border: '2px solid #10b981',
            opacity: 0.85,
          }
        } else {
          newStyle = {
            ...baseStyle,
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
            opacity: 1,
          }
        }
        
        return {
          ...node,
          position: node.position,
          style: newStyle,
        }
      })
    })
    
    // Update data structures (visited array, queue)
    onDataStructureUpdate?.(step.visited, step.queue, undefined, step.currentNode)
  }, [bfsDetailedSteps, onDataStructureUpdate])


  // Helper function to create styled nodes - preserves positions from displayNodes if available
  const createStyledNodes = useCallback((nodeList: GraphNode[], preservePositions?: GraphNode[]) => {
    return nodeList.map(node => {
      // If we have existing display nodes, preserve their positions
      const existingNode = preservePositions?.find(n => n.id === node.id)
      const position = existingNode?.position || node.position
      
      return {
        ...node,
        position,
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
          opacity: 1,
          transition: 'all 0.3s ease',
          ...node.style,
        },
      }
    })
  }, [])

  // Helper function to ensure all edges have arrows with bigger size
  const ensureEdgesHaveArrows = useCallback((edgeList: GraphEdge[]): GraphEdge[] => {
    return edgeList.map(edge => ({
      ...edge,
      markerEnd: edge.markerEnd || { 
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#8b5cf6',
      },
      style: {
        strokeWidth: 3,
        stroke: '#8b5cf6',
        ...edge.style,
      },
    }))
  }, [])

  // Recalculate steps when graph changes or mode changes
  useEffect(() => {
    const visitedMap = initializeVisitedMap()
    isUpdatingFromPropsRef.current = true
    
    // When nodes/edges/mode change, preserve positions from displayNodes if available
    setDisplayNodes((currentDisplayNodes) => {
      return createStyledNodes(nodes, currentDisplayNodes)
    })
    
    if (mode === 'topological') {
      const simpleSteps = topologicalSortSteps(nodes, edges)
      const detailedSteps = topologicalSortStepsDetailed(nodes, edges)
      // Generated topological sort steps
      setTopologicalSteps(simpleSteps)
      setTopologicalDetailedSteps(detailedSteps)
      // Only reset animation step if animation is not running
      if (animationState !== 'running') {
        setCurrentAnimationStep(0)
        pendingStepUpdateRef.current = 0
      }
      setDisplayEdges(ensureEdgesHaveArrows(edges))
      setVisitedNodes(new Set())
      // Initialize with initial queue (nodes with in-degree 0 before any removal)
      const initialQueue = detailedSteps.length > 0 ? detailedSteps[0].queue : []
      onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
    } else if (mode === 'dfs') {
      // Use the selected start node, or fallback to first node if not set
      const startNode = dfsStartNode || nodes[0]?.id
      const detailedSteps = dfsStepsDetailed(nodes, edges, startNode)
      setDfsDetailedSteps(detailedSteps)
      setCurrentAnimationStep(0)
      pendingStepUpdateRef.current = 0
      setDisplayEdges(ensureEdgesHaveArrows(edges))
      setVisitedNodes(new Set())
      onDataStructureUpdate?.(visitedMap, undefined, [])
    } else if (mode === 'bfs') {
      const detailedSteps = bfsStepsDetailed(nodes, edges)
      setBfsDetailedSteps(detailedSteps)
      setCurrentAnimationStep(0)
      pendingStepUpdateRef.current = 0
      setDisplayEdges(ensureEdgesHaveArrows(edges))
      setVisitedNodes(new Set())
      // Initialize with first step's queue if available
      const initialQueue = detailedSteps.length > 0 ? detailedSteps[0].queue : []
      onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
    }
    
    // Reset flag after a tick
    setTimeout(() => {
      isUpdatingFromPropsRef.current = false
    }, 0)
  }, [nodes, edges, mode, animationState, dfsStartNode, initializeVisitedMap, onDataStructureUpdate, createStyledNodes, ensureEdgesHaveArrows])

  // Handle animation steps
  useEffect(() => {
    if (animationState !== 'running') return

    // Invert speed: higher speed value = faster animation (shorter delay)
    // Speed ranges from 10-90, we want: 10 = slow (900ms), 90 = fast (100ms)
    const delay = (90 - speed + 10) * 10

    const timeoutId = setTimeout(() => {
      if (mode === 'topological') {
        // Use refs to get current steps without causing dependency issues
        const currentDetailedSteps = topologicalDetailedStepsRef.current
        const currentSimpleSteps = topologicalStepsRef.current
        const maxSteps = currentDetailedSteps.length || currentSimpleSteps.length
        
        if (maxSteps === 0) {
          return // No steps to animate
        }
        
        if (currentAnimationStep < maxSteps) {
          // Animate the current step
          animateTopologicalStep(currentAnimationStep)
          // CRITICAL: Advance to next step - this will trigger the useEffect again
          // The useEffect depends on currentAnimationStep, so changing it will re-run the effect
          const next = currentAnimationStep + 1
          setCurrentAnimationStep(next)
          // Defer parent update to avoid setState during render
          pendingStepUpdateRef.current = next
        } else {
          // Animation complete - reset for loop - preserve positions
          setCurrentAnimationStep(0)
          pendingStepUpdateRef.current = 0
          setDisplayNodes((currentDisplayNodes) => createStyledNodes(nodes, currentDisplayNodes))
          setDisplayEdges(ensureEdgesHaveArrows(edges))
          setVisitedNodes(new Set())
          const visitedMap = initializeVisitedMap()
          const initialQueue = currentDetailedSteps.length > 0 ? currentDetailedSteps[0].queue : []
          onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
        }
      } else if (mode === 'dfs') {
        if (dfsDetailedSteps.length === 0) return // No steps to animate
        
        if (currentAnimationStep < dfsDetailedSteps.length) {
          animateDfsStep(currentAnimationStep)
          const next = currentAnimationStep + 1
          setCurrentAnimationStep(next)
          pendingStepUpdateRef.current = next
        } else {
          // Reset for loop - preserve positions
          setCurrentAnimationStep(0)
          pendingStepUpdateRef.current = 0
          setDisplayNodes((currentDisplayNodes) => createStyledNodes(nodes, currentDisplayNodes))
          setDisplayEdges(ensureEdgesHaveArrows(edges))
          setVisitedNodes(new Set())
          const visitedMap = initializeVisitedMap()
          onDataStructureUpdate?.(visitedMap, undefined, [])
        }
      } else if (mode === 'bfs') {
        if (bfsDetailedSteps.length === 0) return // No steps to animate
        
        if (currentAnimationStep < bfsDetailedSteps.length) {
          animateBfsStep(currentAnimationStep)
          const next = currentAnimationStep + 1
          setCurrentAnimationStep(next)
          pendingStepUpdateRef.current = next
        } else {
          // Reset for loop - preserve positions
          setCurrentAnimationStep(0)
          pendingStepUpdateRef.current = 0
          setDisplayNodes((currentDisplayNodes) => createStyledNodes(nodes, currentDisplayNodes))
          setDisplayEdges(ensureEdgesHaveArrows(edges))
          setVisitedNodes(new Set())
          const visitedMap = initializeVisitedMap()
          const initialQueue = bfsDetailedSteps.length > 0 ? bfsDetailedSteps[0].queue : []
          onDataStructureUpdate?.(visitedMap, initialQueue, undefined)
        }
      }
    }, delay)

    return () => clearTimeout(timeoutId)
    // Only depend on animation state and step counter - this ensures the loop continues
  }, [animationState, currentAnimationStep, speed, mode, animateTopologicalStep, animateDfsStep, animateBfsStep, initializeVisitedMap, onDataStructureUpdate, createStyledNodes, ensureEdgesHaveArrows])
  
  // Defer parent updates to avoid setState during render
  useEffect(() => {
    if (pendingStepUpdateRef.current !== null) {
      const step = pendingStepUpdateRef.current
      pendingStepUpdateRef.current = null
      // Use setTimeout to defer to next tick
      setTimeout(() => {
        onAnimationStepChange?.(step)
      }, 0)
    }
  }, [currentAnimationStep, onAnimationStepChange])

  // Handle manual step forward
  useEffect(() => {
    if (animationState === 'idle' && currentStep > currentAnimationStep) {
      if (mode === 'topological') {
        const maxSteps = topologicalDetailedSteps.length || topologicalSteps.length
        if (currentAnimationStep < maxSteps) {
          animateTopologicalStep(currentAnimationStep)
          const next = currentAnimationStep + 1
          setCurrentAnimationStep(next)
          pendingStepUpdateRef.current = next
        }
      } else if (mode === 'dfs' && currentAnimationStep < dfsDetailedSteps.length) {
        animateDfsStep(currentAnimationStep)
        const next = currentAnimationStep + 1
        setCurrentAnimationStep(next)
        pendingStepUpdateRef.current = next
      } else if (mode === 'bfs' && currentAnimationStep < bfsDetailedSteps.length) {
        animateBfsStep(currentAnimationStep)
        const next = currentAnimationStep + 1
        setCurrentAnimationStep(next)
        pendingStepUpdateRef.current = next
      }
    }
  }, [currentStep, animationState, currentAnimationStep, mode, topologicalSteps, topologicalDetailedSteps, dfsDetailedSteps, bfsDetailedSteps, animateTopologicalStep, animateDfsStep, animateBfsStep, onDataStructureUpdate, onAnimationStepChange])

  // Reset visualization - only called explicitly, not in useEffect
  const handleReset = useCallback(() => {
    setDisplayNodes((currentDisplayNodes) => {
      const styledNodes = createStyledNodes(nodes, currentDisplayNodes)
      setDisplayEdges(ensureEdgesHaveArrows(edges))
      setCurrentAnimationStep(0)
      pendingStepUpdateRef.current = 0
      setVisitedNodes(new Set())
      return styledNodes
    })
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
  }, [nodes, edges, mode, initializeVisitedMap, onDataStructureUpdate, createStyledNodes, topologicalDetailedSteps, bfsDetailedSteps, ensureEdgesHaveArrows])

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

  // Track pending graph updates to avoid setState during render
  const pendingUpdateRef = useRef<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null)

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Ignore changes if we're updating from props
    if (isUpdatingFromPropsRef.current) {
      return
    }
    
    setDisplayNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds)
      // Only sync to parent if there's a position change (user dragging)
      const hasPositionChange = changes.some(change => change.type === 'position')
      if (hasPositionChange) {
        // Schedule parent update for next render cycle to avoid setState during render
        pendingUpdateRef.current = { nodes: updatedNodes, edges: displayEdges }
      }
      return updatedNodes
    })
  }, [displayEdges])

  // Apply pending graph updates in useEffect to avoid setState during render
  useEffect(() => {
    if (pendingUpdateRef.current && !isUpdatingFromPropsRef.current) {
      const { nodes: updatedNodes, edges: updatedEdges } = pendingUpdateRef.current
      pendingUpdateRef.current = null
      // Use setTimeout to defer to next tick
      setTimeout(() => {
        onGraphUpdate(updatedNodes, updatedEdges)
      }, 0)
    }
  }, [displayNodes, displayEdges, onGraphUpdate])

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
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#8b5cf6',
        },
        style: {
          strokeWidth: 3,
          stroke: '#8b5cf6',
        },
      }
      const updatedEdges = ensureEdgesHaveArrows([...displayEdges, newEdge])
      setDisplayEdges(updatedEdges)
      onGraphUpdate(displayNodes, updatedEdges)
    },
    [displayEdges, displayNodes, onGraphUpdate, ensureEdgesHaveArrows]
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

