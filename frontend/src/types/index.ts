export type DocumentStatus = 'Uploading' | 'Parsing' | 'OCR' | 'Embedding' | 'Ready' | 'Error';

export type ChunkType = 'text' | 'table' | 'image' | 'chart';

export type ProofLevel = 'Stated' | 'Calculated' | 'Inferred';

export type RoleMode = 'Executive' | 'Auditor' | 'Data Scientist' | 'Student' | 'Legal Counsel';

export interface BoundingBox {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  label?: string;
  type: ChunkType;
  color?: string;
}

export interface OCRWord {
  id: string;
  text: string;
  confidence: number;
  bbox?: number[];
  is_low_confidence?: boolean;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  type: ChunkType;
  content: string; // text content, or markdown table, or image description/base64
  rawTableData?: {
    headers: string[];
    rows: string[][];
  };
  ocr_words?: OCRWord[];
  imageUrl?: string;
  similarityScore: number;
  boundingBox?: BoundingBox;
}

export interface DocumentInsights {
  summary: string;
  keyEntities: {
    category: 'Org' | 'Date' | 'Financial' | 'Metric' | 'Location' | 'Person';
    value: string;
  }[];
  suggestedQuestions: string[];
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'pptx' | 'image';
  pageCount: number;
  uploadedAt: string;
  status: DocumentStatus;
  progress: number; // 0-100
  currentStepDescription?: string;
  insights?: DocumentInsights;
  pageImages?: string[]; // preview URLs/base64 for pages
}

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  chunkType: ChunkType;
  label: string; // e.g. "Page 5 · Chart 2"
  chunkId: string;
  similarityScore: number;
  proof_level?: ProofLevel;
  proof_explanation?: string;
  boundingBox?: BoundingBox;
}

export interface VerifiedCalculation {
  id: string;
  title: string;
  formula: string;
  inputs: Record<string, any>;
  computed_result: string;
  status: 'VERIFIED' | 'DISCREPANCY';
  explanation: string;
  source_chunk_ids: string[];
  page_number?: number;
}

export interface DocumentGap {
  id: string;
  clause_name: string;
  category: string;
  status: 'Missing' | 'Partial' | 'Present';
  severity: 'Critical' | 'Moderate' | 'Low';
  description: string;
  recommendation: string;
}

export interface ConflictRecord {
  id: string;
  topic: string;
  claimA: {
    documentName: string;
    pageNumber: number;
    statement: string;
    citationId: string;
  };
  claimB: {
    documentName: string;
    pageNumber: number;
    statement: string;
    citationId: string;
  };
  variance: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size?: string;
  previewUrl?: string;
  isImage?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
  confidenceScore?: number; // 0 - 100
  citations?: Citation[];
  notFound?: boolean;
  conflicts?: ConflictRecord[];
  proof_level?: ProofLevel;
  proof_explanation?: string;
  verified_calculations?: VerifiedCalculation[];
  role_mode?: RoleMode;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export type LanguageCode = 'en' | 'ta' | 'hi';
