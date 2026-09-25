import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as chatbotsDB from '@/lib/db/chatbots';
import { getRAGServiceInstance } from '@/lib/services/rag-service';
import { ChatResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const chatbotId = parseInt(id);

    // Verify chatbot ownership
    const chatbot = await chatbotsDB.getChatbotById(chatbotId, userId);
    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: 'Chatbot not found or unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get RAG service and process question
    const ragService = getRAGServiceInstance();
    const ragResponse = await ragService.chat({
      chatbotId,
      userId,
      question: body.message,
    });

    // Convert response to ChatResponse format
    const chatResponse: ChatResponse = {
      answer: ragResponse.answer,
      sources: ragResponse.sources,
      conversation_id: 0,
      message_id: Math.floor(Math.random() * 1000000),
    };

    return NextResponse.json(
      { success: true, data: chatResponse },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message',
      },
      { status: 500 }
    );
  }
}
