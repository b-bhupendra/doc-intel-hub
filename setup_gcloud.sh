#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "    Doc-Intel-Hub: Google Cloud Setup & Auth Check"
echo "=========================================================="

# Ensure gcloud is in PATH
if [ -d "$HOME/google-cloud-sdk/bin" ]; then
    export PATH="$HOME/google-cloud-sdk/bin:$PATH"
fi

if ! command -v gcloud &> /dev/null; then
    echo "[-] gcloud CLI not found in PATH."
    echo "[*] Installing standalone Google Cloud SDK into $HOME/google-cloud-sdk..."
    curl -sSL https://sdk.cloud.google.com -o /tmp/install_gcloud.sh
    bash /tmp/install_gcloud.sh --disable-prompts --install-dir="$HOME"
    export PATH="$HOME/google-cloud-sdk/bin:$PATH"
    echo 'export PATH="$HOME/google-cloud-sdk/bin:$PATH"' >> "$HOME/.bashrc"
fi

echo "[+] gcloud CLI location: $(which gcloud)"
gcloud --version | head -n 3

echo ""
echo "----------------------------------------------------------"
echo "  Checking GCP Authentication..."
echo "----------------------------------------------------------"

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || true)
if [ -z "$ACTIVE_ACCOUNT" ]; then
    echo "[!] No active Google Cloud account detected."
    echo "[*] Launching browser authentication..."
    gcloud auth login --update-adc
else
    echo "[+] Active account: $ACTIVE_ACCOUNT"
fi

CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$CURRENT_PROJECT" ] || [ "$CURRENT_PROJECT" = "(unset)" ]; then
    echo "[!] No GCP Project currently selected."
    echo "[*] Listing your available projects:"
    gcloud projects list
    echo ""
    read -p "Enter your GCP Project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
    CURRENT_PROJECT="$PROJECT_ID"
fi

echo "[+] Selected GCP Project: $CURRENT_PROJECT"

echo ""
echo "----------------------------------------------------------"
echo "  Enabling Required Free-Tier Services..."
echo "----------------------------------------------------------"
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com

echo ""
echo "=========================================================="
echo " [+] Setup Complete! You can now run ./deploy.sh"
echo "=========================================================="
