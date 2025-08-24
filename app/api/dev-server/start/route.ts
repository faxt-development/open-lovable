import { NextRequest, NextResponse } from 'next/server';
import { startDevServer } from '@/lib/local-file-system';

export async function POST(request: NextRequest) {
  try {
    const { projectName = 'default-project' } = await request.json();
    const result = await startDevServer(projectName);
    return NextResponse.json({
      success: result.success,
      port: result.port,
      output: result.output
    }, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error('[dev-server/start] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to start dev server' }, { status: 500 });
  }
}
