# DAG Visualizer

An interactive web application for visualizing Directed Acyclic Graphs (DAGs) with topological sort and depth-first search (DFS) animations. Built with Next.js, React, TypeScript, Tailwind CSS, React Flow, and Framer Motion.

![DAG Visualizer](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![React Flow](https://img.shields.io/badge/React_Flow-11.11-f50057?style=for-the-badge)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.23-ff0055?style=for-the-badge&logo=framer)

## Features

### 🎯 Core Functionality
- **Interactive DAG Visualization**: Visualize directed acyclic graphs with an intuitive, drag-and-drop interface
- **Topological Sort Animation**: Watch nodes being removed in order of in-degree 0 with smooth animations
- **DFS Traversal Animation**: Observe depth-first search traversal with step-by-step highlighting
- **Graph Generation**: Create random DAGs or use pre-loaded sample graphs

### 🎨 User Experience
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Real-time Validation**: Verify that your graph is acyclic
- **Speed Control**: Adjust animation speed with an intuitive slider
- **Step Controls**: Play, pause, step forward, and reset animations
- **Progress Tracking**: See current step and overall progress
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🔧 Technical Features
- **Force-Directed Layout**: Automatic graph layout using React Flow
- **Smooth Animations**: Powered by Framer Motion for fluid transitions
- **Type Safety**: Full TypeScript support
- **Modular Architecture**: Clean separation of concerns
- **Cycle Detection**: Built-in cycle detection algorithm

## Installation

### Prerequisites
- Node.js 18+ and npm (or yarn/pnpm)

### Setup Instructions

1. **Clone or download the project**
   ```bash
   cd "dag-visualizer"  # or your project directory
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   Note: If you encounter peer dependency conflicts, you can also try without the flag first.

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Usage

### Basic Workflow

1. **Load a Graph**: Click "Load Sample DAG" to start with a pre-configured graph
2. **Generate Random**: Set the number of nodes and edges, then click "Generate Random"
3. **Select Animation Mode**: Choose between "Topological Sort" or "DFS Traversal"
4. **Control Playback**: Use Play/Pause, Step, and Reset buttons
5. **Adjust Speed**: Use the speed slider to control animation pace
6. **Customize**: Drag nodes to reposition them, or connect new edges by dragging from one node to another

### Graph Controls

- **Load Sample DAG**: Load a pre-configured example graph
- **Generate Random**: Create a random DAG with specified node and edge counts
- **Validate DAG**: Check if your current graph is acyclic

### Animation Modes

#### Topological Sort
- Removes nodes with in-degree 0 iteratively
- Red highlight indicates the node being removed
- Nodes fade out after removal
- Shows the topological ordering of nodes

#### DFS Traversal
- Highlights nodes in depth-first order
- Blue highlight indicates visited nodes
- Shows the DFS traversal sequence

### Tips

- **Repositioning Nodes**: Click and drag nodes to adjust the layout
- **Adding Edges**: Drag from one node's handle to another's handle
- **Dark Mode**: Toggle between light and dark themes using the theme button
- **Speed Control**: Use the slider to adjust animation speed (higher = faster)
- **Manual Steps**: Use "Step" button to advance one step at a time
- **Reset**: Click "Reset" to return to the beginning of the animation

## Project Structure

```
dag-visualizer/
├── app/
│   ├── globals.css          # Global styles and animations
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main page component
├── components/
│   ├── ControlsPanel.tsx    # Animation controls and progress
│   ├── DagVisualizer.tsx    # Main orchestrator component
│   ├── GraphCanvas.tsx      # React Flow canvas with animations
│   └── InputPanel.tsx       # Graph input and controls sidebar
├── contexts/
│   └── ThemeContext.tsx     # Dark/light theme context
├── lib/
│   └── dagUtils.ts          # DAG algorithms and utilities
├── node_modules/            # Dependencies
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Production Deployment**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub

1. **Push your code to GitHub**

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Automatic Deployments**
   - Every push to main/master triggers a production deploy
   - Other branches create preview deployments

### Environment Variables

No environment variables are required for this project.

### Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Technologies Used

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript 5.9**: Type safety
- **Tailwind CSS 3.4**: Utility-first styling
- **React Flow 11.11**: Graph visualization
- **Framer Motion 12.23**: Animations
- **PostCSS & Autoprefixer**: CSS processing

## Algorithm Details

### Cycle Detection
Uses DFS with a recursion stack to detect cycles in O(V + E) time.

### Topological Sort
Kahn's algorithm implementation:
1. Calculate in-degrees for all nodes
2. Start with nodes having in-degree 0
3. Remove nodes and update in-degrees of neighbors
4. Repeat until all nodes are removed

### DFS Traversal
Recursive depth-first search:
1. Mark current node as visited
2. Visit all unvisited neighbors recursively
3. Return when all reachable nodes are visited

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built as a DAA (Design and Analysis of Algorithms) project
- Inspired by educational graph visualization tools
- Uses React Flow for graph rendering
- Framer Motion for smooth animations

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built with ❤️ using Next.js and TypeScript**

