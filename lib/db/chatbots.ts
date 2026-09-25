import { getPool } from './connection';

export interface Chatbot {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  system_prompt: string | null;
  model: string;
  temperature: number;
  top_k: number;
  similarity_threshold: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChatbotRequest {
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
}

export async function createChatbot(
  userId: string,
  data: CreateChatbotRequest
): Promise<Chatbot> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO chatbots (user_id, name, description, system_prompt, model, temperature)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        data.name,
        data.description || null,
        data.system_prompt || null,
        data.model || 'gpt-4o-mini',
        data.temperature ?? 0.7,
      ]
    );

    return result.rows[0] as Chatbot;
  } catch (error) {
    console.error('Error creating chatbot:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getChatbotById(
  id: number,
  userId: string
): Promise<Chatbot | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT * FROM chatbots WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching chatbot:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getChatbotsByUserId(userId: string): Promise<Chatbot[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT * FROM chatbots WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows as Chatbot[];
  } catch (error) {
    console.error('Error fetching chatbots:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function updateChatbot(
  id: number,
  userId: string,
  data: Partial<CreateChatbotRequest>
): Promise<Chatbot> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const updates: string[] = [];
    const values: (string | number)[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.system_prompt !== undefined) {
      updates.push(`system_prompt = $${paramCount++}`);
      values.push(data.system_prompt);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const result = await client.query(
      `UPDATE chatbots SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );

    return result.rows[0] as Chatbot;
  } catch (error) {
    console.error('Error updating chatbot:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteChatbot(id: number, userId: string): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      'DELETE FROM chatbots WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error deleting chatbot:', error);
    throw error;
  } finally {
    client.release();
  }
}
