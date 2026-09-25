import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db/connection';

export async function POST() {
  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      console.log('🔧 Fixing database schema...');

      // Add file_type column if missing
      await client.query(`
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
      `);
      console.log('✅ file_type column added/verified');

      return NextResponse.json(
        {
          success: true,
          message: 'Database schema fixed successfully',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Check if file_type column exists
      const result = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'file_type';
      `);

      const exists = result.rows.length > 0;

      if (!exists) {
        // Try to add it
        await client.query(`
          ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
        `);
        console.log('✅ file_type column created');
      }

      return NextResponse.json(
        {
          success: true,
          fileTypeColumnExists: result.rows.length > 0,
          message: result.rows.length > 0 ? 'file_type column exists' : 'file_type column created',
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
