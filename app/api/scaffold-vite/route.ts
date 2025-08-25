import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { startDevServer } from '@/lib/local-file-system';

const execAsync = util.promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('[scaffold-vite] Incoming request to scaffold Vite app');
    const { projectName = 'default-project', template = 'react' } = await request.json();
    console.log('[scaffold-vite] Params:', { projectName, template });

    const projectsRoot = path.join(process.cwd(), 'projects');
    const projectDir = path.join(projectsRoot, projectName);
    console.log('[scaffold-vite] Resolved paths:', { projectsRoot, projectDir, cwd: process.cwd() });

    // Ensure projects directory exists
    try {
      fs.mkdirSync(projectsRoot, { recursive: true });
      console.log('[scaffold-vite] Ensured projects root exists');
    } catch (e) {
      console.error('[scaffold-vite] Failed to ensure projects root:', e);
      return NextResponse.json({ success: false, error: 'Failed to create projects root' }, { status: 500 });
    }

    // Determine if project already scaffolded
    const packageJsonPath = path.join(projectDir, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);
    console.log('[scaffold-vite] package.json exists?', hasPackageJson, 'at', packageJsonPath);

    if (!hasPackageJson) {
      // If the target dir doesn't exist, create it so we can run create-vite with a folder target
      const projectDirExists = fs.existsSync(projectDir);
      console.log('[scaffold-vite] projectDir exists?', projectDirExists);
      if (!projectDirExists) {
        try {
          fs.mkdirSync(projectDir, { recursive: true });
          console.log('[scaffold-vite] Created project directory');
        } catch (e) {
          console.error('[scaffold-vite] Failed to create project directory:', e);
          return NextResponse.json({ success: false, error: 'Failed to create project directory' }, { status: 500 });
        }
      }

      // If directory is non-empty, scaffold into a temp directory and merge
      const entries = fs.readdirSync(projectDir);
      const isEmpty = entries.length === 0;
      console.log('[scaffold-vite] Target directory empty?', isEmpty, 'entries:', entries);

      const tempName = `${projectName}-scaffold-${Date.now()}`;
      const scaffoldTarget = isEmpty ? projectName : tempName;
      const scaffoldDestDir = path.join(projectsRoot, scaffoldTarget);

      // Use pnpm create vite to scaffold into the chosen target
      const scaffoldCmd = `pnpm create vite@latest ${scaffoldTarget} -- --template ${template}`;
      console.log('[scaffold-vite] Running scaffold command:', scaffoldCmd, 'cwd:', projectsRoot);
      const { stdout: scaffoldOut, stderr: scaffoldErr } = await execAsync(scaffoldCmd, { cwd: projectsRoot, maxBuffer: 1024 * 1024 * 50, timeout: 5 * 60 * 1000 });
      console.log('[scaffold-vite] Scaffold stdout (first 500 chars):', (scaffoldOut || '').slice(0, 500));
      if (scaffoldErr) console.warn('[scaffold-vite] Scaffold stderr (first 500 chars):', scaffoldErr.slice(0, 500));
      if (scaffoldErr) {
        // create-vite prints some info to stderr; treat only hard failures as errors
        const hardError = /ERR|Error|failed/i.test(scaffoldErr) && !/pnpm notice/i.test(scaffoldErr);
        if (hardError) {
          return NextResponse.json({ success: false, error: scaffoldErr }, { status: 500 });
        }
      }

      // If we scaffolded to a temp directory, merge into projectDir
      if (!isEmpty) {
        console.log('[scaffold-vite] Merging scaffolded project from temp into existing directory');

        const copyRecursive = (src: string, dest: string) => {
          const items = fs.readdirSync(src, { withFileTypes: true });
          for (const item of items) {
            if (item.name === 'node_modules' || item.name === '.git') continue;
            const srcPath = path.join(src, item.name);
            const destPath = path.join(dest, item.name);
            if (item.isDirectory()) {
              if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
              copyRecursive(srcPath, destPath);
            } else {
              if (fs.existsSync(destPath)) {
                console.log('[scaffold-vite] Skip existing file:', path.relative(projectDir, destPath));
                continue; // Do not overwrite existing files
              }
              fs.copyFileSync(srcPath, destPath);
              console.log('[scaffold-vite] Copied file:', path.relative(projectDir, destPath));
            }
          }
        };

        try {
          copyRecursive(scaffoldDestDir, projectDir);
          console.log('[scaffold-vite] Merge complete');
        } catch (e) {
          console.error('[scaffold-vite] Failed to merge scaffolded files:', e);
          return NextResponse.json({ success: false, error: 'Failed to merge scaffolded files' }, { status: 500 });
        } finally {
          try {
            fs.rmSync(scaffoldDestDir, { recursive: true, force: true });
            console.log('[scaffold-vite] Removed temp scaffold directory');
          } catch (e) {
            console.warn('[scaffold-vite] Failed to remove temp scaffold directory:', e);
          }
        }
      }

      // Install dependencies in the project directory
      const installCmd = 'pnpm install';
      console.log('[scaffold-vite] Installing dependencies with:', installCmd, 'cwd:', projectDir);
      const { stdout: installOut, stderr: installErr } = await execAsync(installCmd, { cwd: projectDir, maxBuffer: 1024 * 1024 * 50, timeout: 10 * 60 * 1000 });
      console.log('[scaffold-vite] Install stdout (first 500 chars):', (installOut || '').slice(0, 500));
      if (installErr) console.warn('[scaffold-vite] Install stderr (first 500 chars):', installErr.slice(0, 500));

      // Optional: Install and configure Tailwind CSS if not already present
      try {
        const devDepsInstallCmd = 'pnpm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer';
        console.log('[scaffold-vite] Installing Tailwind dev deps with:', devDepsInstallCmd, 'cwd:', projectDir);
        const { stdout: devDepsOut, stderr: devDepsErr } = await execAsync(devDepsInstallCmd, { cwd: projectDir, maxBuffer: 1024 * 1024 * 50, timeout: 10 * 60 * 1000 });
        console.log('[scaffold-vite] Tailwind deps install stdout (first 500 chars):', (devDepsOut || '').slice(0, 500));
        if (devDepsErr) console.warn('[scaffold-vite] Tailwind deps install stderr (first 500 chars):', devDepsErr.slice(0, 500));

        // Create Tailwind config if missing
        const tailwindConfigPath = path.join(projectDir, 'tailwind.config.cjs');
        if (!fs.existsSync(tailwindConfigPath)) {
          const tailwindConfig = `module.exports = {\n  content: [\n    \"./index.html\",\n    \"./src/**/*.{js,jsx,ts,tsx}\"\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n};\n`;
          fs.writeFileSync(tailwindConfigPath, tailwindConfig);
          console.log('[scaffold-vite] Created tailwind.config.cjs');
        }

        // Create PostCSS config if missing
        const postcssConfigPath = path.join(projectDir, 'postcss.config.cjs');
        if (!fs.existsSync(postcssConfigPath)) {
          const postcssConfig = `module.exports = {\n  plugins: {\n    '@tailwindcss/postcss': {},\n    autoprefixer: {},\n  },\n};\n`;
          fs.writeFileSync(postcssConfigPath, postcssConfig);
          console.log('[scaffold-vite] Created postcss.config.cjs');
        }

        // Ensure index.css references Tailwind (v4 style preferred)
        const indexCssPath = path.join(projectDir, 'src', 'index.css');
        if (fs.existsSync(indexCssPath)) {
          const css = fs.readFileSync(indexCssPath, 'utf8');
          const hasV4Import = /@import\s+["']tailwindcss["'];?/.test(css);
          const onlyV3Directives = /^\s*(?:@tailwind\s+(?:base|components|utilities);\s*)+$/m.test(css);

          if (!hasV4Import) {
            const baseLayer = `@layer base {\n  html, body, #root { height: 100%; }\n  body { @apply bg-white text-gray-900 antialiased; }\n}\n`;
            if (onlyV3Directives) {
              // Replace v3 directives-only file with v4 import and a small base layer
              const newCss = `@import "tailwindcss";\n\n${baseLayer}`;
              fs.writeFileSync(indexCssPath, newCss);
              console.log('[scaffold-vite] Rewrote src/index.css to Tailwind v4 import with base layer');
            } else {
              // Prepend v4 import to preserve any custom styles already present
              const newCss = `@import "tailwindcss";\n\n${css}`;
              fs.writeFileSync(indexCssPath, newCss);
              console.log('[scaffold-vite] Prepended Tailwind v4 import to src/index.css');
            }
          }
        }
      } catch (e) {
        // Non-fatal: if Tailwind setup fails, continue with the rest
        console.warn('[scaffold-vite] Tailwind setup skipped or failed:', e);
      }

      // Ensure a dev script exists (Vite template should include it)
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (!pkg.scripts || !pkg.scripts.dev) {
          pkg.scripts = { ...(pkg.scripts || {}), dev: 'vite' };
          fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
        }
        console.log('[scaffold-vite] Verified dev script in package.json');
      } catch (e) {
        // If package.json write fails, surface but continue to try starting server
        console.warn('[scaffold-vite] Failed to ensure dev script:', e);
      }
    }

    // Start the dev server (will use port 5173 inside startDevServer)
    console.log('[scaffold-vite] Starting dev server for project:', projectName);
    const start = await startDevServer(projectName);
    console.log('[scaffold-vite] startDevServer result:', start);
    if (!start.success) {
      return NextResponse.json({ success: false, error: start.output }, { status: 500 });
    }

    return NextResponse.json({ success: true, port: start.port, message: 'Vite app ready and dev server started' });
  } catch (error: any) {
    console.error('[scaffold-vite] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to scaffold Vite app' }, { status: 500 });
  }
}
