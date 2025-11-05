import { Edge, Node } from 'reactflow'

/**
 * DAG Utilities
 * Contains all graph manipulation and algorithm logic
 */

export interface GraphNode extends Omit<Node, 'data'> {
  id: string
  data: {
    label: string
  }
  inDegree?: number
  visited?: boolean
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type?: string
  animated?: boolean
  [key: string]: any
}

/**
 * Check if a graph contains cycles using DFS
 */
export function hasCycle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  const adjList = buildAdjacencyList(edges)
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = adjList.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }

  return false
}

/**
 * Build adjacency list from edges
 */
export function buildAdjacencyList(edges: GraphEdge[]): Map<string, string[]> {
  const adjList = new Map<string, string[]>()
  
  for (const edge of edges) {
    if (!adjList.has(edge.source)) {
      adjList.set(edge.source, [])
    }
    adjList.get(edge.source)!.push(edge.target)
  }
  
  // Ensure all nodes have an entry (even if no outgoing edges)
  return adjList
}

/**
 * Get adjacency list representation for display
 */
export function getAdjacencyListRepr(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, string[]> {
  const adjList = buildAdjacencyList(edges)
  // Ensure all nodes are represented
  nodes.forEach(node => {
    if (!adjList.has(node.id)) {
      adjList.set(node.id, [])
    }
  })
  return adjList
}

/**
 * Get adjacency matrix representation (returns Map for easier lookup)
 */
export function getAdjacencyMatrix(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, number> {
  const matrix = new Map<string, number>()
  
  // Initialize all entries to 0
  nodes.forEach(node1 => {
    nodes.forEach(node2 => {
      const key = `${node1.id}-${node2.id}`
      matrix.set(key, 0)
    })
  })
  
  // Set edges to 1
  edges.forEach(edge => {
    const key = `${edge.source}-${edge.target}`
    matrix.set(key, 1)
  })
  
  return matrix
}

/**
 * Build reverse adjacency list (for topological sort)
 */
function buildReverseAdjacencyList(edges: GraphEdge[]): Map<string, string[]> {
  const adjList = new Map<string, string[]>()
  
  for (const edge of edges) {
    if (!adjList.has(edge.target)) {
      adjList.set(edge.target, [])
    }
    adjList.get(edge.target)!.push(edge.source)
  }
  
  return adjList
}

/**
 * Calculate in-degrees for all nodes
 */
export function calculateInDegrees(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, number> {
  const inDegrees = new Map<string, number>()
  
  // Initialize all nodes with 0 in-degree
  for (const node of nodes) {
    inDegrees.set(node.id, 0)
  }
  
  // Count incoming edges
  for (const edge of edges) {
    const currentInDegree = inDegrees.get(edge.target) || 0
    inDegrees.set(edge.target, currentInDegree + 1)
  }
  
  return inDegrees
}

/**
 * Generate topological sort sequence with step-by-step removal
 * Returns steps with queue (nodes with in-degree 0) and visited array
 */
export function topologicalSortStepsDetailed(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Array<{ 
  removedNode: string
  queue: string[]
  visited: Map<string, number>
}> {
  const adjList = buildReverseAdjacencyList(edges)
  let inDegrees = calculateInDegrees(nodes, edges)
  const visited = new Map<string, number>()
  const steps: Array<{ 
    removedNode: string
    queue: string[]
    visited: Map<string, number>
  }> = []
  
  // Initialize all nodes as unvisited
  nodes.forEach(node => visited.set(node.id, 0))
  
  const remaining = new Set(nodes.map(n => n.id))
  
  while (remaining.size > 0) {
    // Find all nodes with in-degree 0
    const zeroInDegreeNodes: string[] = []
    for (const nodeId of remaining) {
      if ((inDegrees.get(nodeId) || 0) === 0) {
        zeroInDegreeNodes.push(nodeId)
      }
    }
    
    // If no nodes with in-degree 0, the graph has cycles
    if (zeroInDegreeNodes.length === 0) {
      break
    }
    
    // Remove the first node with in-degree 0
    const removedNode = zeroInDegreeNodes[0]
    remaining.delete(removedNode)
    visited.set(removedNode, 1)
    
    // Update in-degrees of neighbors
    const neighbors = adjList.get(removedNode) || []
    for (const neighbor of neighbors) {
      const currentInDegree = inDegrees.get(neighbor) || 0
      inDegrees.set(neighbor, currentInDegree - 1)
      
      // Check if neighbor now has in-degree 0
      if (currentInDegree === 1 && remaining.has(neighbor)) {
        // This neighbor will be available in the next iteration
      }
    }
    
    // Find queue for next step (nodes that will be in queue after this removal)
    const nextQueue: string[] = []
    for (const nodeId of remaining) {
      if ((inDegrees.get(nodeId) || 0) === 0) {
        nextQueue.push(nodeId)
      }
    }
    
    steps.push({
      removedNode,
      queue: nextQueue,
      visited: new Map(visited),
    })
  }
  
  return steps
}

/**
 * Generate topological sort sequence with step-by-step removal (simple version for compatibility)
 */
export function topologicalSortSteps(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Array<{ removedNode: string; remainingNodes: string[] }> {
  const adjList = buildReverseAdjacencyList(edges)
  let inDegrees = calculateInDegrees(nodes, edges)
  const steps: Array<{ removedNode: string; remainingNodes: string[] }> = []
  
  const remaining = new Set(nodes.map(n => n.id))
  
  while (remaining.size > 0) {
    // Find all nodes with in-degree 0
    const zeroInDegreeNodes: string[] = []
    for (const nodeId of remaining) {
      if ((inDegrees.get(nodeId) || 0) === 0) {
        zeroInDegreeNodes.push(nodeId)
      }
    }
    
    // If no nodes with in-degree 0, the graph has cycles
    if (zeroInDegreeNodes.length === 0) {
      break
    }
    
    // Remove the first node with in-degree 0
    const removedNode = zeroInDegreeNodes[0]
    remaining.delete(removedNode)
    
    // Update in-degrees of neighbors
    const neighbors = adjList.get(removedNode) || []
    for (const neighbor of neighbors) {
      const currentInDegree = inDegrees.get(neighbor) || 0
      inDegrees.set(neighbor, currentInDegree - 1)
    }
    
    steps.push({
      removedNode,
      remainingNodes: Array.from(remaining),
    })
  }
  
  return steps
}

/**
 * Generate DFS traversal steps
 */
export function dfsSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startNodeId?: string
): string[] {
  const adjList = buildAdjacencyList(edges)
  const visited = new Set<string>()
  const traversal: string[] = []
  
  function dfs(nodeId: string) {
    visited.add(nodeId)
    traversal.push(nodeId)
    
    const neighbors = adjList.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor)
      }
    }
  }
  
  // Start from specified node or first node
  const startNode = startNodeId || nodes[0]?.id
  if (startNode) {
    dfs(startNode)
  }
  
  return traversal
}

/**
 * DFS traversal with detailed step-by-step data (stack and visited array)
 */
export interface DFSStep {
  currentNode: string
  stack: string[]
  visited: Map<string, number> // 0 = unvisited, 1 = visited
}

export function dfsStepsDetailed(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startNodeId?: string
): DFSStep[] {
  const adjList = buildAdjacencyList(edges)
  const visited = new Map<string, number>()
  const steps: DFSStep[] = []
  
  // Initialize all nodes as unvisited
  nodes.forEach(node => visited.set(node.id, 0))
  
  function dfs(nodeId: string, stack: string[]): void {
    // Push current node to stack
    const newStack = [...stack, nodeId]
    
    // Create snapshot with node on stack but not yet visited
    steps.push({
      currentNode: nodeId,
      stack: [...newStack],
      visited: new Map(visited),
    })
    
    // Mark as visited
    visited.set(nodeId, 1)
    
    // Create snapshot after visiting
    steps.push({
      currentNode: nodeId,
      stack: [...newStack],
      visited: new Map(visited),
    })
    
    const neighbors = adjList.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (visited.get(neighbor) === 0) {
        dfs(neighbor, newStack)
      }
    }
    
    // Pop from stack (show stack without current node)
    if (newStack.length > 0) {
      newStack.pop()
      steps.push({
        currentNode: nodeId,
        stack: [...newStack],
        visited: new Map(visited),
      })
    }
  }
  
  const startNode = startNodeId || nodes[0]?.id
  if (startNode) {
    dfs(startNode, [])
  }
  
  return steps
}

