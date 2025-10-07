import React, { useState, useEffect } from 'react';
import { 
  Header, 
  GraphCanvas, 
  DetailPanel, 
  UploadModal, 
  SettingsModal, 
  SerendipityModal, 
  WelcomeModal 
} from './components';
import { 
  useTheme, 
  useKnowledgeGraph, 
  useUIState, 
  useAPIConfig 
} from './hooks';
import { apiClient, cn } from './utils';

function App() {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isMockMode, setIsMockMode] = useState(false);
  
  const {
    graph,
    selectedNode,
    searchQuery,
    filterStrength,
    filteredConnections,
    setSelectedNode,
    setSearchQuery,
    setFilterStrength,
    addContent,
    deleteNode,
    clearGraph,
    importGraph,
    updateNodePosition,
  } = useKnowledgeGraph();
  
  const {
    uiState,
    toggleModal,
    generateSerendipity,
    dismissWelcome,
  } = useUIState();

  const {
    useCustomAPI,
    apiConfig,
    updateConfig,
    saveConfig,
    toggleCustomAPI,
  } = useAPIConfig();

  // Check API status on mount and when config changes
  useEffect(() => {
    setIsMockMode(apiClient.isInMockMode());
  }, [useCustomAPI, apiConfig]);

  // Handle content addition with proper async handling
  const handleAddContent = async (content: string, type: 'note' | 'url' | 'file'): Promise<void> => {
    await addContent(content, type);
    toggleModal('showUpload', false);
  };

  // Handle serendipity generation
  const handleSerendipityClick = async () => {
    try {
      const concepts = graph.nodes.map(node => node.label);
      await generateSerendipity(concepts);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate ideas');
    }
  };

  // Handle export graph
  const handleExportGraph = () => {
    const data = JSON.stringify(graph, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `context-collapse-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle import graph
  const handleImportGraph = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        importGraph(imported);
        alert('Graph imported successfully!');
      } catch (error) {
        alert('Failed to import graph');
      }
    };
    reader.readAsText(file);
  };

  // Handle welcome get started
  const handleWelcomeGetStarted = () => {
    dismissWelcome();
    toggleModal('showUpload', true);
  };

  return (
    <div className={`min-h-screen transition-colors ${
      actualTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => toggleModal('showUpload', true)}
        onSerendipityClick={handleSerendipityClick}
        onWelcomeClick={() => toggleModal('showWelcome', true)}
        onSettingsClick={() => toggleModal('showSettings', true)}
        isProcessing={uiState.isProcessing}
        actualTheme={actualTheme}
        isMockMode={isMockMode}
      />
      <main className="px-4 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
          <section className="flex-[3] basis-0 min-w-0 min-h-[70vh] h-full">
            <GraphCanvas
              nodes={graph.nodes}
              connections={graph.connections}
              filteredConnections={filteredConnections}
              selectedNode={selectedNode}
              searchQuery={searchQuery}
              filterStrength={filterStrength}
              onFilterStrengthChange={setFilterStrength}
              onNodeSelect={setSelectedNode}
              onNodePositionUpdate={updateNodePosition}
              actualTheme={actualTheme}
              isProcessing={uiState.isProcessing}
            />
          </section>

          <aside className="flex-[1] basis-0 min-w-0 w-full lg:max-w-sm">
            <div
              className={cn(
                'rounded-xl border-2 shadow-lg h-full min-h-[280px]',
                actualTheme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              )}
            >
              {selectedNode ? (
                <DetailPanel
                  selectedNode={selectedNode}
                  connections={graph.connections}
                  nodes={graph.nodes}
                  onDeleteNode={deleteNode}
                  actualTheme={actualTheme}
                />
              ) : (
                <div className="h-full flex flex-col gap-4 p-6">
                  <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Concept details
                  </div>
                  <h2 className="text-xl font-bold">
                    Select a concept to explore its story
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Click a node in the graph to reveal supporting content, connections, and quick actions here. Drag nodes to rearrange your knowledge map, use the filter to focus on stronger connections, and zoom with Cmd/Ctrl + scroll.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2 list-disc list-inside">
                    <li>Hover to highlight related concepts.</li>
                    <li>Use the lightning button in the header for fresh serendipity ideas.</li>
                    <li>Upload more material to keep the graph evolving.</li>
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      
      <UploadModal
        isOpen={uiState.showUpload}
        onClose={() => toggleModal('showUpload', false)}
        onAddContent={handleAddContent}
        isProcessing={uiState.isProcessing}
        actualTheme={actualTheme}
      />

      <SettingsModal
        isOpen={uiState.showSettings}
        onClose={() => toggleModal('showSettings', false)}
        theme={theme}
        onThemeChange={setTheme}
        useCustomAPI={useCustomAPI}
        apiConfig={apiConfig}
        onToggleCustomAPI={toggleCustomAPI}
        onUpdateConfig={updateConfig}
        onSaveConfig={saveConfig}
        onExportGraph={handleExportGraph}
        onImportGraph={handleImportGraph}
        onClearData={clearGraph}
        actualTheme={actualTheme}
      />

      <SerendipityModal
        isOpen={uiState.showSerendipity}
        onClose={() => toggleModal('showSerendipity', false)}
        ideas={uiState.serendipityIdeas}
        onGenerateMore={handleSerendipityClick}
        isProcessing={uiState.isProcessing}
        actualTheme={actualTheme}
      />

      <WelcomeModal
        isOpen={uiState.showWelcome}
        onClose={dismissWelcome}
        onGetStarted={handleWelcomeGetStarted}
        actualTheme={actualTheme}
        isMockMode={isMockMode}
      />
    </div>
  );
}

export default App;