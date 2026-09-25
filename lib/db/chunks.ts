import { getPool } from './connection';

export interface DocumentChunk {
  id: number;
  document_id: number;
  chatbot_id: number;
  content: string;
  page_number: number | null;
  section_title: string | null;
  chunk_index: number;
  created_at: string;
}

export async function createChunk(
  documentId: number,
  chatbotId: number,
  content: string,
  embedding: number[],
  pageNumber?: number,
  sectionTitle?: string,
  chunkIndex?: number
): Promise<DocumentChunk> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO document_chunks (
        document_id, chatbot_id, content, content_embedding,
        page_number, section_title, chunk_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, document_id, chatbot_id, content, page_number, section_title, chunk_index, created_at`,
      [
        documentId,
        chatbotId,
        content,
        JSON.stringify(embedding),
        pageNumber || null,
        sectionTitle || null,
        chunkIndex || 0,
      ]
    );

    return result.rows[0] as DocumentChunk;
  } catch (error) {
    console.error('Error creating chunk:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteChunksByDocumentId(documentId: number): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(
      'DELETE FROM document_chunks WHERE document_id = $1',
      [documentId]
    );
  } catch (error) {
    console.error('Error deleting chunks:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function similaritySearch(
  chatbotId: number,
  embedding: number[],
  limit: number = 5,
  threshold: number = 0.75
): Promise<Array<DocumentChunk & { similarity: number }>> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT
        id, document_id, chatbot_id, content, page_number, section_title, chunk_index, created_at,
        1 - (content_embedding <=> $2::vector) as similarity
       FROM document_chunks
       WHERE chatbot_id = $1
       AND (1 - (content_embedding <=> $2::vector)) > $3
       ORDER BY content_embedding <=> $2::vector
       LIMIT $4`,
      [chatbotId, JSON.stringify(embedding), threshold, limit]
    );

    return result.rows as Array<DocumentChunk & { similarity: number }>;
  } catch (error) {
    console.error('Error performing similarity search:', error);
    throw error;
  } finally {
    client.release();
  }
}
