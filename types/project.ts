// Global types for project file management

export interface ProjectFile {
  content: string;
  lastModified: number;
}

export interface ProjectFileCache {
  files: Record<string, ProjectFile>;
  lastSync: number;
  projectId: string;
  manifest?: any; // FileManifest type from file-manifest.ts
}

export interface ProjectState {
  fileCache: ProjectFileCache | null;
  project: any; // E2B project instance (formerly sandbox)
  projectData: {
    projectId: string;
    url: string;
  } | null;
}

// Declare global types
declare global {
  var activeProject: any;
  var projectState: ProjectState;
  var existingFiles: Set<string>;
}

export {};