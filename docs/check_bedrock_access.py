#!/usr/bin/env python3
import os
import boto3
from botocore.exceptions import ClientError


def check_bedrock_access():
    region = os.getenv('AWS_REGION', 'us-east-1')
    bedrock = boto3.client('bedrock', region_name=region)
    bedrock_rt = boto3.client('bedrock-runtime', region_name=region)

    # Get all foundation models
    response = bedrock.list_foundation_models()

    # Group models by access status
    access_groups = {
        'granted': [],        # Invoke permission appears granted (validation-type errors)
        'not_granted': [],    # AccessDenied from runtime invoke
        'not_found': [],      # ResourceNotFound (wrong region or unavailable model)
        'error': []
    }

    print(f"Checking Bedrock INVOKE permissions in region {region}...")
    print("=" * 50)

    for model in response.get('modelSummaries', []):
        model_id = model.get('modelId')
        model_name = model.get('modelName')
        provider = model.get('providerName')

        try:
            # Attempt a minimal runtime call with an intentionally invalid payload.
            # If permission is granted, Bedrock typically returns ValidationException.
            # If permission is NOT granted (or model access not approved), AccessDeniedException.
            bedrock_rt.invoke_model(
                modelId=model_id,
                contentType='application/json',
                accept='application/json',
                body=b'{}'
            )
            # If it surprisingly succeeds, consider it granted.
            access_groups['granted'].append({
                'id': model_id,
                'name': model_name,
                'provider': provider
            })
        except ClientError as e:
            err = e.response.get('Error', {})
            error_code = err.get('Code', 'Unknown')
            error_msg = err.get('Message', '')
            if error_code == 'AccessDeniedException':
                access_groups['not_granted'].append({
                    'id': model_id,
                    'name': model_name,
                    'provider': provider,
                    'message': error_msg
                })
            elif error_code == 'ResourceNotFoundException':
                # Typically means the model isn't available in this region or ID is invalid/retired
                access_groups['not_found'].append({
                    'id': model_id,
                    'name': model_name,
                    'provider': provider,
                    'message': error_msg
                })
            elif error_code in ('ValidationException', 'ModelErrorException', 'BadRequestException'):
                # Treat validation-like errors as evidence of granted invoke permission
                access_groups['granted'].append({
                    'id': model_id,
                    'name': model_name,
                    'provider': provider
                })
            else:
                access_groups['error'].append({
                    'id': model_id,
                    'name': model_name,
                    'provider': provider,
                    'error': error_code,
                    'message': error_msg
                })

    # Display results
    print(f"\n✅ GRANTED (Invoke allowed) ({len(access_groups['granted'])} models)")
    print("=" * 50)
    for model in access_groups['granted']:
        print(f"{model['id']}")
        print(f"   Name: {model['name']}")
        print(f"   Provider: {model['provider']}")
        print()

    print(f"❌ NOT GRANTED (Access denied) ({len(access_groups['not_granted'])} models)")
    print("=" * 50)
    for model in access_groups['not_granted']:
        print(f"{model['id']}")
        print(f"   Name: {model['name']}")
        print(f"   Provider: {model['provider']}")
        if 'message' in model and model['message']:
            print(f"   Message: {model['message']}")
        print()

    print(f"🚫 NOT FOUND (Wrong region or unavailable) ({len(access_groups['not_found'])} models)")
    print("=" * 50)
    for model in access_groups['not_found']:
        print(f"{model['id']}")
        print(f"   Name: {model['name']}")
        print(f"   Provider: {model['provider']}")
        if 'message' in model and model['message']:
            print(f"   Message: {model['message']}")
        print()

    if access_groups['error']:
        print(f"⚠️  ERROR STATUS MODELS ({len(access_groups['error'])} models)")
        print("=" * 50)
        for model in access_groups['error']:
            print(f"{model['id']}")
            print(f"   Name: {model['name']}")
            print(f"   Provider: {model['provider']}")
            print(f"   Error: {model['error']}")
            print()


if __name__ == "__main__":
    check_bedrock_access()
