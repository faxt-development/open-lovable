/**
 * Local file system operations
 * Replaces sandbox file operations with direct Node.js file system access
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Project root directory - can be configured based on your needs
const PROJECT_ROOT = process.env.PROJECT_ROOT || './projects';

/**
 * Ensure the project directory exists
 */
export async function ensureProjectDirectory(projectName: string): Promise<string> {
  const projectDir = path.join(PROJECT_ROOT, projectName);
  
  if (!fs.existsSync(PROJECT_ROOT)) {
    fs.mkdirSync(PROJECT_ROOT, { recursive: true });
  }
  
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  
  return projectDir;
}

/**
 * Create or update a file
 */
export async function writeFile(projectName: string, filePath: string, content: string): Promise<void> {
  const projectDir = await ensureProjectDirectory(projectName);
  const fullPath = path.join(projectDir, filePath);
  
  // Ensure directory exists
  const dirname = path.dirname(fullPath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(fullPath, content);
}

/**
 * Read a file
 */
export async function readFile(projectName: string, filePath: string): Promise<string> {
  const projectDir = await ensureProjectDirectory(projectName);
  const fullPath = path.join(projectDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Delete a file
 */
export async function deleteFile(projectName: string, filePath: string): Promise<void> {
  const projectDir = await ensureProjectDirectory(projectName);
  const fullPath = path.join(projectDir, filePath);
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * Get file structure
 */
export async function getFileStructure(projectName: string): Promise<any> {
  const projectDir = await ensureProjectDirectory(projectName);
  
  function buildStructure(dir: string, basePath: string = ''): any {
    const result: Record<string, any> = {};
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        result[item] = buildStructure(fullPath, relativePath);
      } else {
        result[item] = {
          type: 'file',
          size: stats.size,
          lastModified: stats.mtime.getTime()
        };
      }
    }
    
    return result;
  }
  
  return buildStructure(projectDir);
}

/**
 * Run a command in the project directory
 */
export async function runCommand(projectName: string, command: string): Promise<{stdout: string; stderr: string}> {
  const projectDir = await ensureProjectDirectory(projectName);
  
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: projectDir });
    return { stdout, stderr };
  } catch (error: any) {
    return { 
      stdout: error.stdout || '', 
      stderr: error.stderr || error.message || 'Command execution failed' 
    };
  }
}

/**
 * Install npm packages
 */
export async function installPackages(projectName: string, packages: string[]): Promise<{success: boolean; output: string}> {
  if (!packages || packages.length === 0) {
    return { success: true, output: 'No packages to install' };
  }
  
  const projectDir = await ensureProjectDirectory(projectName);
  const packageList = packages.join(' ');
  const command = `npm install ${packageList} --save`;
  
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: projectDir });
    return { 
      success: true, 
      output: stdout + (stderr ? `\n${stderr}` : '') 
    };
  } catch (error: any) {
    return { 
      success: false, 
      output: error.message || 'Failed to install packages' 
    };
  }
}

/**
 * Start development server
 */
export async function startDevServer(projectName: string): Promise<{success: boolean; port: number; output: string}> {
  const projectDir = await ensureProjectDirectory(projectName);
  const port = 5173; // Use Vite default port to avoid conflict with Next.js app on 3000
  
  try {
    // Check if package.json exists
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }
    
    // Start the dev server in background (use pnpm for consistency)
    const command = `pnpm run dev -- --port ${port} > dev-server.log 2>&1 &`;
    await execAsync(command, { cwd: projectDir });
    
    return {
      success: true,
      port,
      output: `Development server started on port ${port}`
    };
  } catch (error: any) {
    return {
      success: false,
      port: 0,
      output: error.message || 'Failed to start development server'
    };
  }
}

/**
 * Stop development server
 */
export async function stopDevServer(projectName: string): Promise<{success: boolean; output: string}> {
  try {
    // Find and kill the process running on the dev server port
    const { stdout } = await execAsync(`lsof -i :5173 -t`);
    if (stdout.trim()) {
      await execAsync(`kill -9 ${stdout.trim()}`);
      return {
        success: true,
        output: 'Development server stopped'
      };
    }
    
    return {
      success: true,
      output: 'No development server running'
    };
  } catch (error: any) {
    return {
      success: false,
      output: error.message || 'Failed to stop development server'
    };
  }
}

/**
 * Check if development server is running on a given port
 */
export async function isDevServerRunning(port: number = 5173): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -t`);
    return Boolean(stdout.trim());
  } catch {
    return false;
  }
}
