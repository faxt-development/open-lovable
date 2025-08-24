import { NextRequest, NextResponse } from 'next/server';
import { isDevServerRunning } from '@/lib/local-file-system';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portParam = searchParams.get('port');
    const port = portParam ? Number(portParam) : 3000;

    const running = await isDevServerRunning(port);

    return NextResponse.json({ success: true, running, port });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check dev server status' },
      { status: 500 }
    );
  }
}
