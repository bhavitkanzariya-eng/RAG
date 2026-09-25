// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  count?: number;
}

// Chatbot types
export interface Chatbot {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  system_prompt: string | null;
  model: string;
  temperature: number;
  top_k: number;
  similarity_threshold: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChatbotRequest {
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
}

export interface UpdateChatbotRequest {
  name?: string;
  description?: string;
  system_prompt?: string;
}

// Document types
export interface Document {
  id: number;
  chatbot_id: number;
  user_id: string;
  file_name: string;
  original_file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  status: string;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Message & Conversation types
export interface Message {
  id: number;
  conversation_id: number;
  chatbot_id: number;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: MessageSource[];
  created_at: string;
}

export interface MessageSource {
  document_id: number;
  document_name: string;
  page?: number;
  chunk_id: number;
}

export interface Conversation {
  id: number;
  chatbot_id: number;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

// Chat request/response
export interface ChatRequest {
  message: string;
  conversation_id?: number;
}

export interface ChatResponse {
  answer: string;
  sources: MessageSource[];
  conversation_id: number;
  message_id: number;
}

// RAG types
export interface DocumentChunk {
  id: number;
  document_id: number;
  chatbot_id: number;
  content: string;
  page_number?: number;
  section_title?: string;
  chunk_index: number;
  created_at: string;
}
