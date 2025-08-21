import { NextRequest, NextResponse } from 'next/server';
import { startDevServer, stopDevServer, runCommand } from '@/lib/local-file-system';

/**
 * POST handler for starting/stopping dev server and running commands
 */
export async function POST(request: NextRequest) {
  try {
    const { action, projectName = 'default', command } = await request.json();
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required'
      }, { status: 400 });
    }
    
    switch (action) {
      case 'start':
        const startResult = await startDevServer(projectName);
        return NextResponse.json({
          success: startResult.success,
          port: startResult.port,
          output: startResult.output
        });
        
      case 'stop':
        const stopResult = await stopDevServer(projectName);
        return NextResponse.json({
          success: stopResult.success,
          output: stopResult.output
        });
        
      case 'run':
        if (!command) {
          return NextResponse.json({
            success: false,
            error: 'Command is required for "run" action'
          }, { status: 400 });
        }
        
        const runResult = await runCommand(projectName, command);
        return NextResponse.json({
          success: true,
          stdout: runResult.stdout,
          stderr: runResult.stderr
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[dev-server] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process request'
    }, { status: 500 });
  }
}
