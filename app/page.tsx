'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Chatbot {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface Document {
  id: number;
  file_name: string;
  original_file_name: string;
  file_type: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

interface MessageSource {
  document_id: number;
  document_name: string;
  page?: number;
  chunk_id: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSource[];
}

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (userId && isLoaded) {
      fetchChatbots();
    }
  }, [userId, isLoaded]);

  async function fetchChatbots() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chatbots');
      const data = await res.json();

      if (data.success) {
        setChatbots(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch chatbots');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chatbots');
    } finally {
      setLoading(false);
    }
  }

  async function createTestChatbot() {
    try {
      const res = await fetch('/api/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test Chatbot ${Date.now()}`,
          description: 'Created to test database functionality',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setChatbots([data.data, ...chatbots]);
        alert('✅ Chatbot created successfully!');
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  async function fetchDocuments(chatbotId: number) {
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/documents`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    }
  }

  async function handleChatbotSelect(chatbot: Chatbot) {
    setSelectedChatbot(chatbot);
    setMessages([]);
    await fetchDocuments(chatbot.id);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedChatbot || !e.target.files?.length) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`/api/chatbots/${selectedChatbot.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setDocuments([data.data, ...documents]);
        alert('✅ Document uploaded! Processing has started.');
        e.target.value = '';
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Upload failed'));
    } finally {
      setUploading(false);
    }
  }

  async function handleSendMessage() {
    if (!selectedChatbot || !chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
    };

    setMessages([...messages, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`/api/chatbots/${selectedChatbot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput }),
      });

      const data = await res.json();
      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer,
          sources: data.data.sources,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Chat failed'));
    } finally {
      setChatLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-4xl font-bold">RAG System</h1>
        <p className="mb-8 text-lg text-gray-600">Sign in to get started</p>
        <div className="flex gap-4">
          <Link
            href="/sign-in"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">RAG System</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">User: {userId}</p>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Phase 1 Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-900 mb-2">✅ Phase 1: Authentication Complete</h2>
          <p className="text-green-800">Clerk authentication is working correctly.</p>
        </div>

        {/* Phase 2 Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">🔄 Phase 2: Database Integration</h2>
          <p className="text-blue-800 mb-4">
            PostgreSQL database connection and CRUD operations.
          </p>

          {/* Test Database */}
          <div className="flex gap-2">
            <button
              onClick={createTestChatbot}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              ➕ Create Test Chatbot
            </button>
            <button
              onClick={fetchChatbots}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Chatbots List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Your Chatbots</h3>
            <p className="text-sm text-gray-600 mt-1">
              {chatbots.length} chatbot{chatbots.length !== 1 ? 's' : ''}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-800 text-sm">
              ❌ {error}
            </div>
          )}

          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : chatbots.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No chatbots yet. Click "Create Test Chatbot" to test database.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chatbots.map((chatbot) => (
                <div key={chatbot.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{chatbot.name}</p>
                      {chatbot.description && (
                        <p className="text-sm text-gray-600 mt-1">{chatbot.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        ID: {chatbot.id} | Created: {new Date(chatbot.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {chatbot.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phase 3: Document Management */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-purple-900 mb-4">📄 Phase 3: Document Management</h2>
          <p className="text-purple-800 mb-4">Upload and manage documents for chatbots.</p>

          {!selectedChatbot ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Select a chatbot above to upload documents</p>
              {chatbots.length > 0 && (
                <button
                  onClick={() => handleChatbotSelect(chatbots[0])}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Select {chatbots[0].name}
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-purple-900 mb-3">
                Working with: <span className="text-purple-600">{selectedChatbot.name}</span>
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.txt,.docx"
                  className="text-sm"
                />
                {uploading && <span className="text-purple-600">Uploading...</span>}
              </div>

              {documents.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Documents:</h4>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="bg-white p-3 rounded border border-purple-200 text-sm">
                        <p className="font-medium">{doc.original_file_name}</p>
                        <p className="text-xs text-gray-600">
                          Status: {doc.status} | Chunks: {doc.chunk_count}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Phase 4: Vector Embeddings */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-orange-900 mb-2">🔍 Phase 4: Vector Embeddings</h2>
          <p className="text-orange-800">
            {documents.length > 0
              ? `✅ ${documents.reduce((sum, d) => sum + d.chunk_count, 0)} chunks embedded and indexed`
              : 'Upload documents to generate embeddings'}
          </p>
        </div>

        {/* Phase 5: RAG Chat */}
        {selectedChatbot && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4">💬 Phase 5: RAG Chat</h2>
            <p className="text-indigo-800 mb-4">
              {documents.length > 0
                ? 'Ask questions about your uploaded documents'
                : 'Upload documents first to enable RAG chat'}
            </p>

            <div className="bg-white rounded border border-indigo-200 p-4 h-96 overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 pt-8">No messages yet. Upload a document and ask a question!</p>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="text-xs mt-2 opacity-75">
                            <p className="font-semibold">Sources:</p>
                            {msg.sources.map((src) => (
                              <p key={src.chunk_id}>{src.document_name}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                        <p className="text-sm">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={documents.length === 0 || chatLoading}
                placeholder="Ask a question about your documents..."
                className="flex-1 px-4 py-2 border border-indigo-200 rounded text-sm disabled:bg-gray-100"
              />
              <button
                onClick={handleSendMessage}
                disabled={documents.length === 0 || chatLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Complete Testing Flow</h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>✅ Phase 1: Sign in with Clerk authentication</li>
            <li>✅ Phase 2: Create a test chatbot in the database</li>
            <li>Phase 3: Select a chatbot and upload a PDF or TXT file</li>
            <li>Phase 4: Wait for embeddings to be generated and chunks indexed</li>
            <li>Phase 5: Ask questions about your document in the chat interface</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
