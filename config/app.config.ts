// Application Configuration
// This file contains all configurable settings for the application

export const appConfig = {
  // Local Development Configuration
  localDev: {
    // Default development server port
    defaultPort: 3000,
    
    // Time to wait for dev server to be ready (in milliseconds)
    startupDelay: 7000,
    
    // Time to wait for CSS rebuild (in milliseconds)
    cssRebuildDelay: 2000,
    
    // Status check interval (in milliseconds)
    statusCheckInterval: 5000,
    
    // Default project template (if using templates)
    defaultTemplate: undefined, // or specify a template ID
  },
  
  // AI Model Configuration
  ai: {
    // Default AI model
    defaultModel: 'moonshotai/kimi-k2-instruct',
    
    // Available models
    availableModels: [
      'openai/gpt-5',
      'moonshotai/kimi-k2-instruct',
      'anthropic/claude-sonnet-4-20250514',
      'google/gemini-2.5-pro',
      'bedrock/claude-3-sonnet',
      'bedrock/claude-3-haiku',
      'bedrock/claude-2',
      'bedrock/titan-text-express'
    ],
    
    // Model display names
    modelDisplayNames: {
      'openai/gpt-5': 'GPT-5',
      'moonshotai/kimi-k2-instruct': 'Kimi K2 Instruct',
      'anthropic/claude-sonnet-4-20250514': 'Sonnet 4',
      'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
      'bedrock/claude-3-sonnet': 'Bedrock: Claude 3 Sonnet',
      'bedrock/claude-3-haiku': 'Bedrock: Claude 3 Haiku',
      'bedrock/claude-2': 'Bedrock: Claude 2',
      'bedrock/titan-text-express': 'Bedrock: Titan Text Express'
    },
    
    // Temperature settings for non-reasoning models
    defaultTemperature: 0.7,
    
    // Max tokens for code generation
    maxTokens: 8000,
    
    // Max tokens for truncation recovery
    truncationRecoveryMaxTokens: 4000,
  },
  
  // Code Application Configuration
  codeApplication: {
    // Delay after applying code before refreshing iframe (milliseconds)
    defaultRefreshDelay: 2000,
    
    // Delay when packages are installed (milliseconds)
    packageInstallRefreshDelay: 5000,
    
    // Enable/disable automatic truncation recovery
    enableTruncationRecovery: false, // Disabled - too many false positives
    
    // Maximum number of truncation recovery attempts per file
    maxTruncationRecoveryAttempts: 1,
  },
  
  // UI Configuration
  ui: {
    // Show/hide certain UI elements
    showModelSelector: true,
    showStatusIndicator: true,
    
    // Animation durations (milliseconds)
    animationDuration: 200,
    
    // Toast notification duration (milliseconds)
    toastDuration: 3000,
    
    // Maximum chat messages to keep in memory
    maxChatMessages: 100,
    
    // Maximum recent messages to send as context
    maxRecentMessagesContext: 20,
  },
  
  // Development Configuration
  dev: {
    // Enable debug logging
    enableDebugLogging: true,
    
    // Enable performance monitoring
    enablePerformanceMonitoring: false,
    
    // Log API responses
    logApiResponses: true,
  },
  
  // Package Installation Configuration
  packages: {
    // Use --legacy-peer-deps flag for npm install
    useLegacyPeerDeps: true,
    
    // Package installation timeout (milliseconds)
    installTimeout: 60000,
    
    // Auto-restart Vite after package installation
    autoRestartVite: true,
  },
  
  // File Management Configuration
  files: {
    // Excluded file patterns (files to ignore)
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      '*.log',
      '.DS_Store'
    ],
    
    // Maximum file size to read (bytes)
    maxFileSize: 1024 * 1024, // 1MB
    
    // File extensions to treat as text
    textFileExtensions: [
      '.js', '.jsx', '.ts', '.tsx',
      '.css', '.scss', '.sass',
      '.html', '.xml', '.svg',
      '.json', '.yml', '.yaml',
      '.md', '.txt', '.env',
      '.gitignore', '.dockerignore'
    ],
  },
  
  // API Endpoints Configuration (for external services)
  api: {
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    
    // Request timeout (milliseconds)
    requestTimeout: 30000,
  }
};

// Type-safe config getter
export function getConfig<K extends keyof typeof appConfig>(key: K): typeof appConfig[K] {
  return appConfig[key];
}

// Helper to get nested config values
export function getConfigValue(path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key], appConfig as any);
}

export default appConfig;