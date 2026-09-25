import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as documentsDB from '@/lib/db/documents';
import * as chunksDB from '@/lib/db/chunks';

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
    const documentId = parseInt(id);

    // Verify ownership
    const hasAccess = await documentsDB.verifyDocumentOwnership(documentId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Document not found or unauthorized' },
        { status: 403 }
      );
    }

    const document = await documentsDB.getDocumentById(documentId);
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete chunks first (cascade)
    await chunksDB.deleteChunksByDocumentId(documentId);

    // Delete document from database
    const deleted = await documentsDB.deleteDocument(documentId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Document deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document',
      },
      { status: 500 }
    );
  }
}
