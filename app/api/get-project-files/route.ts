import { NextResponse } from 'next/server';

declare global {
  // Active E2B project instance
  var activeProject: any;
}

export async function GET() {
  try {
    if (!global.activeProject) {
      return NextResponse.json({
        success: false,
        error: 'No active project'
      }, { status: 400 });
    }

    // Walk the project directory and collect files
    const result = await global.activeProject.runCode(`
import os
import json

root_dir = '/home/user/app'
max_size = 200 * 1024  # 200 KB cap to avoid huge files
exclude_dirs = {'.git', 'node_modules', '.next', 'dist', 'build', '.turbo'}

files = {}
manifest = None

for dirpath, dirnames, filenames in os.walk(root_dir):
    # Filter directories in-place
    dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
    for filename in filenames:
        path = os.path.join(dirpath, filename)
        rel = os.path.relpath(path, root_dir)
        try:
            # Skip very large files
            if os.path.getsize(path) > max_size:
                continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                files[rel] = content
        except Exception:
            # Ignore unreadable/binary files
            pass

# Attempt to read a manifest if one exists in cache locations
for candidate in ['file-manifest.json', '.manifest.json']:
    p = os.path.join(root_dir, candidate)
    if os.path.exists(p):
        try:
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                manifest = json.load(f)
            break
        except Exception:
            manifest = None

print(json.dumps({ 'success': True, 'files': files, 'manifest': manifest }))
`);

    const stdout = (result?.logs?.stdout || []).join('').trim();
    if (!stdout) {
      return NextResponse.json({ success: false, error: 'Failed to read project files' }, { status: 500 });
    }

    let data: any;
    try {
      data = JSON.parse(stdout);
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed project files output' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[get-project-files] Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
