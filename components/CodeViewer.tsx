'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { startSSEStream } from '@/lib/hooks/useSSE';
import { useCodeStore } from '@/lib/store/useCodeStore';
import {
  Loader2, Code2, File, Folder, FolderOpen,
  Copy, Check, ChevronRight, Sparkles, CheckCircle2, Search, X
} from 'lucide-react';

interface GeneratedFile {
  path: string;
  content: string;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFileTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const partialPath = parts.slice(0, i + 1).join('/');

      let existing = current.find(n => n.name === name);
      if (!existing) {
        existing = {
          name,
          path: partialPath,
          isDir: !isLast,
          children: [],
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  // Sort: directories first, then files, alphabetical
  const sortTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .map(n => ({ ...n, children: sortTree(n.children) }))
      .sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
  };

  return sortTree(root);
}

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    json: 'json', md: 'markdown', css: 'css', scss: 'scss',
    html: 'html', yaml: 'yaml', yml: 'yaml', sql: 'sql',
    py: 'python', go: 'go', rs: 'rust', sh: 'bash',
    env: 'bash', gitignore: 'bash', dockerfile: 'docker',
    prisma: 'prisma', graphql: 'graphql', gql: 'graphql',
    toml: 'toml', xml: 'xml', svg: 'xml',
  };
  return map[ext] || 'plaintext';
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const colors: Record<string, string> = {
    ts: 'text-blue-500', tsx: 'text-blue-400', js: 'text-yellow-500', jsx: 'text-yellow-400',
    json: 'text-amber-500', md: 'text-gray-500', css: 'text-pink-500', scss: 'text-pink-400',
    html: 'text-orange-500', sql: 'text-emerald-500', py: 'text-green-500',
    env: 'text-gray-400', prisma: 'text-indigo-500',
  };
  return colors[ext] || 'text-gray-400';
}

// ─── FileTree Component ──────────────────────────────────────────────────────