/**
 * BFS traversal with detailed step-by-step data (queue and visited array)
 */
export interface BFSStep {
  currentNode: string
  queue: string[]
  visited: Map<string, number> // 0 = unvisited, 1 = visited
}

export function bfsStepsDetailed(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startNodeId?: string
): BFSStep[] {
  const adjList = buildAdjacencyList(edges)
  const visited = new Map<string, number>()
  const steps: BFSStep[] = []
  
  // Initialize all nodes as unvisited
  nodes.forEach(node => visited.set(node.id, 0))
  
  const startNode = startNodeId || nodes[0]?.id
  if (!startNode) return steps
  
  const queue: string[] = [startNode]
  visited.set(startNode, 1)
  
  // Initial state with start node in queue
  steps.push({
    currentNode: startNode,
    queue: [...queue],
    visited: new Map(visited),
  })
  
  while (queue.length > 0) {
    // Dequeue
    const currentNode = queue.shift()!
    
    // Create snapshot after dequeueing (before processing neighbors)
    steps.push({
      currentNode,
      queue: [...queue],
      visited: new Map(visited),
    })
    
    const neighbors = adjList.get(currentNode) || []
    for (const neighbor of neighbors) {
      if (visited.get(neighbor) === 0) {
        visited.set(neighbor, 1)
        queue.push(neighbor)
        // Create snapshot after each enqueue
        steps.push({
          currentNode,
          queue: [...queue],
          visited: new Map(visited),
        })
      }
    }
  }
  
  return steps
}

