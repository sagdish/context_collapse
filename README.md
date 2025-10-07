# Context Collapse

AI-powered knowledge graph visualization tool that discovers surprising connections between ideas.

## 🚀 Quick Start

**The app works in demo mode without any API keys!** Try it out first, then add real AI for better results.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Open http://localhost:3000** and start exploring!

## 🔑 Enable Real AI (Optional)

For the best experience with real AI insights:

### Option 1: Claude (Recommended)
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Create `.env` file:
   ```
   VITE_ANTHROPIC_API_KEY=your_key_here
   ```

### Option 2: OpenAI
1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Create `.env` file:
   ```
   VITE_OPENAI_API_KEY=your_key_here
   ```

### Option 3: Settings Panel
Add your API key through the app's Settings panel (gear icon).

## 🎯 Features

- **🤖 AI-Powered Concept Extraction**: Automatically extracts key concepts from uploaded content
- **🔗 Intelligent Connection Discovery**: Finds surprising and non-obvious relationships between ideas
- **📊 Interactive Graph Visualization**: Force-directed graph with zoom, pan, and node dragging
- **✨ Serendipity Generator**: Creates creative ideas from unexpected concept combinations
- **📁 Multiple Content Sources**: Support for files, URLs, and direct text input
- **🎨 Modern UI**: Dark/light theme with responsive design
- **💾 Export/Import**: Save and load your knowledge graphs
- **🔄 Demo Mode**: Works without API keys using intelligent mock responses

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Claude/OpenAI APIs with fallback to demo mode
- **Icons**: Lucide React
- **State Management**: Custom React hooks
- **Deployment**: Optimized for Vercel

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── modals/         # Modal components
│   ├── Header.tsx      # App header with navigation
│   ├── GraphCanvas.tsx # Interactive graph visualization
│   └── DetailPanel.tsx # Node details panel
├── hooks/              # Custom React hooks
│   ├── useTheme.ts     # Theme management
│   ├── useKnowledgeGraph.ts # Graph state management
│   ├── useCanvasInteraction.ts # Canvas interactions
│   ├── useAPIConfig.ts # API configuration
│   └── useUIState.ts   # UI state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── api.ts          # Real API client
│   ├── mockApi.ts      # Demo mode API
│   ├── graph.ts        # Graph simulation
│   ├── files.ts        # File processing
│   └── helpers.ts      # Helper functions
└── App.tsx             # Main application component
```

## 🎮 Usage

1. **Add Content**: Upload files, paste URLs, or add notes
2. **Explore Connections**: View the automatically generated knowledge graph
3. **Search & Filter**: Find specific concepts and filter by connection strength
4. **Generate Ideas**: Use the serendipity feature for creative insights
5. **Export Data**: Save your knowledge graph for backup

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
# For Claude (Anthropic) - Recommended
VITE_ANTHROPIC_API_KEY=your_claude_api_key_here

# For OpenAI (Alternative)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# For custom/local models (Advanced)
VITE_CUSTOM_API_URL=http://localhost:11434/v1/chat/completions
VITE_CUSTOM_API_KEY=your_custom_key_here
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## � Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy with zero configuration

### Other Platforms

The app builds to static files and can be deployed anywhere:

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🆘 Troubleshooting

### "Demo Mode Active" Warning
This is normal! The app works in demo mode without API keys. To enable real AI:
1. Get an API key from Claude or OpenAI
2. Add it to `.env` file or Settings panel
3. Restart the development server

### API Errors
If you see API errors:
1. Check your API key is correct
2. Verify you have API credits
3. The app will automatically fall back to demo mode

### Performance Issues
For large graphs:
1. Use the connection filter to hide weak connections
2. Delete unused nodes in the detail panel
3. Export and import smaller subsets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

---

**💡 Pro Tip**: Start in demo mode to understand the interface, then add your API key for real AI-powered insights!