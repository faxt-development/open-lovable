import { NextResponse } from 'next/server';

// Build list of Bedrock model IDs from env/file (server-only for file access)
function loadBedrockAllowedModelsServer(): { full: string[]; ids: string[] } {
  try {
    console.log('[bedrock] allowed-models: load invoked');
    // Priority 1: CSV env (supports both public and server-side vars)
    const csv = (process.env.NEXT_PUBLIC_BEDROCK_ALLOWED_MODELS || process.env.BEDROCK_ALLOWED_MODELS || '').trim();
    if (csv) {
      const ids = csv.split(',').map(s => s.trim()).filter(Boolean);
      const full = ids.map(id => `${id}`);
      console.log('[bedrock] allowed-models: using CSV env list', { count: ids.length });
      return { full, ids };
    }

    // Priority 2: JSON file on server
    const path = process.env.BEDROCK_ALLOWED_MODELS_PATH;
    if (!path) {
      console.warn('[bedrock] allowed-models: BEDROCK_ALLOWED_MODELS_PATH not set');
      return { full: [], ids: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodePath = require('path') as typeof import('path');

    const resolved = nodePath.resolve(process.cwd(), path);
    const exists = fs.existsSync(resolved);
    console.log('[bedrock] allowed-models: resolved file', { path, resolved, exists });
    if (!exists) return { full: [], ids: [] };

    const raw = fs.readFileSync(resolved, 'utf-8');
    const json = JSON.parse(raw);

    let modelIds: string[] = [];
    if (Array.isArray(json)) {
      modelIds = json.map((v: any) => (typeof v === 'string' ? v : v?.modelId)).filter((v: any): v is string => !!v);
    } else if (Array.isArray(json?.modelSummaries)) {
      modelIds = json.modelSummaries.map((v: any) => v?.modelId).filter((v: any): v is string => !!v);
    }

    console.log('[bedrock] allowed-models: parsed ids', { count: modelIds.length });
    const full = modelIds.map(id => `${id}`);
    return { full, ids: modelIds };
  } catch (err) {
    console.error('[bedrock] allowed-models: error loading models', err);
    return { full: [], ids: [] };
  }
}

function bedrockLabelFromId(modelId: string): string {
  const short = modelId.split('/').pop() || modelId;
  if (short.toLowerCase().includes('claude')) return `Bedrock: ${short.replace(/anthropic\.?/i, '').replace(/-/g, ' ')}`;
  if (short.toLowerCase().includes('titan')) return `Bedrock: ${short.replace(/amazon\.?/i, '').replace(/-/g, ' ')}`;
  return `Bedrock: ${short}`;
}

export async function GET() {
  const provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  const { full, ids } = loadBedrockAllowedModelsServer();
  const display: Record<string, string> = {};
  for (const f of full) {
    const id = f.replace(/^bedrock\//, '');
    display[f] = bedrockLabelFromId(id);
  }

  const inBedrockMode = provider === 'bedrock' || (provider === 'auto' && !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY));
  const ok = full.length > 0 || !inBedrockMode;
  const message = ok
    ? undefined
    : 'Bedrock allowlist not found or empty. Ensure BEDROCK_ALLOWED_MODELS_PATH points to a readable JSON file or set NEXT_PUBLIC_BEDROCK_ALLOWED_MODELS.';

  console.log('[bedrock] allowed-models: GET', {
    provider,
    inBedrockMode,
    modelCount: full.length,
    ok,
    msg: message,
  });

  return NextResponse.json({ ok, message, models: full, rawIds: ids, displayNames: display });
}
