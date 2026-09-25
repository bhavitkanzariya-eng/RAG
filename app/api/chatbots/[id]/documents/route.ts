import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as documentsDB from '@/lib/db/documents';
import * as chatbotsDB from '@/lib/db/chatbots';
import { getPool } from '@/lib/db/connection';

// Helper function to ensure file_type column exists
async function ensureFileTypeColumn() {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query(
        `ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);`
      );
      console.log('✅ file_type column ensured');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error ensuring file_type column:', error);
  }
}

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

    // Verify ownership
    const chatbot = await chatbotsDB.getChatbotById(chatbotId, userId);
    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: 'Chatbot not found or unauthorized' },
        { status: 403 }
      );
    }

    const documents = await documentsDB.getDocumentsByChatbotId(chatbotId);

    return NextResponse.json(
      { success: true, data: documents },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch documents',
      },
      { status: 500 }
    );
  }
}

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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const fileSize = file.size;
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800');

    if (fileSize > maxSize) {
      return NextResponse.json(
        { success: false, error: `File size exceeds maximum of ${maxSize} bytes` },
        { status: 400 }
      );
    }

    // Create document record
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomStr}-${file.name}`;
    const filePath = `/documents/${chatbotId}/${fileName}`;

    try {
      const document = await documentsDB.createDocument(
        chatbotId,
        userId,
        fileName,
        file.name,
        file.type,
        fileSize,
        filePath
      );

      return NextResponse.json(
        { success: true, data: document, message: 'Document uploaded successfully' },
        { status: 201 }
      );
    } catch (createError) {
      // If error is about missing file_type column, try to add it and retry
      const errorMessage = createError instanceof Error ? createError.message : '';
      if (errorMessage.includes('file_type') || errorMessage.includes('does not exist')) {
        console.log('📝 Attempting to add missing file_type column...');
        await ensureFileTypeColumn();

        // Retry creating the document
        const document = await documentsDB.createDocument(
          chatbotId,
          userId,
          fileName,
          file.name,
          file.type,
          fileSize,
          filePath
        );

        return NextResponse.json(
          { success: true, data: document, message: 'Document uploaded successfully' },
          { status: 201 }
        );
      }
      throw createError;
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document',
      },
      { status: 500 }
    );
  }
}
