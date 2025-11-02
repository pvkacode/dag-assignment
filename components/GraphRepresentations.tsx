'use client'

import { motion } from 'framer-motion'
import type { GraphNode, GraphEdge } from '@/lib/dagUtils'
import { getAdjacencyListRepr, getAdjacencyMatrix } from '@/lib/dagUtils'

interface GraphRepresentationsProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  theme: 'light' | 'dark'
}

export default function GraphRepresentations({
  nodes,
  edges,
  theme,
}: GraphRepresentationsProps) {
  const adjList = getAdjacencyListRepr(nodes, edges)
  const adjMatrix = getAdjacencyMatrix(nodes, edges)
  const sortedNodeIds = [...nodes.map(n => n.id)].sort()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Adjacency List */}
      <div className="rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-5 shadow-soft">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Adjacency List</h3>
        <div className="space-y-2 font-mono text-sm">
          {sortedNodeIds.map((nodeId, idx) => {
            const neighbors = adjList.get(nodeId) || []
            return (
              <motion.div
                key={nodeId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-2"
              >
                <span className="text-purple-400 font-semibold min-w-[40px]">{nodeId}:</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {neighbors.length > 0 ? (
                    neighbors.map((neighbor, nIdx) => (
                      <span
                        key={neighbor}
                        className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 border border-slate-600/50"
                      >
                        {neighbor}
                        {nIdx < neighbors.length - 1 && ','}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">∅</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Adjacency Matrix */}
      <div className="rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-5 shadow-soft overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Adjacency Matrix</h3>
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div className="flex gap-1 mb-1">
            <div className="w-10 h-8"></div>
            {sortedNodeIds.map((nodeId) => (
              <div
                key={nodeId}
                className="w-10 h-8 flex items-center justify-center text-purple-400 font-semibold text-xs"
              >
                {nodeId}
              </div>
            ))}
          </div>
          
          {/* Matrix Rows */}
          {sortedNodeIds.map((rowNode, rowIdx) => (
            <motion.div
              key={rowNode}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIdx * 0.05 }}
              className="flex gap-1 mb-1"
            >
              <div className="w-10 h-10 flex items-center justify-center text-purple-400 font-semibold text-xs">
                {rowNode}
              </div>
              {adjMatrix[rowIdx].map((value, colIdx) => (
                <div
                  key={colIdx}
                  className={`w-10 h-10 flex items-center justify-center rounded font-mono font-semibold transition-all duration-200 ${
                    value === 1
                      ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-glow'
                      : 'bg-slate-700/30 text-slate-500 border border-slate-600/30'
                  }`}
                >
                  {value}
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

