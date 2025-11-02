'use client'

import DagVisualizer from '@/components/DagVisualizer'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <ThemeProvider>
      <main className="min-h-screen">
        <DagVisualizer />
      </main>
    </ThemeProvider>
  )
}

