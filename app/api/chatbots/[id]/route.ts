import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as chatbotsDB from '@/lib/db/chatbots';

export async function GET(
  _request: NextRequest,
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

    if (isNaN(chatbotId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid chatbot ID' },
        { status: 400 }
      );
    }

    const chatbot = await chatbotsDB.getChatbotById(chatbotId, userId);

    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: chatbot },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching chatbot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chatbot',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    if (isNaN(chatbotId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid chatbot ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const chatbot = await chatbotsDB.updateChatbot(chatbotId, userId, body);

    return NextResponse.json(
      { success: true, data: chatbot },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating chatbot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update chatbot',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    if (isNaN(chatbotId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid chatbot ID' },
        { status: 400 }
      );
    }

    const deleted = await chatbotsDB.deleteChatbot(chatbotId, userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Chatbot deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting chatbot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete chatbot',
      },
      { status: 500 }
    );
  }
}
