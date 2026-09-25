'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  const { userId, isLoaded } = useAuth();

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">RAG System</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">User: {userId}</p>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-4">✅ AUTHENTICATION WORKING</h2>
        <p className="text-gray-600 mb-6">
          You are signed in. Clerk authentication is properly configured.
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Your Information</h3>
          <p className="text-sm font-mono bg-gray-100 p-4 rounded">
            User ID: {userId}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Phase 1 Complete ✅</h3>
          <p className="text-green-800">
            Authentication with Clerk is working correctly. You can now proceed to Phase 2.
          </p>
        </div>
      </main>
    </div>
  );
}
