import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

type BedrockModel = {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
};

export const BEDROCK_MODELS: Record<string, BedrockModel> = {
  'anthropic.claude-3-sonnet-20240229-v1:0': {
    id: 'anthropic.claude-3-sonnet-20240229-v1:0',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    maxTokens: 200000,
  },
  'anthropic.claude-3-haiku-20240307-v1:0': {
    id: 'anthropic.claude-3-haiku-20240307-v1:0',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    maxTokens: 200000,
  },
  'anthropic.claude-v2': {
    id: 'anthropic.claude-v2',
    name: 'Claude 2',
    provider: 'Anthropic',
    maxTokens: 100000,
  },
  'amazon.titan-text-lite-v1': {
    id: 'amazon.titan-text-lite-v1',
    name: 'Titan Text Lite',
    provider: 'Amazon',
    maxTokens: 4000,
  },
  'amazon.titan-text-express-v1': {
    id: 'amazon.titan-text-express-v1',
    name: 'Titan Text Express',
    provider: 'Amazon',
    maxTokens: 8000,
  },
};

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
    // Try known models; if not present, infer sensible defaults based on modelId prefix
    let model = BEDROCK_MODELS[modelId];
    if (!model) {
      if (modelId.startsWith('anthropic.')) {
        model = {
          id: modelId,
          name: modelId,
          provider: 'Anthropic',
          maxTokens: 200000,
        };
      } else if (modelId.startsWith('amazon.')) {
        model = {
          id: modelId,
          name: modelId,
          provider: 'Amazon',
          maxTokens: 8000,
        };
      } else {
        model = {
          id: modelId,
          name: modelId,
          provider: 'Unknown',
          maxTokens: 4000,
        };
      }
    }

    // Format messages for the specific model
    const formattedMessages = this.formatMessagesForModel(modelId, messages);

    const command = new InvokeModelWithResponseStreamCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        ...(modelId.startsWith('anthropic.') ? {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: Math.min(maxTokens, model.maxTokens),
          messages: formattedMessages,
          temperature,
          top_p: topP,
        } : modelId.startsWith('amazon.') ? {
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
      
      if (modelId.startsWith('anthropic.')) {
        if (payload.type === 'content_block_delta' && payload.delta?.text) {
          yield { text: payload.delta.text };
        }
      } else if (modelId.startsWith('amazon.')) {
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
    if (modelId.startsWith('anthropic.')) {
      return messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.role === 'system' ? `System: ${msg.content}` : msg.content,
      }));
    }
    
    // For other models, just return the last user message
    return [messages[messages.length - 1]];
  }
}

export const bedrockClient = new BedrockClient();
