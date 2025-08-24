# Open Lovable

Chat with AI to build React apps locally. An example app made by the [Firecrawl](https://firecrawl.dev/?ref=open-lovable-github) team. For a complete cloud solution, check out [Lovable.dev ❤️](https://lovable.dev/).

<img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZFVLWMa6dVskQX0qu1/giphy.gif" alt="Open Lovable Demo" width="100%"/>

## About this fork (branch differences)

This branch diverges from the upstream Open Lovable app to better support a purely local workflow and AWS Bedrock:

- **No sandbox**: Operates entirely on your local filesystem. Code is written directly to your project, served by a local Next.js dev server. No remote sandboxes.
- **AWS Bedrock support**: First-class Bedrock integration with streaming via `lib/aws-bedrock.ts`. Supported keys:  
  `bedrock/claude-3-sonnet`, `bedrock/claude-3-haiku`, `bedrock/claude-2`, `bedrock/titan-text-express`, `bedrock/titan-text-lite`.
- **Provider selection**: `AI_PROVIDER` environment variable controls initialization (`auto`, `openai`, `anthropic`, `google`, `groq`, `bedrock`).
- **Model mapping & defaults**: Centralized in `config/app.config.ts` (`appConfig.ai.defaultModel`, `availableModels`, display names). Requests are validated to avoid unsupported models.
- **Improved logging**: API routes print startup info (provider mode and key presence without secrets) to help debug initialization and model selection.
- **Flowchart documentation**: `flowchart-ai-providers.html` shows the end-to-end provider selection and usage flow (open in a browser).


## Quick Start: AWS Bedrock

Use this checklist to get Bedrock working quickly:

1. **Enable Bedrock in your region**  
   - Open the Bedrock console and pick a region (default is `us-east-1`).
   - Link: https://console.aws.amazon.com/bedrock/

2. **Request model access**  
   - In Bedrock Console → “Model access”, request access to:  
     `Claude 3 Sonnet`, `Claude 3 Haiku`, `Claude 2`, `Titan Text Express`, `Titan Text Lite`.

3. **Create IAM user (programmatic access)**  
   - Console: https://console.aws.amazon.com/iam/  
   - Attach `AmazonBedrockFullAccess` (or a minimal policy granting Bedrock runtime invoke).  
   - Save Access Key ID and Secret.

4. **Add environment variables** (create `.env.local`):
   ```env
   AI_PROVIDER=auto              # or 'bedrock'
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1          # optional; defaults to us-east-1
   ```

5. **Pick a Bedrock model**  
   - Use these model keys (mapped internally to Bedrock IDs):  
     `bedrock/claude-3-sonnet`, `bedrock/claude-3-haiku`, `bedrock/claude-2`,  
     `bedrock/titan-text-express`, `bedrock/titan-text-lite`.

6. **Run the app**  
   ```bash
   pnpm run dev
   ```

7. **Test a request**  
   ```bash
   curl -X POST http://localhost:3000/api/analyze-edit-intent \
     -H 'Content-Type: application/json' \
     -d '{
       "prompt": "Plan a small UI tweak",
       "projectManifest": {"files": []},
       "model": "bedrock/claude-3-sonnet"
     }'
   ```

8. **Verify logs**  
   - Server logs should show provider mode and which keys were detected (no secrets).



## Setup

1. **Clone & Install**
```bash
git clone https://github.com/mendableai/open-lovable.git
cd open-lovable
pnpm install
```

> **Important**: We use `pnpm` instead of `npm` to resolve a lightningcss dependency issue. If you don't have pnpm installed, you can install it with `npm install -g pnpm`.

2. **Add `.env.local`**
```env
# Required
FIRECRAWL_API_KEY=your_firecrawl_api_key  # Get from https://firecrawl.dev (Web scraping)

# AI Provider Selection
AI_PROVIDER=auto  # Values: 'auto', 'anthropic', 'openai', 'google', 'groq', 'bedrock'
# 'auto' will use any available provider based on API keys

# AI Providers (need at least one)
ANTHROPIC_API_KEY=your_anthropic_api_key  # Get from https://console.anthropic.com
OPENAI_API_KEY=your_openai_api_key  # Get from https://platform.openai.com (GPT-5)
GEMINI_API_KEY=your_gemini_api_key  # Get from https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_api_key  # Get from https://console.groq.com (Fast inference - Kimi K2 recommended)

# AWS Bedrock Configuration (optional)
AWS_ACCESS_KEY_ID=your_aws_access_key_id  # Get from AWS IAM Console
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key  # Get from AWS IAM Console
AWS_REGION=us-east-1  # Change to your preferred AWS region
```

### AWS Bedrock Setup

1. **Enable Model Access**
   - Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
   - Navigate to "Model access" in the left sidebar
   - Request access to the models you want to use (Claude 3, Titan, etc.)

2. **Create IAM User**
   - Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
   - Create a new user with programmatic access
   - Attach the `AmazonBedrockFullAccess` policy
   - Save the access key ID and secret access key for your `.env` file

3. **Run**
```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)  

## Local Project Architecture

Open Lovable uses a local development approach to build and run React applications:

- **Local File System**: All project files are created and managed directly on your local file system
- **Local Development Server**: A Next.js development server runs your React application locally
- **AI Code Generation**: AI models generate code based on your prompts and apply it to your local project
- **Live Preview**: See your application running in real-time as you make changes
- **Project Download**: Download your entire project as a ZIP file to use elsewhere

This architecture eliminates the need for cloud sandboxes, allowing you to work with your code directly on your machine.

## AI Provider Selection

Open Lovable supports multiple AI providers and allows you to control which ones are initialized:

- **Auto Mode**: By default, the system will initialize any provider for which you have a valid API key
- **Single Provider**: You can specify a single provider to use by setting the `AI_PROVIDER` environment variable
- **Available Providers**: `anthropic`, `openai`, `google`, `groq`, `bedrock`

To configure your preferred provider, add this to your `.env.local` file:

```env
# Values: 'auto', 'anthropic', 'openai', 'google', 'groq', 'bedrock'
AI_PROVIDER=auto
```

This helps optimize resource usage by only initializing the providers you need.

## Models & Provider Mapping

Models are selected using a `provider/model` key. These are validated and mapped internally to the correct client.

- **OpenAI**
  - `openai/gpt-4-turbo`
  - `openai/gpt-4`
  - `openai/gpt-3.5-turbo`
- **Anthropic (direct)**
  - `anthropic/claude-3-opus`
  - `anthropic/claude-3-sonnet`
  - `anthropic/claude-3-haiku`
- **Google (Gemini)**
  - `google/gemini-pro`
- **Groq**
  - `groq/llama3-70b`
  - `groq/llama3-8b`
  - `groq/mixtral-8x7b`
- **AWS Bedrock** (mapped to Bedrock model IDs)
  - `bedrock/claude-3-sonnet` → `anthropic.claude-3-sonnet-20240229-v1:0`
  - `bedrock/claude-3-haiku` → `anthropic.claude-3-haiku-20240307-v1:0`
  - `bedrock/claude-2` → `anthropic.claude-v2`
  - `bedrock/titan-text-express` → `amazon.titan-text-express-v1`
  - `bedrock/titan-text-lite` → `amazon.titan-text-lite-v1`

The default model is configured in `config/app.config.ts` under `appConfig.ai.defaultModel`.

## Selecting Models (UI and API)

- **UI**: Use the model selector in the top bar (enabled by `appConfig.ui.showModelSelector`).
- **API**: Pass `model` in the JSON body to the API routes.

Examples:

```bash
curl -X POST http://localhost:3000/api/analyze-edit-intent \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Add a dark mode toggle",
    "projectManifest": {"files": []},
    "model": "bedrock/claude-3-sonnet"
  }'

curl -N -X POST http://localhost:3000/api/generate-ai-code-stream \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Create a Navbar with a search box",
    "isEdit": false,
    "model": "groq/llama3-70b"
  }'
```

If `model` is omitted, the system uses `appConfig.ai.defaultModel`.

## AWS Bedrock Model Selection

After setting AWS credentials and enabling model access, you can select a Bedrock-backed model using the `bedrock/...` keys above. The app will map them to the required Bedrock model IDs automatically (see `lib/aws-bedrock.ts`).

Notes for Bedrock usage:

- **Required env**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optionally `AWS_REGION` (defaults to `us-east-1`).
- **Model access**: Ensure access is approved for each model in the Bedrock Console (Claude 3, Titan, etc.).
- **Streaming**: Responses are streamed via Bedrock runtime; unsupported model keys return a clear error.
- **Troubleshooting**:
  - Confirm `AI_PROVIDER` includes `bedrock` or `auto`.
  - Start dev server and check server logs; provider and key presence are logged without secrets.
  - If you see "Unsupported Bedrock model", verify the model key and that access is granted.


## License

MIT
