import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as chatbotsDB from '@/lib/db/chatbots';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const chatbots = await chatbotsDB.getChatbotsByUserId(userId);

    return NextResponse.json(
      {
        success: true,
        data: chatbots,
        count: chatbots.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching chatbots:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chatbots',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chatbot name is required' },
        { status: 400 }
      );
    }

    const chatbot = await chatbotsDB.createChatbot(userId, body);

    return NextResponse.json(
      {
        success: true,
        data: chatbot,
        message: 'Chatbot created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating chatbot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create chatbot',
      },
      { status: 500 }
    );
  }
}
