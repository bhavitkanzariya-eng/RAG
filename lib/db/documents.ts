import { getPool } from './connection';

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

// Ensure documents table has all required columns
async function ensureDocumentsSchema(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Add file_type column if it doesn't exist
    await client.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
    `);
  } catch (error) {
    // Column might already exist, which is fine
    console.log('Schema check: file_type column ready');
  } finally {
    client.release();
  }
}

export async function createDocument(
  chatbotId: number,
  userId: string,
  fileName: string,
  originalFileName: string,
  fileType: string,
  fileSize: number,
  storagePath: string
): Promise<Document> {
  // IMPORTANT: Ensure schema is correct before inserting
  await ensureDocumentsSchema();

  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO documents (
        chatbot_id, user_id, file_name, original_file_name, file_type, file_size, storage_path, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
       RETURNING *`,
      [chatbotId, userId, fileName, originalFileName, fileType, fileSize, storagePath]
    );

    return result.rows[0] as Document;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getDocumentById(id: number): Promise<Document | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getDocumentsByChatbotId(chatbotId: number): Promise<Document[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT * FROM documents WHERE chatbot_id = $1 ORDER BY created_at DESC',
      [chatbotId]
    );
    return result.rows as Document[];
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function updateDocumentStatus(
  id: number,
  status: string,
  chunkCount?: number,
  errorMessage?: string
): Promise<Document> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    let query = 'UPDATE documents SET status = $1';
    const values: (string | number)[] = [status];

    if (chunkCount !== undefined) {
      query += `, chunk_count = $${values.length + 1}`;
      values.push(chunkCount);
    }

    if (errorMessage !== undefined) {
      query += `, error_message = $${values.length + 1}`;
      values.push(errorMessage);
    }

    query += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await client.query(query, values);
    return result.rows[0] as Document;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteDocument(id: number): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      'DELETE FROM documents WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function verifyDocumentOwnership(
  documentId: number,
  userId: string
): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error verifying document ownership:', error);
    throw error;
  } finally {
    client.release();
  }
}
