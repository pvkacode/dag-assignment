'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import { getAdjacencyList, getAdjacencyMatrix } from '@/lib/dagUtils'

interface DataStructuresPanelProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  visited: Map<string, number>
  queue?: string[]
  stack?: string[]
  currentNode?: string
  mode: 'topological' | 'dfs' | 'bfs'
  theme: 'light' | 'dark'
}

export default function DataStructuresPanel({
  nodes,
  edges,
  visited,
  queue,
  stack,
  currentNode,
  mode,
  theme,
}: DataStructuresPanelProps) {
  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.id.localeCompare(b.id)), [nodes])
  const adjList = useMemo(() => getAdjacencyList(nodes, edges), [nodes, edges])
  const adjMatrixMap = useMemo(() => getAdjacencyMatrix(nodes, edges), [nodes, edges])
  
  // Convert adjacency matrix Map to 2D array for display
  const adjMatrixArray: number[][] = useMemo(() => {
    const matrix: number[][] = sortedNodes.map(() => 
      new Array(sortedNodes.length).fill(0)
    )
    sortedNodes.forEach((rowNode, rowIdx) => {
      sortedNodes.forEach((colNode, colIdx) => {
        const key = `${rowNode.id}-${colNode.id}`
        matrix[rowIdx][colIdx] = adjMatrixMap.get(key) || 0
      })
    })
    return matrix
  }, [sortedNodes, adjMatrixMap])

  return (
    <div className="mt-6 space-y-6">
      {/* Visited Array */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-lg shadow-soft"
      >
        <h3 className="text-base font-bold mb-4 text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
          Visited Array
          <span className="ml-auto text-xs font-normal text-slate-400">
            (0 = unvisited, 1 = visited)
          </span>
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {sortedNodes.map((node) => {
            const isVisited = visited.get(node.id) === 1
            const isCurrent = currentNode === node.id
            return (
              <motion.div
                key={node.id}
                initial={false}
                animate={{
                  scale: isCurrent ? [1, 1.15, 1] : 1,
                  backgroundColor: isVisited 
                    ? 'rgba(34, 197, 94, 0.25)' 
                    : 'rgba(51, 65, 85, 0.4)',
                }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={`p-3 rounded-xl text-center border-2 transition-all duration-300 ${
                  isVisited
                    ? 'border-green-400/60 text-green-300 shadow-glow-blue'
                    : 'border-slate-600/50 text-slate-400'
                } ${
                  isCurrent ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-800 shadow-glow' : ''
                }`}
              >
                <div className="text-xs font-semibold mb-1.5 text-slate-300">{node.id}</div>
                <motion.div
                  key={isVisited ? 'visited' : 'unvisited'}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`text-xl font-bold ${isVisited ? 'text-green-400' : 'text-slate-500'}`}
                >
                  {isVisited ? '1' : '0'}
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Queue (for Topological Sort and BFS) */}
      {(mode === 'topological' || mode === 'bfs') && queue !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-lg shadow-soft"
        >
          <h3 className="text-base font-bold mb-4 text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
            Queue {mode === 'topological' ? '(Nodes with in-degree 0)' : '(BFS Traversal)'}
            {queue.length > 0 && (
              <span className="ml-auto text-xs font-normal text-slate-400">
                Size: <span className="text-blue-400 font-bold">{queue.length}</span>
              </span>
            )}
          </h3>
          {queue.length === 0 ? (
            <div className="text-slate-400 text-sm italic text-center py-6 bg-slate-700/20 rounded-xl border border-slate-600/30">
              Queue is empty
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Front
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Back
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap min-h-[60px] p-3 bg-slate-900/30 rounded-xl border border-slate-700/30">
                {queue.map((nodeId, index) => {
                  const isFront = index === 0
                  const isCurrent = currentNode === nodeId
                  return (
                    <motion.div
                      key={`${nodeId}-${index}`}
                      initial={{ scale: 0, opacity: 0, x: -20 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      exit={{ scale: 0, opacity: 0, x: 20 }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.23, 1, 0.32, 1],
                        delay: index * 0.05 
                      }}
                      className={`px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-2 ${
                        isFront ? 'border-blue-400/60' : 'border-blue-400/40'
                      } text-blue-200 font-bold shadow-glow-blue transform hover:scale-105 transition-transform ${
                        isCurrent ? 'ring-2 ring-cyan-400/70' : ''
                      }`}
                    >
                      {nodeId}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Stack (for DFS) */}
      {mode === 'dfs' && stack !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-lg shadow-soft"
        >
          <h3 className="text-base font-bold mb-4 text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Stack
            {stack.length > 0 && (
              <span className="ml-auto text-xs font-normal text-slate-400">
                Size: <span className="text-cyan-400 font-bold">{stack.length}</span>
              </span>
            )}
          </h3>
          {stack.length === 0 ? (
            <div className="text-slate-400 text-sm italic text-center py-6 bg-slate-700/20 rounded-xl border border-slate-600/30">
              Stack is empty
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Top
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Bottom
                </span>
              </div>
              <div className="flex flex-col-reverse gap-2 min-h-[120px] p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
                {stack.map((nodeId, index) => {
                  const isTop = index === stack.length - 1
                  const isCurrent = currentNode === nodeId
                  return (
                    <motion.div
                      key={`${nodeId}-${index}`}
                      initial={{ x: -30, opacity: 0, scale: 0.9 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.23, 1, 0.32, 1],
                        delay: (stack.length - 1 - index) * 0.05 
                      }}
                      className={`px-4 py-3 rounded-xl border-2 font-bold shadow-soft transition-all ${
                        isTop
                          ? 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 border-cyan-400/70 text-cyan-100 ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-slate-900 shadow-glow-blue'
                          : 'bg-slate-700/60 border-slate-600/50 text-slate-300'
                      } ${
                        isCurrent ? 'ring-2 ring-cyan-400/80' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{nodeId}</span>
                        {isTop && (
                          <span className="text-xs bg-cyan-500/30 px-2 py-1 rounded-md">Top</span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Adjacency List and Matrix Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adjacency List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-lg shadow-soft"
        >
          <h3 className="text-base font-bold mb-4 text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
            Adjacency List
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {sortedNodes.map((node) => {
              const neighbors = adjList.get(node.id) || []
              const isCurrent = currentNode === node.id
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? 'bg-violet-500/20 border-violet-400/60 ring-2 ring-violet-400/40'
                      : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                  }`}
                >
                  <span className="text-purple-400 font-bold text-sm">{node.id}:</span>
                  <span className="ml-2 text-slate-200 text-sm font-mono">
                    {neighbors.length > 0 ? `[${neighbors.join(', ')}]` : '[]'}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Adjacency Matrix */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-lg shadow-soft"
        >
          <h3 className="text-base font-bold mb-4 text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400"></span>
            Adjacency Matrix
          </h3>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header row */}
              <div className="flex border-b-2 border-slate-700/50 sticky top-0 bg-slate-800/80 backdrop-blur-sm">
                <div className="w-14 p-2.5 text-xs font-bold text-slate-400 border-r-2 border-slate-700/50 flex items-center justify-center">
                  →
                </div>
                {sortedNodes.map((node) => (
                  <div
                    key={node.id}
                    className="w-12 p-2.5 text-xs font-bold text-purple-400 text-center border-r border-slate-700/50 last:border-r-0 bg-slate-900/50"
                  >
                    {node.id}
                  </div>
                ))}
              </div>
              {/* Data rows */}
              {sortedNodes.map((rowNode, rowIdx) => {
                const isCurrentRow = currentNode === rowNode.id
                return (
                  <motion.div
                    key={rowNode.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: rowIdx * 0.02 }}
                    className={`flex border-b border-slate-700/30 last:border-b-0 transition-colors ${
                      isCurrentRow ? 'bg-violet-500/10' : ''
                    }`}
                  >
                    <div className={`w-14 p-2.5 text-xs font-bold border-r-2 border-slate-700/50 flex items-center justify-center ${
                      isCurrentRow ? 'text-violet-400' : 'text-purple-400'
                    }`}>
                      {rowNode.id}
                    </div>
                    {sortedNodes.map((colNode, colIdx) => {
                      const hasEdge = adjMatrixArray[rowIdx]?.[colIdx] === 1
                      const isCurrentCol = currentNode === colNode.id
                      const isActive = (isCurrentRow || isCurrentCol) && hasEdge
                      return (
                        <motion.div
                          key={`${rowNode.id}-${colNode.id}`}
                          initial={false}
                          animate={{
                            scale: isActive ? [1, 1.1, 1] : 1,
                          }}
                          transition={{ duration: 0.3 }}
                          className={`w-12 p-2.5 text-center border-r border-slate-700/30 last:border-r-0 text-sm font-bold transition-all ${
                            hasEdge
                              ? 'bg-gradient-to-br from-purple-500/30 to-violet-500/30 text-purple-200 border-purple-400/30'
                              : 'bg-slate-700/20 text-slate-500'
                          } ${
                            isActive ? 'ring-2 ring-purple-400/60 shadow-glow' : ''
                          }`}
                        >
                          {hasEdge ? '1' : '0'}
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
