// Global types for local project file management

export interface LocalProjectFile {
  content: string;
  lastModified: number;
}

export interface LocalProjectFileCache {
  files: Record<string, LocalProjectFile>;
  lastSync: number;
  projectName: string;
  manifest?: any; // FileManifest type from file-manifest.ts
}

export interface LocalProjectState {
  fileCache: LocalProjectFileCache | null;
  projectData: {
    projectName: string;
    url: string;
    port: number;
  } | null;
  devServerStatus: {
    isRunning: boolean;
    port: number;
    url: string;
  } | null;
}

// Declare global types
declare global {
  var activeProject: any;
  var localProjectState: LocalProjectState;
  var existingFiles: Set<string>;
}

export {};
