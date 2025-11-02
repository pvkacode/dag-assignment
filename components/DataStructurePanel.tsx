'use client'

import { motion } from 'framer-motion'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import { getAdjacencyListRepr, getAdjacencyMatrix } from '@/lib/dagUtils'

interface DataStructurePanelProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  visited?: Map<string, number>
  queue?: string[]
  stack?: string[]
  currentNode?: string
  mode: 'topological' | 'dfs' | 'bfs'
  theme: 'light' | 'dark'
}

export default function DataStructurePanel({
  nodes,
  edges,
  visited,
  queue,
  stack,
  currentNode,
  mode,
  theme,
}: DataStructurePanelProps) {
  // Get adjacency list and matrix
  const adjList = getAdjacencyListRepr(nodes, edges)
  const adjMatrixMap = getAdjacencyMatrix(nodes, edges)
  const sortedNodeIds = nodes.map(n => n.id).sort()

  // Convert adjacency matrix Map to 2D array for display
  const adjMatrix: number[][] = sortedNodeIds.map(() => 
    new Array<number>(sortedNodeIds.length).fill(0)
  )
  sortedNodeIds.forEach((rowNodeId, rowIdx) => {
    sortedNodeIds.forEach((colNodeId, colIdx) => {
      const key = `${rowNodeId}-${colNodeId}`
      const value = adjMatrixMap.get(key)
      adjMatrix[rowIdx]![colIdx] = value !== undefined ? value : 0
    })
  })

  // Initialize visited array if not provided
  const visitedArray = visited || new Map(nodes.map(n => [n.id, 0]))

  return (
    <div className="mt-8 space-y-6">
      {/* Visited Array */}
      <div className="p-5 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
        <h3 className="text-sm font-semibold mb-4 text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          Visited Array
        </h3>
        <div className="flex flex-wrap gap-2">
          {sortedNodeIds.map((nodeId) => {
            const isVisited = visitedArray.get(nodeId) === 1
            const isCurrent = currentNode === nodeId
            return (
              <motion.div
                key={nodeId}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`px-3 py-2 rounded-lg font-mono text-sm font-semibold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-glow scale-110'
                    : isVisited
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                }`}
              >
                <div className="text-xs opacity-70 mb-0.5">{nodeId}</div>
                <div className="text-base">{isVisited ? '1' : '0'}</div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Queue (for BFS) */}
      {mode === 'bfs' && queue !== undefined && (
        <div className="p-5 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
          <h3 className="text-sm font-semibold mb-4 text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Queue {queue.length > 0 && <span className="text-xs text-slate-400">(Front → Back)</span>}
          </h3>
          {queue.length === 0 ? (
            <div className="text-slate-500 text-sm italic">Queue is empty</div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold">Front</span>
              {queue.map((nodeId, index) => (
                <motion.div
                  key={`${nodeId}-${index}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-mono font-semibold shadow-soft"
                >
                  {nodeId}
                </motion.div>
              ))}
              <span className="text-xs text-slate-400 font-semibold">Back</span>
            </div>
          )}
        </div>
      )}

      {/* Stack (for DFS) */}
      {mode === 'dfs' && stack !== undefined && (
        <div className="p-5 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
          <h3 className="text-sm font-semibold mb-4 text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            Stack {stack.length > 0 && <span className="text-xs text-slate-400">(Top → Bottom)</span>}
          </h3>
          {stack.length === 0 ? (
            <div className="text-slate-500 text-sm italic">Stack is empty</div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              {stack.map((nodeId, index) => {
                const isTop = index === stack.length - 1
                return (
                  <motion.div
                    key={`${nodeId}-${index}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`px-4 py-2 rounded-lg font-mono font-semibold transition-all duration-300 ${
                      isTop
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-glow scale-105'
                        : 'bg-violet-500/30 text-violet-200 border border-violet-400/50'
                    }`}
                  >
                    {nodeId} {isTop && <span className="text-xs opacity-70 ml-2">← Top</span>}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Adjacency List */}
      <div className="p-5 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
        <h3 className="text-sm font-semibold mb-4 text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Adjacency List
        </h3>
        <div className="space-y-2 font-mono text-sm max-h-64 overflow-y-auto">
          {sortedNodeIds.map((nodeId) => {
            const neighbors = adjList.get(nodeId) || []
            const isCurrent = currentNode === nodeId
            return (
              <div
                key={nodeId}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isCurrent
                    ? 'bg-purple-500/20 border border-purple-400/50'
                    : 'bg-slate-700/30 border border-slate-600/30'
                }`}
              >
                <span className={`font-semibold ${isCurrent ? 'text-purple-300' : 'text-slate-300'}`}>
                  {nodeId}:
                </span>
                {neighbors.length === 0 ? (
                  <span className="text-slate-500 ml-2">[]</span>
                ) : (
                  <span className="text-slate-400 ml-2">
                    [{neighbors.join(', ')}]
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Adjacency Matrix */}
      <div className="p-5 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
        <h3 className="text-sm font-semibold mb-4 text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Adjacency Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="font-mono text-xs">
            <thead>
              <tr>
                <th className="p-2 text-slate-400 font-semibold"></th>
                {sortedNodeIds.map((id) => (
                  <th
                    key={id}
                    className={`p-2 font-semibold min-w-[2rem] ${
                      currentNode === id ? 'text-purple-300' : 'text-slate-400'
                    }`}
                  >
                    {id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedNodeIds.map((rowId, rowIdx) => {
                const isCurrentRow = currentNode === rowId
                return (
                  <tr key={rowId}>
                    <td
                      className={`p-2 font-semibold text-right ${
                        isCurrentRow ? 'text-purple-300' : 'text-slate-400'
                      }`}
                    >
                      {rowId}
                    </td>
                    {(adjMatrix[rowIdx] as number[]).map((value, colIdx) => {
                      const isCurrentCol = currentNode === sortedNodeIds[colIdx]
                      const hasEdge = value === 1
                      return (
                        <td
                          key={colIdx}
                          className={`p-2 text-center border border-slate-600/30 transition-all duration-200 ${
                            hasEdge
                              ? 'bg-purple-500/30 text-purple-200 font-semibold'
                              : 'bg-slate-700/20 text-slate-500'
                          } ${
                            (isCurrentRow || isCurrentCol) && hasEdge
                              ? 'ring-2 ring-purple-400/50'
                              : ''
                          }`}
                        >
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

