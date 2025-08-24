# AWS Bedrock Integration Guide

This document provides a comprehensive guide to setting up and using AWS Bedrock with Lovable.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Available Models](#available-models)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Overview

Lovable now supports integration with AWS Bedrock, allowing you to use various foundation models like Claude and Titan for code generation and analysis. This integration supports both streaming and non-streaming responses.

## Prerequisites

1. AWS Account with access to Bedrock service
2. IAM user with appropriate permissions
3. Node.js 16+ and npm/yarn installed

## Setup Instructions

### 1. Configure AWS Credentials

Add the following environment variables to your `.env` file:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1  # or your preferred region
```

### 2. Enable Model Access in AWS Bedrock

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/)
2. Navigate to the AWS Bedrock service
3. Go to "Model access" in the left sidebar
4. Request access to the models you want to use (Claude, Titan, etc.)

### 3. Install Dependencies

```bash
npm install @aws-sdk/client-bedrock-runtime @aws-sdk/client-bedrock-agent-runtime
```

### 4. List available models (optional)

Use AWS CLI to see Bedrock model IDs available in your region (handy for allowlists):

```bash
aws bedrock list-foundation-models \
  --region us-east-1 \
  --query 'modelSummaries[].{ModelId:modelId,ModelName:modelName,Provider:providerName}' \
  --output table
```

### 5. Verify model access with Python (optional)

Run the helper script to check which models your IAM user can access. This is useful when setting up allowlists.

Script: `docs/check_bedrock_access.py`

```bash
# Install dependency (once)
pip install boto3

# Run from repo root
python3 docs/check_bedrock_access.py
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | Yes | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | Yes | - |
| `AWS_REGION` | AWS region for Bedrock service | No | us-east-1 |

### Model Configuration

Models are configured in `app.config.ts`:

```typescript
// Available models
availableModels: [
  // ... other models
  'bedrock/claude-3-sonnet',
  'bedrock/claude-3-haiku',
  'bedrock/claude-2',
  'bedrock/titan-text-express'
],

// Model display names
modelDisplayNames: {
  // ... other models
  'bedrock/claude-3-sonnet': 'Bedrock: Claude 3 Sonnet',
  'bedrock/claude-3-haiku': 'Bedrock: Claude 3 Haiku',
  'bedrock/claude-2': 'Bedrock: Claude 2',
  'bedrock/titan-text-express': 'Bedrock: Titan Text Express'
}
```

## Available Models

| Model ID | Provider | Description |
|----------|----------|-------------|
| `bedrock/claude-3-sonnet` | Anthropic | Claude 3 Sonnet model |
| `bedrock/claude-3-haiku` | Anthropic | Claude 3 Haiku model (faster, lower cost) |
| `bedrock/claude-2` | Anthropic | Claude 2 model |
| `bedrock/titan-text-express` | Amazon | Titan Text Express model |

## IAM Permissions

Create an IAM policy with the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:ListFoundationModels"
            ],
            "Resource": "*"
        }
    ]
}
```

## Troubleshooting

### Common Issues

1. **Missing Permissions**
   - Ensure your IAM user has the required Bedrock permissions
   - Verify model access is granted in the Bedrock console

2. **Invalid Credentials**
   - Double-check your AWS credentials in the `.env` file
   - Ensure the AWS region matches where Bedrock is available

3. **Model Not Available**
   - Verify the model ID is correct
   - Check if the model is available in your AWS region

## Security Considerations

1. **Credential Management**
   - Never commit AWS credentials to version control
   - Use AWS IAM roles when possible instead of access keys
   - Rotate access keys regularly

2. **Model Access**
   - Only enable access to models that are needed
   - Monitor usage and set up billing alerts

3. **Data Privacy**
   - Be aware of the data processing policies of the models you use
   - Consider enabling AWS PrivateLink for additional security

## Monitoring and Logging

Enable AWS CloudWatch logging to monitor Bedrock API calls and track usage:

1. Go to AWS CloudWatch
2. Navigate to Logs → Log groups
3. Look for logs under `/aws/bedrock`

For more information, refer to the [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/).