function FileTreeNode({
  node,
  selectedPath,
  onSelect,
  depth = 0,
  expandedDirs,
  onToggleDir,
}: {
  node: TreeNode;
  selectedPath: string;
  onSelect: (path: string) => void;
  depth?: number;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
}) {
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedPath === node.path;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => onToggleDir(node.path)}
          className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left rounded-md transition-colors hover:bg-surface-alt text-[13px] font-medium ${
            isSelected ? 'bg-primary/5 text-primary' : 'text-text-secondary'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-200 shrink-0 text-text-muted ${isExpanded ? 'rotate-90' : ''}`}
          />
          {isExpanded ? (
            <FolderOpen size={14} className="text-amber-500 shrink-0" />
          ) : (
            <Folder size={14} className="text-amber-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && (
          <div>
            {node.children.map(child => (
              <FileTreeNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
                expandedDirs={expandedDirs}
                onToggleDir={onToggleDir}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left rounded-md transition-colors text-[13px] ${
        isSelected
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
      }`}
      style={{ paddingLeft: `${depth * 14 + 24}px` }}
    >
      <File size={13} className={`shrink-0 ${getFileIcon(node.name)}`} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CodeViewer({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ message: '', progress: 0, fileCount: 0 });
  const [genFiles, setGenFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [isLoadingCode, setIsLoadingCode] = useState(true);
  const [needsGeneration, setNeedsGeneration] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const generatedRef = useRef(false);

  const setupFiles = useCallback((allFiles: GeneratedFile[]) => {
    setFiles(allFiles);
    // Select first file and expand all directories
    const firstFile = allFiles[0];
    if (firstFile) setSelectedFile(firstFile.path);

    // Expand all directories by default
    const dirs = new Set<string>();
    allFiles.forEach(f => {
      const parts = f.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    });
    setExpandedDirs(dirs);
  }, []);

  const generateCode = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setGenProgress({ message: 'Starting code generation…', progress: 0, fileCount: 0 });
    setGenFiles([]);

    let allFiles: GeneratedFile[] = [];

    try {
      await startSSEStream(
        '/api/generate-code',
        { projectId },
        {
          onEvent: (event, data: any) => {
            if (event === 'progress') {
              setGenProgress(prev => ({
                ...prev,
                message: data.message || prev.message,
                progress: data.progress ?? prev.progress,
              }));
            } else if (event === 'file') {
              setGenFiles(prev => [...prev, data.path]);
              setGenProgress(prev => ({
                ...prev,
                progress: data.progress ?? prev.progress,
                fileCount: data.total || prev.fileCount,
              }));
            } else if (event === 'result') {
              if (data.success && data.files) {
                allFiles = data.files;
              }
            } else if (event === 'error') {
              setError(data.message || 'Code generation failed');
            }
          },
          onError: (err) => {
            setError(err.message || 'Failed to generate code.');
          },
          onDone: () => {
            if (allFiles.length > 0) {
              setupFiles(allFiles);
              useCodeStore.getState().setCode(projectId, allFiles);
            }
            setIsGenerating(false);
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to generate code.');
      setIsGenerating(false);
    }
  }, [projectId, setupFiles]);

  const checkExistingCode = useCallback(async () => {
    try {
      setIsLoadingCode(true);

      // Check local cache first
      const cachedCode = useCodeStore.getState().getCode(projectId);
      if (cachedCode && cachedCode.length > 0) {
        setupFiles(cachedCode);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('state_data')
        .eq('id', projectId)
        .single();
      
      const parsedFiles = data?.state_data?.generatedCode;
      const isCurrentlyGenerating = data?.state_data?.isGeneratingCode;
      
      if (Array.isArray(parsedFiles) && parsedFiles.length > 0) {
        setupFiles(parsedFiles);
        useCodeStore.getState().setCode(projectId, parsedFiles); // Save to cache
      } else if (isCurrentlyGenerating) {
        setIsGenerating(true);
        setGenProgress({ message: 'Generation already in progress in another tab... Please wait or refresh later.', progress: 50, fileCount: 0 });
      } else {
        setNeedsGeneration(true);
      }
    } catch (err) {
      setNeedsGeneration(true);
    } finally {
      setIsLoadingCode(false);
    }
  }, [projectId, setupFiles, generateCode]);

  // Auto-trigger generation on mount
  useEffect(() => {
    if (!generatedRef.current && projectId) {
      generatedRef.current = true;
      checkExistingCode();
    }
  }, [projectId, checkExistingCode]);


  const handleCopyFile = () => {
    const file = files.find(f => f.path === selectedFile);
    if (!file) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const selectedFileData = files.find(f => f.path === selectedFile);
  const tree = buildFileTree(files);

  // Filter files for search
  const filteredFiles = searchQuery
    ? files.filter(f => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const lineCount = selectedFileData?.content.split('\n').length || 0;

  // ─── Generating State ────────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col bg-bg">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-primary" />
            <h1 className="text-[16px] font-bold text-text-primary">Generating Starter Code</h1>
          </div>
        </div>

        {/* VS Code Style Terminal */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e] font-mono text-[13px] overflow-hidden selection:bg-[#264f78]">
          <div className="flex items-center px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] text-[#cccccc] text-[12px] shrink-0 gap-4">
            <span className="text-[#e7c000]">TERMINAL</span>
            <span className="text-[#cccccc]/50">Code Generation Task</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col space-y-1.5 pb-8">
            <div className="mb-4">
              <div className="text-[#569cd6] font-bold">
                &gt; BuildFlow Scaffold Generator v1.0.0
              </div>
              <div className="text-[#ce9178] mt-1">
                &gt; Status: {genProgress.message || 'Preparing…'}
              </div>
              <div className="text-[#b5cea8] mt-1">
                &gt; Progress: {genProgress.progress}% ({genFiles.length} / {genProgress.fileCount || '?'} files)
              </div>
            </div>

            {genFiles.map((path, i) => (
              <div key={i} className="flex gap-3 items-start animate-fade-in">
                <span className="text-[#4ec9b0] shrink-0">CREATE</span>
                <span className="text-[#d4d4d4] break-all">{path}</span>
              </div>
            ))}
            
            <div className="flex gap-3 items-start mt-2">
              <span className="text-[#569cd6] shrink-0">&gt;</span>
              <span className="text-[#d4d4d4] animate-pulse">_</span>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-[#4d1f1c] border border-[#f48771] text-[#f48771] rounded-sm text-[13px]">
                Error: {error}
                <button onClick={generateCode} className="ml-3 underline hover:text-white">Retry</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Needs Generation State ────────────────────────────────────────────────────

  if (needsGeneration) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-primary" />
            <h1 className="text-[16px] font-bold text-text-primary">Starter Code</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Code2 size={32} className="text-primary" />
            </div>
            <h2 className="text-[20px] font-bold text-text-primary mb-2">Ready to Build</h2>
            <p className="text-[14px] text-text-muted mb-8">
              Your requirements and design are ready. Click below to generate the complete project scaffold. This usually takes about 60 seconds.
            </p>
            <button
              onClick={() => {
                setNeedsGeneration(false);
                generateCode();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors shadow-lg shadow-primary/20"
            >
              <Sparkles size={18} />
              Generate Starter Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────

  if (error && files.length === 0) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface shrink-0">
          <h1 className="text-[16px] font-bold text-text-primary">Starter Code</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[17px] font-semibold text-text-primary mb-2">Generation Failed</p>
            <p className="text-[14px] text-text-muted mb-4">{error}</p>
            <button
              onClick={generateCode}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Code Viewer ─────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-primary" />
            <h1 className="text-[15px] font-bold text-text-primary">Starter Code</h1>
            <span className="text-[12px] font-semibold text-text-muted bg-surface-alt px-2 py-0.5 rounded-md">
              {files.length} files
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { generatedRef.current = false; generateCode(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
          >
            <Sparkles size={13} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* File tree sidebar */}
        <div className="w-[260px] min-w-[220px] border-r border-border bg-surface flex flex-col shrink-0">
          {/* Search toggle */}
          <div className="px-3 py-2 border-b border-border">
            {showSearch ? (
              <div className="flex items-center gap-1.5 bg-surface-alt rounded-lg border border-border px-2.5 py-1.5">
                <Search size={13} className="text-text-muted shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search files…"
                  className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none"
                  autoFocus
                />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-text-muted hover:text-text-primary">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Explorer</span>
                <button onClick={() => setShowSearch(true)} className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors">
                  <Search size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Tree / Search results */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-1 px-1.5">
            {searchQuery ? (
              filteredFiles.length > 0 ? (
                filteredFiles.map(f => (
                  <button
                    key={f.path}
                    onClick={() => { setSelectedFile(f.path); setSearchQuery(''); setShowSearch(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left rounded-md text-[13px] transition-colors ${
                      selectedFile === f.path
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-secondary hover:bg-surface-alt'
                    }`}
                  >
                    <File size={13} className={`shrink-0 ${getFileIcon(f.path)}`} />
                    <span className="truncate">{f.path}</span>
                  </button>
                ))
              ) : (
                <p className="text-[13px] text-text-muted text-center py-4">No files match</p>
              )
            ) : (
              tree.map(node => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  selectedPath={selectedFile}
                  onSelect={setSelectedFile}
                  expandedDirs={expandedDirs}
                  onToggleDir={toggleDir}
                />
              ))
            )}
          </div>
        </div>

        {/* Code view */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFileData ? (
            <>
              {/* File header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-alt shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <File size={14} className={getFileIcon(selectedFileData.path)} />
                  <span className="text-[13px] font-semibold text-text-primary truncate">
                    {selectedFileData.path}
                  </span>
                  <span className="text-[11px] text-text-muted shrink-0">
                    {lineCount} lines
                  </span>
                </div>
                <button
                  onClick={handleCopyFile}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                >
                  {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-auto custom-scrollbar" ref={codeRef}>
                <div className="flex min-h-full">
                  {/* Line numbers */}
                  <div className="sticky left-0 bg-surface-alt border-r border-border px-3 py-4 text-right select-none shrink-0 z-10">
                    {selectedFileData.content.split('\n').map((_, i) => (
                      <div key={i} className="text-[12px] leading-[20px] text-text-muted/50 font-mono">
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Code */}
                  <pre className="flex-1 py-4 px-4 overflow-x-auto">
                    <code className={`text-[13px] leading-[20px] font-mono text-text-primary language-${getLanguage(selectedFileData.path)}`}>
                      {selectedFileData.content}
                    </code>
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <File size={32} className="mx-auto mb-3 text-text-faint" strokeWidth={1.2} />
                <p className="text-[15px] font-medium">Select a file to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
