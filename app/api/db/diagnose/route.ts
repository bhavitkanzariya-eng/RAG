import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db/connection';

export async function GET() {
  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // 1. Check if documents table exists
      const tableResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'documents'
        ) as table_exists;
      `);

      const tableExists = tableResult.rows[0]?.table_exists;

      // 2. Get all columns in documents table
      let columns: any[] = [];
      if (tableExists) {
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'documents'
          ORDER BY ordinal_position;
        `);
        columns = columnsResult.rows;
      }

      // 3. Check specifically for file_type column
      const fileTypeResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'documents' AND column_name = 'file_type'
        ) as file_type_exists;
      `);

      const fileTypeExists = fileTypeResult.rows[0]?.file_type_exists;

      // 4. Try to add file_type if it doesn't exist
      let addColumnResult = { success: false, message: 'Not attempted' };
      if (!fileTypeExists) {
        try {
          await client.query(`
            ALTER TABLE documents ADD COLUMN file_type VARCHAR(50);
          `);
          addColumnResult = { success: true, message: 'file_type column added successfully' };
        } catch (addError) {
          addColumnResult = {
            success: false,
            message: addError instanceof Error ? addError.message : 'Unknown error adding column'
          };
        }
      }

      return NextResponse.json({
        success: true,
        database: {
          tableExists,
          fileTypeExists: fileTypeExists || addColumnResult.success,
          columns: columns.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable
          }))
        },
        migration: addColumnResult,
        timestamp: new Date().toISOString()
      }, { status: 200 });

    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      console.log('🔧 Running comprehensive database fix...');

      // Step 1: Ensure pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('✅ pgvector extension enabled');

      // Step 2: Create chatbots table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS chatbots (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          system_prompt TEXT,
          model VARCHAR(100) DEFAULT 'gpt-4o-mini',
          temperature DECIMAL(3,2) DEFAULT 0.7,
          top_k INT DEFAULT 5,
          similarity_threshold DECIMAL(3,2) DEFAULT 0.75,
          status VARCHAR(50) DEFAULT 'ACTIVE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ chatbots table ready');

      // Step 3: Create documents table
      await client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id SERIAL PRIMARY KEY,
          chatbot_id INT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          file_name VARCHAR(255),
          original_file_name VARCHAR(255),
          file_type VARCHAR(50),
          file_size INT,
          storage_path VARCHAR(500),
          status VARCHAR(50) DEFAULT 'PENDING',
          chunk_count INT DEFAULT 0,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ documents table ready');

      // Step 4: Add file_type column if missing
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'documents' AND column_name = 'file_type'
        ) as exists;
      `);

      if (!checkResult.rows[0].exists) {
        await client.query(`
          ALTER TABLE documents ADD COLUMN file_type VARCHAR(50);
        `);
        console.log('✅ file_type column added');
      } else {
        console.log('✅ file_type column already exists');
      }

      // Step 5: Create document_chunks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id SERIAL PRIMARY KEY,
          document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          chatbot_id INT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          content_embedding vector(1536),
          page_number INT,
          section_title VARCHAR(255),
          chunk_index INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ document_chunks table ready');

      // Step 6: Create conversations and messages tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          chatbot_id INT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          title VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          chatbot_id INT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL,
          content TEXT NOT NULL,
          sources JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ conversations and messages tables ready');

      // Step 7: Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
        CREATE INDEX IF NOT EXISTS idx_documents_chatbot_id ON documents(chatbot_id);
        CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
        CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
        CREATE INDEX IF NOT EXISTS idx_chunks_chatbot_id ON document_chunks(chatbot_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      `);
      console.log('✅ indexes created');

      return NextResponse.json({
        success: true,
        message: 'Database completely fixed and ready',
        timestamp: new Date().toISOString()
      }, { status: 200 });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
