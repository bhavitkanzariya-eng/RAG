# Phase 2: Database Setup - PostgreSQL + Neon

## Objective
Set up PostgreSQL database with proper schema for RAG system.

## Architecture

### Database: Neon (Free PostgreSQL)
- Connection string already in .env from earlier
- pgvector extension for embeddings

### Schema Design

```sql
-- Users (managed by Clerk, we store refs)
-- Will store user_id from Clerk

-- Chatbots
CREATE TABLE chatbots (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,  -- From Clerk
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model VARCHAR(100),
  temperature DECIMAL(3,2),
  top_k INT,
  similarity_threshold DECIMAL(3,2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  chatbot_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  original_file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INT,
  storage_path VARCHAR(500),
  status VARCHAR(50),
  chunk_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
);

-- Document Chunks (with vectors for similarity search)
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL,
  chatbot_id INT NOT NULL,
  content TEXT NOT NULL,
  content_embedding vector(1536),  -- OpenAI text-embedding-3-small
  page_number INT,
  section_title VARCHAR(255),
  chunk_index INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
);

-- Conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  chatbot_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
);

-- Messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL,
  chatbot_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(20),  -- 'user' or 'assistant'
  content TEXT NOT NULL,
  sources JSONB,  -- Array of document references
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX idx_documents_chatbot_id ON documents(chatbot_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_chatbot_id ON document_chunks(chatbot_id);
CREATE INDEX idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- pgvector extension (for similarity search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector search index
CREATE INDEX ON document_chunks USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);
```

## What Phase 2 Will Do

1. ✅ Create database schema
2. ✅ Test database connection
3. ✅ Test basic CRUD operations
4. ✅ Verify all tables created correctly
5. ✅ Document and commit

## Files to Create/Modify

```
lib/
  db/
    ├── init.ts          (Database initialization)
    ├── migrations.ts    (Schema creation)
    └── connection.ts    (Database connection)
```

## Success Criteria

- [ ] Database connection successful
- [ ] All tables created
- [ ] Indexes created
- [ ] Can insert test data
- [ ] Can query test data
- [ ] No errors in logs