/**
 * Get adjacency list representation
 */
export function getAdjacencyList(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string[]> {
  const adjList = buildAdjacencyList(edges)
  // Ensure all nodes are represented
  nodes.forEach(node => {
    if (!adjList.has(node.id)) {
      adjList.set(node.id, [])
    }
  })
  return adjList
}


/**
 * Generate a random DAG
 */
export function generateRandomDAG(
  numNodes: number,
  numEdges: number
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  
  // Create nodes
  for (let i = 0; i < numNodes; i++) {
    nodes.push({
      id: `node-${i}`,
      type: 'default',
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      data: { label: String.fromCharCode(65 + i) },
    })
  }
  
  // Create edges (ensuring no cycles)
  let edgeCount = 0
  const maxAttempts = numEdges * 10
  
  for (let attempt = 0; attempt < maxAttempts && edgeCount < numEdges; attempt++) {
    const sourceIndex = Math.floor(Math.random() * numNodes)
    const targetIndex = Math.floor(Math.random() * numNodes)
    
    if (sourceIndex < targetIndex) {
      const sourceId = `node-${sourceIndex}`
      const targetId = `node-${targetIndex}`
      
      // Check if edge already exists
      const edgeExists = edges.some(
        e => e.source === sourceId && e.target === targetId
      )
      
      if (!edgeExists) {
        // Check if adding this edge would create a cycle
        const testEdges = [...edges, { id: `e-${edgeCount}`, source: sourceId, target: targetId }]
        
        // If no cycle, add the edge
        if (!hasCycle(nodes, testEdges)) {
          edges.push({
            id: `edge-${edgeCount}`,
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
            animated: false,
            markerEnd: { type: 'arrowclosed' },
          })
          edgeCount++
        }
      }
    }
  }
  
  return { nodes, edges }
}

/**
 * Create sample DAG (for preload)
 */
export function createSampleDAG(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = [
    { id: 'A', type: 'default', position: { x: 100, y: 100 }, data: { label: 'A' } },
    { id: 'B', type: 'default', position: { x: 300, y: 100 }, data: { label: 'B' } },
    { id: 'C', type: 'default', position: { x: 100, y: 300 }, data: { label: 'C' } },
    { id: 'D', type: 'default', position: { x: 300, y: 300 }, data: { label: 'D' } },
    { id: 'E', type: 'default', position: { x: 500, y: 200 }, data: { label: 'E' } },
  ]
  
  const edges = [
    { id: 'e1', source: 'A', target: 'B', type: 'smoothstep', animated: false, markerEnd: { type: 'arrowclosed' } },
    { id: 'e2', source: 'A', target: 'C', type: 'smoothstep', animated: false, markerEnd: { type: 'arrowclosed' } },
    { id: 'e3', source: 'B', target: 'D', type: 'smoothstep', animated: false, markerEnd: { type: 'arrowclosed' } },
    { id: 'e4', source: 'C', target: 'D', type: 'smoothstep', animated: false, markerEnd: { type: 'arrowclosed' } },
    { id: 'e5', source: 'D', target: 'E', type: 'smoothstep', animated: false, markerEnd: { type: 'arrowclosed' } },
  ]
  
  return { nodes, edges }
}

