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

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        {/* Info Box */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Phase 2 Test Instructions</h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>Click "Create Test Chatbot" to insert data into the database</li>
            <li>Verify chatbot appears in the list above</li>
            <li>Click "Refresh" to fetch latest data from database</li>
            <li>Test that data persists across page reloads</li>
            <li>If everything works → Phase 2 ✅ Complete</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
