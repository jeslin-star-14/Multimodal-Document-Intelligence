import type { LanguageCode } from '../types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  documentsTab: string;
  chatTab: string;
  evidenceTab: string;
  uploadTitle: string;
  uploadSubtitle: string;
  uploadButton: string;
  dragDropText: string;
  supportedFormats: string;
  insightsTitle: string;
  summary: string;
  entities: string;
  suggestedQuestions: string;
  inputPlaceholder: string;
  send: string;
  listening: string;
  confidence: string;
  sources: string;
  notFoundTitle: string;
  notFoundDesc: string;
  pagePreview: string;
  chunkType: string;
  similarity: string;
  textChunks: string;
  tableChunks: string;
  imageChunks: string;
  crossDocConflict: string;
  conflictWarning: string;
  viewConflict: string;
  lightMode: string;
  darkMode: string;
  processing: string;
  statusParsing: string;
  statusOCR: string;
  statusEmbedding: string;
  statusReady: string;
  filterAll: string;
  filterSelected: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  page: string;
  of: string;
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    appName: "Multimodal Document Intelligence",
    appSubtitle: "Visual RAG with Pixel-Level Grounded Citations",
    documentsTab: "Documents",
    chatTab: "Chat & Analysis",
    evidenceTab: "Evidence Inspector",
    uploadTitle: "Upload Documents",
    uploadSubtitle: "PDF, DOCX, PPTX, Images (OCR enabled)",
    uploadButton: "Browse Files",
    dragDropText: "Drag & drop files here, or browse",
    supportedFormats: "Supports PDF, DOCX, PPTX, PNG, JPG, TIFF (up to 50MB)",
    insightsTitle: "Document Insights",
    summary: "Executive Summary",
    entities: "Key Extracted Entities",
    suggestedQuestions: "Suggested Queries",
    inputPlaceholder: "Ask anything about your documents, charts, or tables...",
    send: "Send",
    listening: "Listening... speak now",
    confidence: "Confidence",
    sources: "Citations & Evidence",
    notFoundTitle: "Insufficient Evidence in Corpus",
    notFoundDesc: "The retrieved multimodal chunks do not contain verified evidence to answer this query confidently without hallucination.",
    pagePreview: "Original Page Grounding",
    chunkType: "Extracted Chunk Type",
    similarity: "Vector Similarity",
    textChunks: "Text Chunks",
    tableChunks: "Table Chunks",
    imageChunks: "Image / Chart Chunks",
    crossDocConflict: "Cross-Document Conflict Detected",
    conflictWarning: "Conflicting data points detected across uploaded documents.",
    viewConflict: "Compare Sources",
    lightMode: "Light",
    darkMode: "Dark",
    processing: "Processing pipeline",
    statusParsing: "Parsing Document",
    statusOCR: "Multimodal OCR",
    statusEmbedding: "Generating Embeddings",
    statusReady: "Ready for Q&A",
    filterAll: "All Documents",
    filterSelected: "Selected Document",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset",
    page: "Page",
    of: "of",
  },
  ta: {
    appName: "மல்டிமாடல் ஆவண நுண்ணறிவு",
    appSubtitle: "துல்லியமான ஆதாரங்களுடன் கூடிய AI ஆவண பகுப்பாய்வு",
    documentsTab: "ஆவணங்கள்",
    chatTab: "உரையாடல் & ஆய்வு",
    evidenceTab: "ஆதார சோதனையாளர்",
    uploadTitle: "ஆவணங்களைப் பதிவேற்றவும்",
    uploadSubtitle: "PDF, DOCX, PPTX, படங்கள் (OCR வசதியுடன்)",
    uploadButton: "கோப்புகளைத் தேர்ந்தெடுக்கவும்",
    dragDropText: "கோப்புகளை இங்கே இழுத்துப் போடவும்",
    supportedFormats: "PDF, DOCX, PPTX, படங்கள் ஏற்கப்படும் (50MB வரை)",
    insightsTitle: "ஆவண நுண்ணறிவுகள்",
    summary: "சுருக்கம்",
    entities: "முக்கிய விவரங்கள்",
    suggestedQuestions: "பரிந்துரைக்கப்பட்ட கேள்விகள்",
    inputPlaceholder: "ஆவணங்கள், விளக்கப்படங்கள் அல்லது அட்டவணைகள் குறித்து கேளுங்கள்...",
    send: "அனுப்பு",
    listening: "கேட்கிறது... பேசவும்",
    confidence: "நம்பகத்தன்மை",
    sources: "ஆதாரங்கள்",
    notFoundTitle: "ஆவணங்களில் தகவல் கிடைக்கவில்லை",
    notFoundDesc: "கேட்கப்பட்ட கேள்விக்குரிய உறுதியான ஆதாரம் கிடைக்கப்பெறவில்லை.",
    pagePreview: "அசல் பக்க முன்னோட்டம்",
    chunkType: "பிரிவு வகை",
    similarity: "ஒப்புமை மதிப்பீடு",
    textChunks: "உரை பகுதிகள்",
    tableChunks: "அட்டவணைகள்",
    imageChunks: "வரைபடங்கள் / படங்கள்",
    crossDocConflict: "ஆவணங்களுக்கிடையேயான முரண்பாடு",
    conflictWarning: "வெவ்வேறு ஆவணங்களுக்கிடையே முரண்பட்ட தகவல்கள் கண்டறியப்பட்டுள்ளன.",
    viewConflict: "ஒப்பிட்டு பார்க்க",
    lightMode: "வெளிச்சம்",
    darkMode: "இருள்",
    processing: "செயலாக்க நிலை",
    statusParsing: "ஆவணம் பிரித்தெடுக்கப்படுகிறது",
    statusOCR: "OCR ஆய்வு நடைபெறுகிறது",
    statusEmbedding: "வெக்டார் உருவாக்கம்",
    statusReady: "கேள்விக்கு தயார்",
    filterAll: "அனைத்து ஆவணங்கள்",
    filterSelected: "தேர்ந்தெடுத்த ஆவணம்",
    zoomIn: "பெரிதாக்கு",
    zoomOut: "சிறிதாக்கு",
    resetZoom: "மீட்டமை",
    page: "பக்கம்",
    of: "/",
  },
  hi: {
    appName: "मल्टीमॉडल दस्तावेज़ बुद्धिमत्ता",
    appSubtitle: "सटीक दृश्य साक्ष्य और उद्धरण के साथ AI विश्लेषण",
    documentsTab: "दस्तावेज़",
    chatTab: "चैट और विश्लेषण",
    evidenceTab: "साक्ष्य निरीक्षक",
    uploadTitle: "दस्तावेज़ अपलोड करें",
    uploadSubtitle: "PDF, DOCX, PPTX, छवियां (OCR सक्षम)",
    uploadButton: "फ़ाइलें चुनें",
    dragDropText: "फ़ाइलें यहाँ खींचें या ब्राउज़ करें",
    supportedFormats: "PDF, DOCX, PPTX, PNG, JPG समर्थित (50MB तक)",
    insightsTitle: "दस्तावेज़ अंतर्दृष्टि",
    summary: "कार्यकारी सारांश",
    entities: "प्रमुख निकाली गई इकाइयाँ",
    suggestedQuestions: "सुझाए गए प्रश्न",
    inputPlaceholder: "दस्तावेज़, चार्ट या तालिकाओं के बारे में कुछ भी पूछें...",
    send: "भेजें",
    listening: "सुन रहे हैं... अब बोलें",
    confidence: "विश्वास स्तर",
    sources: "उद्धरण और साक्ष्य",
    notFoundTitle: "अपर्याप्त साक्ष्य",
    notFoundDesc: "अपलोड किए गए दस्तावेज़ों में इस प्रश्न का स्पष्ट और सत्यापित उत्तर नहीं मिला।",
    pagePreview: "मूल पृष्ठ पूर्वावलोकन",
    chunkType: "खंड प्रकार",
    similarity: "समानता स्कोर",
    textChunks: "पाठ खंड",
    tableChunks: "तालिका खंड",
    imageChunks: "चार्ट / चित्र खंड",
    crossDocConflict: "दस्तावेज़ों में विरोधाभास पाया गया",
    conflictWarning: "अपलोड किए गए विभिन्न दस्तावेज़ों में परस्पर विरोधी आंकड़े पाए गए।",
    viewConflict: "स्रोतों की तुलना करें",
    lightMode: "लाइट",
    darkMode: "डार्क",
    processing: "प्रसंस्करण प्रक्रिया",
    statusParsing: "पार्सिंग जारी है",
    statusOCR: "मल्टीमॉडल OCR",
    statusEmbedding: "एम्बेडिंग निर्माण",
    statusReady: "प्रश्नोत्तर के लिए तैयार",
    filterAll: "सभी दस्तावेज़",
    filterSelected: "चयनित दस्तावेज़",
    zoomIn: "ज़ूम इन",
    zoomOut: "ज़ूम आउट",
    resetZoom: "रीसेट",
    page: "पृष्ठ",
    of: "का",
  }
};
