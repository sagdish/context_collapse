import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FileProcessor, cn } from '@/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContent: (content: string, type: 'note' | 'url' | 'file') => Promise<void>;
  isProcessing: boolean;
  actualTheme: 'light' | 'dark';
}

export function UploadModal({ 
  isOpen, 
  onClose, 
  onAddContent, 
  isProcessing, 
  actualTheme 
}: UploadModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const isDark = actualTheme === 'dark';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!FileProcessor.isValidFileType(file)) {
      alert('Please upload a supported file type (.txt, .md, .pdf, .html)');
      return;
    }

    try {
      const content = await FileProcessor.processFile(file);
  await onAddContent(content, 'file');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to read file');
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    try {
      const content = await FileProcessor.fetchURL(urlInput);
  await onAddContent(content, 'url');
      setUrlInput('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to fetch URL');
    }
  };

  const handleNoteSubmit = async () => {
    if (!noteInput.trim()) return;

    try {
  await onAddContent(noteInput, 'note');
      setNoteInput('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add note');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (!FileProcessor.isValidFileType(file)) {
      alert('Please upload a supported file type (.txt, .md, .pdf, .html)');
      return;
    }

    try {
      const content = await FileProcessor.processFile(file);
  await onAddContent(content, 'file');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to read file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        'rounded-lg p-6 max-w-md w-full shadow-xl',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Content</h2>
          <button 
            onClick={onClose}
            className={cn(
              'p-1 rounded transition-colors',
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload File</label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center transition-colors',
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : isDark 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".txt,.md,.pdf,.html,.htm"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
                id="file-input"
              />
              <label 
                htmlFor="file-input"
                className="cursor-pointer block"
              >
                <div className="text-sm">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Supports .txt, .md, .pdf, .html
                </div>
              </label>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Or paste URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlInput.trim()) {
                    handleUrlSubmit();
                  }
                }}
                disabled={isProcessing}
                className={cn(
                  'flex-1 px-3 py-2 rounded border transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  isDark 
                    ? 'bg-gray-700 text-gray-100 border-gray-600' 
                    : 'bg-white text-gray-900 border-gray-300'
                )}
              />
              <button
                onClick={handleUrlSubmit}
                disabled={isProcessing || !urlInput.trim()}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Public Google Docs, websites, articles
            </p>
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Or paste text</label>
            <textarea
              placeholder="Paste your notes here..."
              rows={6}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              disabled={isProcessing}
              className={cn(
                'w-full px-3 py-2 rounded border resize-none transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                isDark 
                  ? 'bg-gray-700 text-gray-100 border-gray-600' 
                  : 'bg-white text-gray-900 border-gray-300'
              )}
            />
            <button
              onClick={handleNoteSubmit}
              disabled={isProcessing || !noteInput.trim()}
              className="mt-2 w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}