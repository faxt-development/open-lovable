import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import fs from 'fs';
import path from 'path';

type BedrockModel = {
  // The logical identifier (e.g., foundation model ID like "anthropic.claude-3-7-sonnet-20250219-v1:0"
  // OR an ARN key when looked up by ARN)
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  // If present, this is the preferred target to send to Bedrock runtime.
  // In practice, we use the inference profile ARN here (stored from JSON as modelArn).
  invokeId?: string; // e.g., arn:aws:bedrock:...:inference-profile/...
};

function inferMaxTokens(providerName?: string): number {
  const p = (providerName || '').toLowerCase();
  if (p.includes('anthropic')) return 200000;
  if (p.includes('amazon') || p.includes('titan') || p.includes('nova')) return 8000;
  return 4000;
}

function loadBedrockModelsFromFile(): Record<string, BedrockModel> {
  const models: Record<string, BedrockModel> = {};
  try {
    const configuredPath = process.env.BEDROCK_ALLOWED_MODELS_PATH;
    const fallbackPath = path.join(process.cwd(), 'mybedrockaccess.json');
    const chosenPath = configuredPath && fs.existsSync(configuredPath)
      ? configuredPath
      : (fs.existsSync(fallbackPath) ? fallbackPath : undefined);
    if (!chosenPath) return models;
    const raw = fs.readFileSync(chosenPath, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      for (const item of data) {
        if (!item || typeof item !== 'object') continue;
        const modelArn: string | undefined = (item as any).modelArn; // In your data, this holds the inference profile ARN
        const modelId: string | undefined = (item as any).modelId;
        const modelName: string = ((item as any).modelName || modelId || modelArn || 'Unknown') as string;
        const providerName: string | undefined = (item as any).providerName;
        const maxTokens = inferMaxTokens(providerName);

        // Build a single canonical model entry and map it by both keys (id and arn) to ease lookup
        const base: BedrockModel = {
          id: modelId || modelArn || modelName,
          name: modelName,
          provider: providerName || 'Unknown',
          maxTokens,
          invokeId: modelArn || undefined,
        };

        if (modelId) models[modelId] = base;
        if (modelArn) models[modelArn] = base;
      }
    }
  } catch (e) {
    console.warn('[aws-bedrock] Failed to load models file:', (e as Error).message);
  }
  return models;
}

export const BEDROCK_MODELS: Record<string, BedrockModel> = loadBedrockModelsFromFile();

export interface BedrockStreamOptions {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class BedrockClient {
  private client: BedrockRuntimeClient;

  constructor(options: BedrockStreamOptions = {}) {
    const config = {
      region: options.region || process.env.AWS_REGION || 'us-east-1',
      credentials: options.credentials || {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    };

    this.client = new BedrockRuntimeClient(config);
  }

  async *streamText({
    modelId,
    messages,
    maxTokens = 4000,
    temperature = 0.7,
    topP = 0.9,
  }: {
    modelId: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  }) {
    // Try known models; if not present, infer sensible defaults based on identifier
    let model = BEDROCK_MODELS[modelId];
    if (!model) {
      const provider = this.detectProvider(modelId);
      model = {
        id: modelId,
        name: modelId,
        provider,
        maxTokens: inferMaxTokens(provider),
      };
    }

    // Decide what identifier to actually invoke with (prefer inference profile ARN if present)
    const invokeTarget = model.invokeId || model.id;

    // Format messages for the specific model
    const formattedMessages = this.formatMessagesForModel(invokeTarget, messages);

    // Debug provider resolution
    const detectedProvider = this.detectProvider(invokeTarget);
    console.log('[aws-bedrock] Invoking provider:', detectedProvider, 'target:', invokeTarget);

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: invokeTarget,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        ...(detectedProvider === 'Anthropic' ? {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: Math.min(maxTokens, model.maxTokens),
          messages: formattedMessages,
          temperature,
          top_p: topP,
        } : detectedProvider === 'Amazon' ? {
          inputText: messages[messages.length - 1].content,
          textGenerationConfig: {
            maxTokenCount: Math.min(maxTokens, model.maxTokens),
            temperature,
            topP,
          },
        } : {
          prompt: messages[messages.length - 1].content,
          max_tokens_to_sample: Math.min(maxTokens, model.maxTokens),
          temperature,
          top_p: topP,
        }),
      }),
    });

    const response = await this.client.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    for await (const chunk of response.body) {
      if (!chunk.chunk?.bytes) continue;
      
      const payload = JSON.parse(Buffer.from(chunk.chunk.bytes).toString('utf-8'));
      
      if (detectedProvider === 'Anthropic') {
        if (payload.type === 'content_block_delta' && payload.delta?.text) {
          yield { text: payload.delta.text };
        }
      } else if (detectedProvider === 'Amazon') {
        if (payload.outputText) {
          yield { text: payload.outputText };
        }
      } else if (payload.completion) {
        yield { text: payload.completion };
      }
    }
  }

  private formatMessagesForModel(
    modelId: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ) {
    const provider = this.detectProvider(modelId);
    if (provider === 'Anthropic') {
      // Bedrock Anthropic Messages API expects content blocks: { type: 'text', text: string }
      return messages.map(msg => ({
        role: (msg.role === 'system' ? 'user' : msg.role) as 'user' | 'assistant',
        content: [
          { type: 'text', text: msg.role === 'system' ? `System: ${msg.content}` : msg.content }
        ],
      }));
    }
    // For other models, just return the last user message
    return [messages[messages.length - 1]];
  }

  private detectProvider(modelId: string): string {
    // Normalize detection for both ARNs (foundation-model/ or inference-profile/) and plain IDs
    const id = modelId.toLowerCase();
    // Look anywhere in the string to support names like "us.anthropic.claude..."
    if (id.includes('anthropic.')) return 'Anthropic';
    if (id.includes('amazon.')) return 'Amazon';
    if (id.includes('meta.')) return 'Meta';
    if (id.includes('mistral.')) return 'Mistral';
    if (id.includes('cohere.')) return 'Cohere';
    if (id.includes('deepseek.')) return 'DeepSeek';
    return 'Unknown';
  }
}

export const bedrockClient = new BedrockClient();
