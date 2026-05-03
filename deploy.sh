#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "    🚀 Deploying Doc-Intel-Hub to Google Cloud Run"
echo "           (Optimized for GCP Free Tier)"
echo "=========================================================="

# 1. Ensure gcloud is in PATH
if [ -d "$HOME/google-cloud-sdk/bin" ]; then
    export PATH="$HOME/google-cloud-sdk/bin:$PATH"
fi

if ! command -v gcloud &> /dev/null; then
    echo "[-] Error: gcloud CLI not found. Please run ./setup_gcloud.sh first."
    exit 1
fi

# 2. Check active GCP Account
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || true)
if [ -z "$ACTIVE_ACCOUNT" ]; then
    echo "[-] No active Google Cloud account detected."
    echo "[*] Please run: gcloud auth login"
    exit 1
fi
echo "[+] Active Account: $ACTIVE_ACCOUNT"

# 3. Check active GCP Project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "[-] No GCP Project configured."
    echo "[*] Please run: gcloud config set project <YOUR_PROJECT_ID>"
    exit 1
fi
echo "[+] Active Project: $PROJECT_ID"

# 4. Service Configuration (Free Tier Optimized)
SERVICE_NAME="doc-intel-hub"
REGION="us-central1" # Included in GCP Perpetual Free Tier

# 5. Extract environment variables from .env if available
GROQ_KEY="${GROQ_API_KEY:-}"
COHERE_KEY="${COHERE_API_KEY:-}"
AI_MODE="cloud"
CLOUD_GEN_MODEL="openai/gpt-oss-120b"
CLOUD_EMB_MODEL="embed-multilingual-v3.0"

if [ -f .env ]; then
    echo "[*] Loading environment defaults from .env..."
    if [ -z "$GROQ_KEY" ]; then
        GROQ_KEY=$(grep -E "^GROQ_API_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
    fi
    if [ -z "$COHERE_KEY" ]; then
        COHERE_KEY=$(grep -E "^COHERE_API_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
    fi
fi

ENV_VARS="AI_MODE=cloud,CLOUD_GENERATION_MODEL=${CLOUD_GEN_MODEL},CLOUD_EMBEDDING_MODEL=${CLOUD_EMB_MODEL}"
if [ -n "$GROQ_KEY" ]; then
    ENV_VARS="${ENV_VARS},GROQ_API_KEY=${GROQ_KEY}"
fi
if [ -n "$COHERE_KEY" ]; then
    ENV_VARS="${ENV_VARS},COHERE_API_KEY=${COHERE_KEY}"
fi

echo ""
echo "----------------------------------------------------------"
echo "  Deploying Service: $SERVICE_NAME"
echo "  Region:           $REGION (Free Tier Eligible)"
echo "  Min Instances:    0 (Scale to zero, $0 idle cost)"
echo "  Max Instances:    2 (Free tier safety ceiling)"
echo "  Memory / CPU:     1Gi / 1 vCPU"
echo "----------------------------------------------------------"

gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 2 \
    --memory 1Gi \
    --cpu 1 \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars "$ENV_VARS"

echo ""
echo "=========================================================="
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format="value(status.url)")
echo " [✓] Deployment Successful!"
echo " [✓] Live App URL: $SERVICE_URL"
echo "=========================================================="
echo ""
echo "[*] Checking live health endpoint..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${SERVICE_URL}/health" || true
