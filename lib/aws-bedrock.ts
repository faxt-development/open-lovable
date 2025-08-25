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

    // Debug provider resolution
    const detectedProvider = this.detectProvider(invokeTarget);

    // Helper to conservatively truncate long text by characters
    const truncate = (text: string, maxChars: number) => {
      if (!text || text.length <= maxChars) return text;
      return text.slice(-maxChars); // keep the tail which usually contains the user's latest details
    };

    // Trim messages for providers with tighter input limits (e.g., DeepSeek)
    let effectiveMessages = messages;
    if (detectedProvider === 'DeepSeek') {
      const sys = messages.find(m => m.role === 'system');
      const lastUser = messages.filter(m => m.role === 'user').slice(-1)[0];
      if (lastUser) {
        // Aggressively truncate last user message to a safe bound (e.g., 6k chars)
        const SAFE_MAX = 6000;
        const truncatedUser = {
          ...lastUser,
          content: truncate(lastUser.content, SAFE_MAX),
        } as typeof lastUser;

        effectiveMessages = sys ? [sys, truncatedUser] : [truncatedUser];
        if (lastUser.content.length > SAFE_MAX) {
          console.warn('[aws-bedrock] DeepSeek: user content truncated to', SAFE_MAX, 'chars to fit input limits');
        } else {
          console.log('[aws-bedrock] DeepSeek: trimmed messages to system + last user');
        }
      }
    }

    // Format messages for the specific model
    const formattedMessages = this.formatMessagesForModel(invokeTarget, effectiveMessages);
    console.log('[aws-bedrock] Invoking provider:', detectedProvider, 'target:', invokeTarget);

    // Build initial request body per provider
    const lastUserFromEffective = (effectiveMessages.filter(m => m.role === 'user').slice(-1)[0]?.content) || '';
    const initialBody = (detectedProvider === 'Anthropic')
      ? {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: Math.min(maxTokens, model.maxTokens),
          messages: formattedMessages,
          temperature,
          top_p: topP,
        }
      : (detectedProvider === 'Amazon')
      ? {
          inputText: lastUserFromEffective,
          textGenerationConfig: {
            maxTokenCount: Math.min(maxTokens, model.maxTokens),
            temperature,
            topP,
          },
        }
      : (detectedProvider === 'DeepSeek')
      ? {
          messages: formattedMessages,
          max_tokens: Math.min(maxTokens, model.maxTokens),
          temperature,
          top_p: topP,
        }
      : {
          prompt: lastUserFromEffective,
          max_tokens_to_sample: Math.min(maxTokens, model.maxTokens),
          temperature,
          top_p: topP,
        };

    const sendWithBody = async (body: any) => {
      const cmd = new InvokeModelWithResponseStreamCommand({
        modelId: invokeTarget,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      });
      return await this.client.send(cmd);
    };

    let response: any;
    try {
      // Try the initial request body
      response = await sendWithBody(initialBody);
    } catch (err: any) {
      // For DeepSeek specifically, retry with alternative shapes on validation errors
      if (detectedProvider === 'DeepSeek' && (err?.name === 'ValidationException' || err?.$fault === 'client')) {
        console.warn('[aws-bedrock] DeepSeek validation failed with initial body. Retrying with alternatives...');
        const alternatives = [
          // Alternative 1: input + flat params
          { input: lastUserFromEffective, max_tokens: Math.min(maxTokens, model.maxTokens), temperature, top_p: topP },
          // Alternative 2: prompt + flat params
          { prompt: lastUserFromEffective, max_tokens: Math.min(maxTokens, model.maxTokens), temperature, top_p: topP },
        ];
        let success = false;
        for (const alt of alternatives) {
          try {
            response = await sendWithBody(alt);
            success = true;
            break;
          } catch (e) {
            // try next
          }
        }
        if (!success) throw err;
      } else {
        throw err;
      }
    }

    if (!response || !response.body) {
      throw new Error('No response body from Bedrock');
    }

    for await (const chunk of response.body) {
      if (!chunk.chunk?.bytes) continue;
      
      const payload = JSON.parse(Buffer.from(chunk.chunk.bytes).toString('utf-8'));
      
      if (detectedProvider === 'Anthropic') {
        if (payload.type === 'content_block_delta' && payload.delta?.text) {
          yield { text: payload.delta.text };
        }
      } else if (detectedProvider === 'DeepSeek') {
        // Try to handle common DeepSeek streaming shapes on Bedrock
        // Prefer delta-style content first
        if (payload?.delta?.content) {
          const text = Array.isArray(payload.delta.content)
            ? payload.delta.content.map((c: any) => c?.text || '').join('')
            : (payload.delta.content.text || payload.delta.content || '');
          if (text) yield { text };
        } else if (payload?.output_text) {
          yield { text: payload.output_text };
        } else if (payload?.completion) {
          yield { text: payload.completion };
        } else if (payload?.content?.[0]?.text) {
          yield { text: payload.content[0].text };
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
    } else if (provider === 'DeepSeek') {
      // DeepSeek expects OpenAI-style messages: [{ role, content }]
      return messages.map(msg => ({ role: msg.role, content: msg.content }));
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
