import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import type { LocalProjectState } from '@/types/local-project';

declare global {
  var localProjectState: LocalProjectState;
}

export async function POST(request: NextRequest) {
  try {
    const { packages, projectName } = await request.json();
    
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Packages array is required' 
      }, { status: 400 });
    }
    
    // Validate and deduplicate package names
    const validPackages = [...new Set(packages)]
      .filter(pkg => pkg && typeof pkg === 'string' && pkg.trim() !== '')
      .map(pkg => pkg.trim());
    
    if (validPackages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid package names provided'
      }, { status: 400 });
    }
    
    // Log if duplicates were found
    if (packages.length !== validPackages.length) {
      console.log(`[install-packages] Cleaned packages: removed ${packages.length - validPackages.length} invalid/duplicate entries`);
      console.log(`[install-packages] Original:`, packages);
      console.log(`[install-packages] Cleaned:`, validPackages);
    }
    
    // Get project name from request or use default from global state
    const projectRoot = projectName || global.localProjectState?.projectData?.projectName || 'default';
    const projectDir = path.join(process.cwd(), 'projects', projectRoot);
    
    // Check if project directory exists
    if (!fs.existsSync(projectDir)) {
      console.error(`[install-packages] Project directory does not exist: ${projectDir}`);
      return NextResponse.json({ 
        success: false, 
        error: `Project directory not found: ${projectRoot}` 
      }, { status: 400 });
    }
    
    // Check if package.json exists
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error(`[install-packages] package.json not found in project: ${packageJsonPath}`);
      return NextResponse.json({ 
        success: false, 
        error: `package.json not found in project: ${projectRoot}` 
      }, { status: 400 });
    }
    
    console.log('[install-packages] Installing packages:', packages);
    
    // Create a response stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Function to send progress updates
    const sendProgress = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };
    
    // Create promisified exec function
    const execPromise = util.promisify(exec);
    
    // Start installation in background and return the stream immediately
    (async () => {
      try {
        await sendProgress({ 
          type: 'start', 
          message: `Installing ${validPackages.length} package${validPackages.length > 1 ? 's' : ''}...`,
          packages: validPackages 
        });
        
        // Check which packages are already installed
        await sendProgress({ 
          type: 'status', 
          message: 'Checking installed packages...' 
        });
        
        // Read package.json to check installed packages
        let packagesToInstall = validPackages;
        let alreadyInstalledPackages: string[] = [];
        
        try {
          const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
          const packageJson = JSON.parse(packageJsonContent);
          
          // Combine dependencies and devDependencies
          const dependencies = packageJson.dependencies || {};
          const devDependencies = packageJson.devDependencies || {};
          const allDeps = { ...dependencies, ...devDependencies };
          
          // Check which packages need to be installed
          alreadyInstalledPackages = [];
          packagesToInstall = [];
          
          for (const pkg of validPackages) {
            // Handle scoped packages and extract package name without version
            const pkgName = pkg.startsWith('@') ? pkg : pkg.split('@')[0];
            
            if (pkgName in allDeps) {
              alreadyInstalledPackages.push(pkgName);
            } else {
              packagesToInstall.push(pkg);
            }
          }
          
          console.log(`[install-packages] Already installed: ${alreadyInstalledPackages.join(', ')}`);
          console.log(`[install-packages] Need to install: ${packagesToInstall.join(', ')}`);
          
        } catch (error) {
          console.error(`[install-packages] Error checking packages:`, error);
          // If we can't check, just try to install all packages
          packagesToInstall = validPackages;
        }
        
        if (packagesToInstall.length === 0) {
          await sendProgress({ 
            type: 'success', 
            message: 'All packages are already installed',
            installedPackages: [],
            alreadyInstalled: validPackages
          });
          await writer.close();
          return;
        }
        
        // Only send the npm install command message if we're actually installing new packages
        await sendProgress({ 
          type: 'info', 
          message: `Installing ${packagesToInstall.length} new package(s): ${packagesToInstall.join(', ')}`
        });
        
        // Prepare npm install command
        const packageList = packagesToInstall.join(' ');
        const npmCommand = `npm install --legacy-peer-deps ${packageList}`;
        
        console.log(`[install-packages] Running command: ${npmCommand} in directory: ${projectDir}`);
        
        try {
          // Execute npm install command
          const { stdout, stderr } = await execPromise(npmCommand, {
            cwd: projectDir,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large outputs
            timeout: 60000 // 60 second timeout
          });
          
          // Process stdout
          const npmOutputLines = stdout.split('\n').filter(line => line.trim());
          for (const line of npmOutputLines) {
            if (line.trim() && !line.includes('undefined')) {
              await sendProgress({ type: 'output', message: line });
            }
          }
          
          // Process stderr (warnings, etc)
          if (stderr) {
            const stderrLines = stderr.split('\n').filter(line => line.trim());
            for (const line of stderrLines) {
              if (line.includes('ERESOLVE')) {
                await sendProgress({ 
                  type: 'warning', 
                  message: `Dependency conflict resolved with --legacy-peer-deps: ${line}` 
                });
              } else if (line.includes('npm WARN')) {
                await sendProgress({ type: 'warning', message: line });
              } else if (line.trim()) {
                await sendProgress({ type: 'error', message: line });
              }
            }
          }
          
          // Verify packages were installed
          const installedPackages: string[] = [];
          
          // Read updated package.json to verify installation
          const updatedPackageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
          const updatedPackageJson = JSON.parse(updatedPackageJsonContent);
          const updatedDeps = updatedPackageJson.dependencies || {};
          
          for (const pkg of packagesToInstall) {
            const pkgName = pkg.startsWith('@') ? pkg : pkg.split('@')[0];
            if (pkgName in updatedDeps) {
              installedPackages.push(pkgName);
              console.log(`[install-packages] ✓ Verified ${pkgName}`);
              await sendProgress({ type: 'output', message: `✓ Verified ${pkgName}` });
            } else {
              console.log(`[install-packages] ✗ Package ${pkgName} not found in dependencies`);
              await sendProgress({ type: 'warning', message: `✗ Package ${pkgName} not found in dependencies` });
            }
          }
        
          if (installedPackages.length > 0) {
            await sendProgress({ 
              type: 'success', 
              message: `Successfully installed: ${installedPackages.join(', ')}`,
              installedPackages 
            });
          } else {
            await sendProgress({ 
              type: 'error', 
              message: 'Failed to verify package installation' 
            });
          }
          
          // Log message about dev server restart (actual restart handled by client)
          await sendProgress({ type: 'status', message: 'Development server will need to be restarted to use the new packages' });
          
          console.log('[install-packages] Notifying client that packages are installed and server restart is recommended');
          
          await sendProgress({ 
            type: 'complete', 
            message: 'Package installation complete and dev server restarted!',
            installedPackages 
          });
          
        } catch (error) {
          console.error(`[install-packages] Error during npm install:`, error);
          await sendProgress({ 
            type: 'error', 
            message: `Error installing packages: ${(error as Error).message}` 
          });
        }
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage && errorMessage !== 'undefined') {
          await sendProgress({ 
            type: 'error', 
            message: errorMessage
          });
        }
      } finally {
        await writer.close();
      }
    })();
    
    // Return the stream immediately
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('[install-packages] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}