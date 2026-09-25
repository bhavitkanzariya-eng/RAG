import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db/connection';
import { runMigrations } from '@/lib/db/migrations';

export async function POST() {
  try {
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();

    if (!connected) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    console.log('✅ Database connected');

    console.log('🔧 Running migrations...');
    await runMigrations();
    console.log('✅ Migrations completed');

    return NextResponse.json(
      {
        success: true,
        message: 'Database initialized successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
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
    const connected = await testConnection();

    return NextResponse.json(
      {
        success: connected,
        status: connected ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString(),
      },
      { status: connected ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database check failed',
      },
      { status: 500 }
    );
  }
}
