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
    defaultModel: 'openai/gpt-4-turbo',
    
    // Available models
    availableModels: [
      // OpenAI
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      // Anthropic (direct)
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'anthropic/claude-3-opus',
      // Google
      'google/gemini-pro',
      // Groq
      'groq/llama3-70b',
      'groq/llama3-8b',
      'groq/mixtral-8x7b',
      // AWS Bedrock
      'bedrock/claude-3-sonnet',
      'bedrock/claude-3-haiku',
      'bedrock/claude-2',
      'bedrock/titan-text-express',
      'bedrock/titan-text-lite'
    ],
    
    // Model display names
    modelDisplayNames: {
      // OpenAI
      'openai/gpt-4-turbo': 'GPT-4 Turbo',
      'openai/gpt-4': 'GPT-4',
      'openai/gpt-3.5-turbo': 'GPT-3.5 Turbo',
      // Anthropic (direct)
      'anthropic/claude-3-opus': 'Claude 3 Opus',
      'anthropic/claude-3-sonnet': 'Claude 3 Sonnet',
      'anthropic/claude-3-haiku': 'Claude 3 Haiku',
      // Google
      'google/gemini-pro': 'Gemini Pro',
      // Groq
      'groq/llama3-70b': 'Groq: Llama3 70B',
      'groq/llama3-8b': 'Groq: Llama3 8B',
      'groq/mixtral-8x7b': 'Groq: Mixtral 8x7B',
      // AWS Bedrock
      'bedrock/claude-3-sonnet': 'Bedrock: Claude 3 Sonnet',
      'bedrock/claude-3-haiku': 'Bedrock: Claude 3 Haiku',
      'bedrock/claude-2': 'Bedrock: Claude 2',
      'bedrock/titan-text-express': 'Bedrock: Titan Text Express',
      'bedrock/titan-text-lite': 'Bedrock: Titan Text Lite'
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