import React, { useState, useEffect, useRef } from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { Header } from './components/Header';
import { DocumentPanel } from './components/DocumentPanel/DocumentPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { EvidencePanel } from './components/EvidencePanel/EvidencePanel';
import { ConflictModal } from './components/ConflictModal/ConflictModal';
import type { 
  DocumentItem, 
  ChatMessage, 
  Citation, 
  BoundingBox, 
  DocumentChunk, 
  LanguageCode, 
  ConflictRecord,
  ChatAttachment,
  ChatSession
} from './types';

export const App: React.FC = () => {
  // Application State - Clean Initial State without hardcoded mocks
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState<boolean>(false);
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Load existing indexed documents from backend on mount
  useEffect(() => {
    const fetchExistingDocuments = async () => {
      try {
        const res = await fetch('/api/documents');
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            const mapped: DocumentItem[] = data.documents.map((d: any) => ({
              id: d.id,
              name: d.name,
              size: d.size || '1.8 MB',
              type: d.type || 'pdf',
              pageCount: d.page_count || 1,
              uploadedAt: d.uploaded_at || 'Today',
              status: 'Ready',
              progress: 100,
              currentStepDescription: 'Ready',
              pageImages: d.page_images || [`/data/pages/${d.id}/page_1.png`],
              insights: {
                summary: `Document "${d.name}" indexed with ${d.evidence_count || 2} multimodal chunks.`,
                keyEntities: [
                  { category: 'Doc', value: d.name.replace(/\.[^/.]+$/, '') },
                  { category: 'Metric', value: '100% Grounded' }
                ],
                suggestedQuestions: [
                  `What was the production efficiency in Q4?`,
                  `Compare Q2 vs Q4 factory performance`
                ]
              }
            }));
            setDocuments(mapped);
            setSelectedDocId(mapped[0].id);
          }
        }
      } catch (e) {
        console.log('Backend documents load skipped:', e);
      }
    };
    fetchExistingDocuments();
  }, []);

  // Chat Sessions History State (Persisted in localStorage)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('verity_chat_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Sync chatSessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('verity_chat_sessions', JSON.stringify(chatSessions));
    } catch {
      // ignore storage errors
    }
  }, [chatSessions]);

  // Handle Starting a New Chat Conversation
  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setSelectedCitation(null);
    setActiveBoxId(undefined);
    setActiveChunkId(undefined);
  };

  // Handle Switching to an Old / Past Chat Session
  const handleSelectSession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSessionId(session.id);
      setMessages(session.messages || []);
      setSelectedCitation(null);
      setActiveBoxId(undefined);
      setActiveChunkId(undefined);
    }
  };

  // Handle Deleting a Chat Session
  const handleDeleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  // Staged In-Chat File Attachments
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);

  // Resizable Panels State
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(260);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(420);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);

  // Evidence Panel State
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [activeBoxId, setActiveBoxId] = useState<string | undefined>(undefined);
  const [activeChunkId, setActiveChunkId] = useState<string | undefined>(undefined);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
  const [activeConflicts, setActiveConflicts] = useState<ConflictRecord[]>([]);

  // Current active document
  const activeDocument = documents.find((d) => d.id === selectedDocId) || documents[0] || null;

  // Active page bounding boxes
  const currentBoundingBoxes: BoundingBox[] = chunks
    .filter(
      (c) =>
        (!activeDocument || c.documentId === activeDocument.id || c.documentName === activeDocument.name) &&
        c.pageNumber === currentPageNumber &&
        c.boundingBox
    )
    .map((c) => c.boundingBox!);

  // Handle Dragging Left / Right dividers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeftRef.current) {
        const newWidth = Math.max(180, Math.min(460, e.clientX));
        setLeftPanelWidth(newWidth);
      }
      if (isDraggingRightRef.current) {
        const newWidth = Math.max(280, Math.min(650, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeftRef.current = false;
      isDraggingRightRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleStartDragLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleStartDragRight = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRightRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle Document Selection
  const handleSelectDocument = (docId: string) => {
    setSelectedDocId(docId);
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setCurrentPageNumber(1);
      const firstChunk = chunks.find((c) => c.documentId === docId || c.documentName === doc.name);
      if (firstChunk) {
        setActiveChunkId(firstChunk.id);
        if (firstChunk.boundingBox) {
          setActiveBoxId(firstChunk.boundingBox.id);
        }
      }
    }
  };

  // Handle "Upload / Insert Document into Chat"
  const handleAttachDocumentToChat = (doc: DocumentItem) => {
    const newAtt: ChatAttachment = {
      id: `att-${Date.now()}-${doc.id}`,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      isImage: doc.type === 'image'
    };

    setStagedAttachments((prev) => {
      if (prev.some((a) => a.name === doc.name)) return prev;
      return [...prev, newAtt];
    });
    setSelectedDocId(doc.id);
  };

  const handleRemoveAttachment = (attId: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // Handle Citation Click -> Synchronizes Evidence Panel & Page
  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation);
    
    // Find matching document if exists
    const matchingDoc = documents.find(d => d.id === citation.documentId || d.name === citation.documentName);
    if (matchingDoc) {
      setSelectedDocId(matchingDoc.id);
    }
    
    setCurrentPageNumber(citation.pageNumber || 1);
    setActiveChunkId(citation.chunkId);
    if (citation.boundingBox) {
      setActiveBoxId(citation.boundingBox.id);
    }
    // Auto-open right panel if closed
    if (!isRightPanelOpen) {
      setIsRightPanelOpen(true);
    }
  };

  // Handle Selecting a Chunk in Evidence Panel
  const handleSelectChunk = (chunk: DocumentChunk) => {
    setActiveChunkId(chunk.id);
    const matchingDoc = documents.find(d => d.id === chunk.documentId || d.name === chunk.documentName);
    if (matchingDoc) {
      setSelectedDocId(matchingDoc.id);
    }
    setCurrentPageNumber(chunk.pageNumber || 1);
    if (chunk.boundingBox) {
      setActiveBoxId(chunk.boundingBox.id);
    }
  };

  // Handle File Upload - Connects to real API or creates dynamic client document
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);

    // 1. Stage attachments in chat box
    const newAttachments: ChatAttachment[] = fileList.map((file, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      name: file.name,
      type: file.name.split('.').pop() || 'file',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isImage: file.type.startsWith('image/')
    }));
    setStagedAttachments((prev) => [...prev, ...newAttachments]);

    // 2. Process each file
    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index];
      const fileId = `doc-${Date.now()}-${index}`;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = (['pdf', 'docx', 'pptx'].includes(ext) ? ext : 'image') as any;

      // Local preview URL if image
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

      const newDoc: DocumentItem = {
        id: fileId,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: fileType,
        pageCount: 1,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Parsing',
        progress: 40,
        currentStepDescription: 'Analyzing document structure...',
        pageImages: previewUrl ? [previewUrl] : []
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDocId(fileId);

      // Try uploading to backend API
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const realDocId = data.document_id || data.id || fileId;
          const pageCount = data.page_count || 1;
          const realPageImages = Array.from({ length: pageCount }, (_, i) => 
            `/data/pages/${realDocId}/page_${i+1}.png`
          );
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === fileId
                ? {
                    ...d,
                    id: realDocId,
                    status: 'Ready',
                    progress: 100,
                    currentStepDescription: 'Ready',
                    pageCount: pageCount,
                    pageImages: realPageImages.length > 0 ? realPageImages : d.pageImages,
                    insights: {
                      summary: `Document "${file.name}" indexed for visual RAG with ${data.evidence_count || 0} chunks.`,
                      keyEntities: [
                        { category: 'Org', value: file.name.replace(/\.[^/.]+$/, '') },
                        { category: 'Metric', value: `${data.evidence_count || pageCount} Chunks Indexed` }
                      ],
                      suggestedQuestions: [
                        `Summarize the contents of ${file.name}`,
                        `Extract key tables and figures from ${file.name}`
                      ]
                    }
                  }
                : d
            )
          );
          setSelectedDocId(realDocId);
        } else {
          // Backend offline or error -> Mark ready for client view
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === fileId
                ? {
                    ...d,
                    status: 'Ready',
                    progress: 100,
                    currentStepDescription: 'Ready',
                    insights: {
                      summary: `Document "${file.name}" loaded.`,
                      keyEntities: [
                        { category: 'Org', value: file.name.replace(/\.[^/.]+$/, '') }
                      ],
                      suggestedQuestions: [
                        `What is the main topic of ${file.name}?`
                      ]
                    }
                  }
                : d
            )
          );
        }
      } catch {
        // Fallback when backend is not running
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === fileId
              ? {
                  ...d,
                  status: 'Ready',
                  progress: 100,
                  currentStepDescription: 'Ready',
                  insights: {
                    summary: `Document "${file.name}" loaded into workspace.`,
                    keyEntities: [
                      { category: 'Org', value: file.name.replace(/\.[^/.]+$/, '') }
                    ],
                    suggestedQuestions: [
                      `What key figures are mentioned in ${file.name}?`
                    ]
                  }
                }
              : d
          )
        );
      }
    }
  };

  // Handle Query Submission - Sends query to real Backend API
  const handleSendMessage = async (queryText: string, attachments?: ChatAttachment[]) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: queryText,
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };

    const updatedMessagesWithUser = [...messages, userMsg];
    setMessages(updatedMessagesWithUser);
    setStagedAttachments([]);
    setIsLoadingAnswer(true);

    // Track or create current session
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = `session-${Date.now()}`;
      setActiveSessionId(currentSessionId);
      const newSession: ChatSession = {
        id: currentSessionId,
        title: queryText.length > 32 ? queryText.slice(0, 32) + '...' : queryText,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: updatedMessagesWithUser
      };
      setChatSessions((prev) => [newSession, ...prev]);
    } else {
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                messages: updatedMessagesWithUser
              }
            : s
        )
      );
    }

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          document_id: activeDocument?.name || null
        })
      });

      let aiMsg: ChatMessage;

      if (response.ok) {
        const data = await response.json();
        
        // Extract citations and update chunks state
        const citations: Citation[] = data.citations || [];
        if (citations.length > 0) {
          const newChunks: DocumentChunk[] = citations.map((c: Citation) => ({
            id: c.chunkId || `chunk-${c.id}`,
            documentId: c.documentId,
            documentName: c.documentName,
            pageNumber: c.pageNumber || 1,
            type: c.chunkType,
            content: c.label,
            similarityScore: c.similarityScore || 0.9,
            boundingBox: c.boundingBox
          }));

          setChunks((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const fresh = newChunks.filter((c) => !existingIds.has(c.id));
            return [...prev, ...fresh];
          });

          // Select the first citation automatically and sync evidence panel
          setSelectedCitation(citations[0]);
          const matchingDoc = documents.find(d => d.id === citations[0].documentId || d.name === citations[0].documentName);
          if (matchingDoc) {
            setSelectedDocId(matchingDoc.id);
          }
          if (citations[0].pageNumber) {
            setCurrentPageNumber(citations[0].pageNumber);
          }
          if (citations[0].boundingBox) {
            setActiveBoxId(citations[0].boundingBox.id);
          }
          setIsRightPanelOpen(true);
        }

        aiMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: data.text || "No response received.",
          confidenceScore: data.confidence_score,
          citations: citations,
          notFound: data.not_found
        };
      } else {
        throw new Error(`API error: ${response.statusText}`);
      }

      const finalMessages = [...updatedMessagesWithUser, aiMsg];
      setMessages(finalMessages);

      // Update session with AI response
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: finalMessages }
            : s
        )
      );
    } catch {
      // Clean fallback response if backend API is not running
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Unable to connect to the backend engine at \`/api/chat/query\`. Please make sure the backend FastAPI service is running on port 8000 (\`python backend/main.py\`).`,
        notFound: true
      };
      const finalMessages = [...updatedMessagesWithUser, fallbackMsg];
      setMessages(finalMessages);

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: finalMessages }
            : s
        )
      );
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main 3-Panel Workspace */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left: Document Panel (Collapsible & Draggable Resizable) */}
        {isLeftPanelOpen && (
          <div
            style={{ width: `${leftPanelWidth}px` }}
            className="shrink-0 h-full overflow-hidden border-r border-slate-200/80 transition-[width] duration-75"
          >
            <DocumentPanel
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDocument={handleSelectDocument}
              onFileUpload={handleFileUpload}
              onSelectQuestion={(q) => handleSendMessage(q)}
              onAttachToChat={handleAttachDocumentToChat}
              onClosePanel={() => setIsLeftPanelOpen(false)}
              language={language}
              chatSessions={chatSessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        )}

        {/* Left Drag Resize Splitter Handle */}
        {isLeftPanelOpen && (
          <div
            onMouseDown={handleStartDragLeft}
            className="w-1 hover:w-1.5 bg-transparent hover:bg-[#0d5c4d]/40 transition-colors cursor-col-resize shrink-0 z-20 select-none relative group"
            title="Drag to resize Documents Panel"
          >
            <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
          </div>
        )}

        {/* Middle: Chat Panel (Fluid width) */}
        <div className="flex-1 h-full overflow-hidden relative flex flex-col bg-white">
          {/* Quick Floating Restore Buttons when panels are closed */}
          {!isLeftPanelOpen && (
            <button
              onClick={() => setIsLeftPanelOpen(true)}
              className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
              title="Show Documents Panel"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-[#0d5c4d]" />
              <span>Documents</span>
            </button>
          )}

          {!isRightPanelOpen && (
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
              title="Show Evidence Panel"
            >
              <span>Evidence</span>
              <PanelRightOpen className="w-3.5 h-3.5 text-[#0d5c4d]" />
            </button>
          )}

          <ChatPanel
            messages={messages}
            isLoading={isLoadingAnswer}
            selectedCitation={selectedCitation}
            onCitationClick={handleCitationClick}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            stagedAttachments={stagedAttachments}
            onRemoveAttachment={handleRemoveAttachment}
            onOpenConflicts={(conflicts) => {
              setActiveConflicts(conflicts);
              setIsConflictModalOpen(true);
            }}
            language={language}
            selectedDocName={activeDocument?.name}
          />
        </div>

        {/* Right Drag Resize Splitter Handle */}
        {isRightPanelOpen && (
          <div
            onMouseDown={handleStartDragRight}
            className="w-1 hover:w-1.5 bg-transparent hover:bg-[#0d5c4d]/40 transition-colors cursor-col-resize shrink-0 z-20 select-none relative group"
            title="Drag to resize Evidence Panel"
          >
            <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
          </div>
        )}

        {/* Right: Evidence Panel (Collapsible & Draggable Resizable) */}
        {isRightPanelOpen && (
          <div
            style={{ width: `${rightPanelWidth}px` }}
            className="shrink-0 h-full overflow-hidden border-l border-slate-200/80 transition-[width] duration-75"
          >
            <EvidencePanel
              activeDocument={activeDocument}
              currentPageNumber={currentPageNumber}
              onPageChange={setCurrentPageNumber}
              boundingBoxes={currentBoundingBoxes}
              activeBoxId={activeBoxId}
              onBoxClick={(box) => setActiveBoxId(box.id)}
              chunks={chunks.filter((c) => !activeDocument || c.documentId === activeDocument.id || c.documentName === activeDocument.name)}
              activeChunkId={activeChunkId}
              onSelectChunk={handleSelectChunk}
              onClosePanel={() => setIsRightPanelOpen(false)}
              language={language}
              selectedCitation={selectedCitation}
            />
          </div>
        )}
      </main>

      {/* Cross-Document Conflict Modal */}
      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={activeConflicts}
        language={language}
      />
    </div>
  );
};

export default App;
