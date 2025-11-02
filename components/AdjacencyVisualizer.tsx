'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import { getAdjacencyListRepr, getAdjacencyMatrix } from '@/lib/dagUtils'

interface AdjacencyVisualizerProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  theme: 'light' | 'dark'
}

export default function AdjacencyVisualizer({
  nodes,
  edges,
  theme,
}: AdjacencyVisualizerProps) {
  const adjacencyList = useMemo(
    () => getAdjacencyListRepr(nodes, edges),
    [nodes, edges]
  )

  const adjacencyMatrixMap = useMemo(
    () => getAdjacencyMatrix(nodes, edges),
    [nodes, edges]
  )

  const sortedNodeIds = useMemo(
    () => nodes.map(n => n.id).sort(),
    [nodes]
  )

  // Convert adjacency matrix Map to 2D array for display
  const adjacencyMatrix: number[][] = useMemo(() => {
    const matrix: number[][] = sortedNodeIds.map(() => 
      new Array(sortedNodeIds.length).fill(0)
    )
    sortedNodeIds.forEach((rowNodeId, rowIdx) => {
      sortedNodeIds.forEach((colNodeId, colIdx) => {
        const key = `${rowNodeId}-${colNodeId}`
        matrix[rowIdx][colIdx] = adjacencyMatrixMap.get(key) || 0
      })
    })
    return matrix
  }, [sortedNodeIds, adjacencyMatrixMap])

  return (
    <div className="space-y-6">
      {/* Adjacency List */}
      <div className="p-5 rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
          <span className="text-cyan-400">📋</span> Adjacency List
        </h3>
        <div className="space-y-2 font-mono text-sm">
          {Array.from(adjacencyList.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([nodeId, neighbors], idx) => {
              const node = nodes.find(n => n.id === nodeId)
              return (
                <motion.div
                  key={nodeId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/30"
                >
                  <span className="text-purple-400 font-semibold">
                    {node?.data.label || nodeId}:
                  </span>{' '}
                  <span className="text-slate-300">
                    {neighbors.length === 0 ? (
                      <span className="text-slate-500 italic">[]</span>
                    ) : (
                      <span className="text-cyan-300">
                        [{neighbors
                          .map(nId => {
                            const n = nodes.find(n => n.id === nId)
                            return n?.data.label || nId
                          })
                          .join(', ')}]
                      </span>
                    )}
                  </span>
                </motion.div>
              )
            })}
        </div>
      </div>

      {/* Adjacency Matrix */}
      <div className="p-5 rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
          <span className="text-fuchsia-400">🔢</span> Adjacency Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs font-semibold text-slate-400"></th>
                {sortedNodeIds.map((nodeId) => {
                  const node = nodes.find(n => n.id === nodeId)
                  return (
                    <th
                      key={nodeId}
                      className="p-2 text-xs font-semibold text-slate-400 border border-slate-700/30"
                    >
                      {node?.data.label || nodeId}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sortedNodeIds.map((nodeId, rowIdx) => {
                const node = nodes.find(n => n.id === nodeId)
                return (
                  <tr key={nodeId}>
                    <td className="p-2 text-xs font-semibold text-slate-400 border border-slate-700/30">
                      {node?.data.label || nodeId}
                    </td>
                    {adjacencyMatrix[rowIdx].map((value, colIdx) => (
                      <motion.td
                        key={colIdx}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: (rowIdx * sortedNodeIds.length + colIdx) * 0.01 }}
                        className={`p-3 text-center font-bold text-sm border border-slate-700/30 transition-all duration-300 ${
                          value === 1
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-slate-900/40 text-slate-500'
                        }`}
                      >
                        {value}
                      </motion.td>
                    ))}
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

