# PowerShell script to deploy to Google Cloud Run (Backs Cloud Functions 2nd Gen)
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Finolex Backend Deployment (GCP)" -ForegroundColor Cyan
Write-Host "========================================="

# Check for gcloud
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Error "Google Cloud SDK (gcloud) is not installed or not in PATH."
    exit 1
}

# Login check
$currentAccount = gcloud auth list --filter=status:ACTIVE --format="value(account)"
if (-not $currentAccount) {
    Write-Host "Please log in to Google Cloud:" -ForegroundColor Yellow
    gcloud auth login
}

# Project Selection
$projectId = "prasanna-caterers"
gcloud config set project $projectId
Write-Host "Using Project: $projectId" -ForegroundColor Green

# Enable Services
Write-Host "Enabling necessary APIs (Cloud Run, Cloud Build)..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Deploy
Write-Host "Deploying to Cloud Run (Serverless)..." -ForegroundColor Yellow
# Note: --source . builds the container automatically using Cloud Buildpack
# --allow-unauthenticated allows public access (needed for frontend to connect)
gcloud run deploy finolex-backend `
    --source . `
    --region us-central1 `
    --platform managed `
    --allow-unauthenticated `
    --port 5000 `
    --update-env-vars "^,^NODE_ENV=production,MONGODB_URI=mongodb+srv://finolex_admin:finolex_admin@mess.dqhbzlz.mongodb.net/finolex_canteen?appName=Mess,JWT_SECRET=prasanna_caterers,CLOUDINARY_CLOUD_NAME=df0pkn199,CLOUDINARY_API_KEY=191429622992698,CLOUDINARY_API_SECRET=K417jUggqsIaJo1QbMEs9R0K2Fw,GEMINI_API_KEY=AIzaSyBeLz3RwbIi9NRe7pSyEvxLl52CdUXGBjI,SERVER_URL=https://finolex-backend-334321723232.us-central1.run.app,N8N_WEBHOOK_URL=https://agentic-workflow.app.n8n.cloud/webhook/29b0d2f1-ea77-4c51-ba3e-9757ed5bdf71"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "1. Copy the Service URL from the output above."
Write-Host "2. Go to your frontend .env file (or create one)."
Write-Host "3. Set VITE_API_URL=<YOUR_SERVICE_URL>/api"
Write-Host "   (Example: https://finolex-backend-xyz.a.run.app/api)"
Write-Host "========================================="
