# Open Lovable

Chat with AI to build React apps locally. An example app made by the [Firecrawl](https://firecrawl.dev/?ref=open-lovable-github) team. For a complete cloud solution, check out [Lovable.dev ❤️](https://lovable.dev/).

<img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZFVLWMa6dVskQX0qu1/giphy.gif" alt="Open Lovable Demo" width="100%"/>



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

## License

MIT
