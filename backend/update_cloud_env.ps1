# Update Cloud Run Environment Variables
$ErrorActionPreference = "Stop"

$projectId = "prasanna-caterers"
$serviceName = "finolex-backend"
$region = "us-central1"

# Configuration Values (From your local .env)
# Using single quotes to strictly preserve strings
$EnvVars = @{
    "MONGODB_URI" = 'mongodb+srv://finolex_admin:finolex_admin@mess.dqhbzlz.mongodb.net/finolex_canteen?appName=Mess'
    "JWT_SECRET" = 'prasanna_caterers'
    "CLOUDINARY_CLOUD_NAME" = 'df0pkn199'
    "CLOUDINARY_API_KEY" = '191429622992698'
    "CLOUDINARY_API_SECRET" = 'K417jUggqsIaJo1QbMEs9R0K2Fw'
    "GEMINI_API_KEY" = 'AIzaSyBeLz3RwbIi9NRe7pSyEvxLl52CdUXGBjI'
    "SERVER_URL" = 'https://finolex-backend-334321723232.us-central1.run.app'
    "N8N_WEBHOOK_URL" = 'https://agentic-workflow.app.n8n.cloud/webhook/29b0d2f1-ea77-4c51-ba3e-9757ed5bdf71'
}

Write-Host "Updating Environment Variables for $serviceName..." -ForegroundColor Cyan

# Construct the string for gcloud
# Format: KEY1=VALUE1,KEY2=VALUE2
$envString = $EnvVars.Keys | ForEach-Object { "$_=$($EnvVars[$_])" }
$envString = $envString -join ","

# Run gcloud update
gcloud run services update $serviceName `
    --project $projectId `
    --region $region `
    --update-env-vars $envString

Write-Host "Success! Environment variables updated." -ForegroundColor Green
Write-Host "The service is automatically redeploying new revision. Please wait 1-2 minutes." -ForegroundColor Yellow
