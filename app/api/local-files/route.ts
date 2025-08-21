import { NextRequest, NextResponse } from 'next/server';
import { 
  writeFile, 
  readFile, 
  deleteFile, 
  getFileStructure,
  runCommand,
  installPackages
} from '@/lib/local-file-system';

/**
 * GET handler for retrieving file structure
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectName = url.searchParams.get('project') || 'default';
    const filePath = url.searchParams.get('file');
    
    if (filePath) {
      // Read specific file
      const content = await readFile(projectName, filePath);
      return NextResponse.json({
        success: true,
        content,
        filePath
      });
    } else {
      // Get file structure
      const structure = await getFileStructure(projectName);
      return NextResponse.json({
        success: true,
        structure,
        projectName
      });
    }
  } catch (error: any) {
    console.error('[local-files] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get file information'
    }, { status: 500 });
  }
}

/**
 * POST handler for creating/updating files
 */
export async function POST(request: NextRequest) {
  try {
    const { projectName = 'default', filePath, content } = await request.json();
    
    if (!filePath || content === undefined) {
      return NextResponse.json({
        success: false,
        error: 'File path and content are required'
      }, { status: 400 });
    }
    
    await writeFile(projectName, filePath, content);
    
    return NextResponse.json({
      success: true,
      message: `File ${filePath} created/updated successfully`
    });
  } catch (error: any) {
    console.error('[local-files] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create/update file'
    }, { status: 500 });
  }
}

/**
 * DELETE handler for removing files
 */
export async function DELETE(request: NextRequest) {
  try {
    const { projectName = 'default', filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 });
    }
    
    await deleteFile(projectName, filePath);
    
    return NextResponse.json({
      success: true,
      message: `File ${filePath} deleted successfully`
    });
  } catch (error: any) {
    console.error('[local-files] DELETE Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete file'
    }, { status: 500 });
  }
}
