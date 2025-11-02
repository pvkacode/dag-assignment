import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DAG Visualizer - Interactive Graph Algorithms',
  description: 'Visualize Directed Acyclic Graphs with Topological Sort and DFS animations',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

