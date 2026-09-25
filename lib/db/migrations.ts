import { getPool } from './connection';

const SCHEMA_SQL = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Chatbots table
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

-- Documents table
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

-- Document chunks with embeddings
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

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  chatbot_id INT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_chatbot_id ON documents(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chatbot_id ON document_chunks(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Vector search index
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);
`;

export async function runMigrations(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔧 Running database migrations...');
    await client.query(SCHEMA_SQL);
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function dropAllTables(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🗑️  Dropping all tables...');
    await client.query(`
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
      DROP TABLE IF EXISTS document_chunks CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS chatbots CASCADE;
    `);
    console.log('✅ All tables dropped');
  } catch (error) {
    console.error('❌ Drop failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
