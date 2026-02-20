# Lang-Grab - Deploy Script (PowerShell)
# This script commits changes to GitHub and pushes a new Docker image to GitHub Container Registry

$ErrorActionPreference = "Stop"

$GITHUB_USER    = "mikesawayda-adaptivesoftware"
$IMAGE_NAME     = "ghcr.io/$GITHUB_USER/lang-grab"
$REPO_URL       = "https://github.com/mikesawayda-adaptivesoftware/Lang-Grab.git"
$CONTAINER_NAME = "lang-grab"
$HOST_PORT      = 3089
$CONTAINER_PORT = 3089

function Write-Color($Text, $Color) {
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "========================================" Cyan
Write-Color "   Lang-Grab - Deploy Script"           Cyan
Write-Color "========================================" Cyan
Write-Host ""

$APP_DIR = $PSScriptRoot
Write-Color "App directory: $APP_DIR" Yellow
Write-Host ""

Set-Location $APP_DIR

# ── Git commit & push ──────────────────────────────────────────────────────────
$gitStatus = git status -s
if (-not $gitStatus) {
    Write-Color "No changes to commit" Yellow
} else {
    if ($args.Count -eq 0) {
        $COMMIT_MSG = "Update Lang-Grab - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        Write-Color "Using default commit message: $COMMIT_MSG" Yellow
    } else {
        $COMMIT_MSG = $args[0]
        Write-Color "Commit message: $COMMIT_MSG" Yellow
    }
    Write-Host ""

    Write-Color "Staging changes..." Cyan
    git add -A

    Write-Color "Committing..." Cyan
    git commit -m $COMMIT_MSG

    Write-Color "Pushing to GitHub..." Cyan
    git remote set-url origin $REPO_URL 2>$null
    if ($LASTEXITCODE -ne 0) { git remote add origin $REPO_URL }
    git push origin main

    Write-Color "GitHub updated successfully!" Green
}
Write-Host ""

# ── Docker build & push ────────────────────────────────────────────────────────
Write-Color "Building Docker image for linux/amd64..." Cyan

if (-not (docker buildx version 2>$null)) {
    Write-Color "Docker buildx is not available. Please install it first." Red
    exit 1
}

Write-Color "Logging into GitHub Container Registry..." Cyan
$pat = $env:GITHUB_CR_PAT
if (-not $pat) {
    Write-Color "Error: GITHUB_CR_PAT environment variable is not set!" Red
    Write-Color "Please set it with:  `$env:GITHUB_CR_PAT = 'your_token_here'" Yellow
    Write-Color "Get a token from: https://github.com/settings/tokens" Yellow
    Write-Color "Required scopes: write:packages, read:packages" Yellow
    exit 1
}
$pat | docker login ghcr.io -u $GITHUB_USER --password-stdin
Write-Color "Logged into ghcr.io" Green
Write-Host ""

# Create/use buildx builder
docker buildx create --name mybuilder --use 2>$null
if ($LASTEXITCODE -ne 0) { docker buildx use mybuilder 2>$null }

Write-Color "This may take a few minutes..." Yellow
docker buildx build --platform linux/amd64 -t "${IMAGE_NAME}:latest" --push .

Write-Host ""
Write-Color "========================================" Green
Write-Color "   Deployment Complete!"                 Green
Write-Color "========================================" Green
Write-Host ""

# ── Unraid setup instructions ──────────────────────────────────────────────────
Write-Color "========================================" Cyan
Write-Color "   UNRAID SETUP INSTRUCTIONS"           Cyan
Write-Color "========================================" Cyan
Write-Host ""
Write-Color "FIRST TIME SETUP:" Yellow
Write-Host ""
Write-Host "  1. Login to GitHub Container Registry on Unraid:"
Write-Host ""
Write-Color "     gh auth token | docker login ghcr.io -u $GITHUB_USER --password-stdin" Green
Write-Host ""
Write-Host "  2. Pull the latest image:"
Write-Host ""
Write-Color "     docker pull ${IMAGE_NAME}:latest" Green
Write-Host ""
Write-Host "  3. Stop/remove any old containers (if exists):"
Write-Host ""
Write-Color "     docker rm -f $CONTAINER_NAME" Green
Write-Host ""
Write-Host "  4. Run the container (pass your RapidAPI key):"
Write-Host ""
Write-Color "     docker run -d ``" Green
Write-Color "       --name $CONTAINER_NAME ``" Green
Write-Color "       --restart unless-stopped ``" Green
Write-Color "       -p ${HOST_PORT}:${CONTAINER_PORT} ``" Green
Write-Color "       -e RAPIDAPI_KEY=your_key_here ``" Green
Write-Color "       ${IMAGE_NAME}:latest" Green
Write-Host ""
Write-Host "  5. Watch logs:"
Write-Host ""
Write-Color "     docker logs -f $CONTAINER_NAME" Green
Write-Host ""
Write-Color "TO UPDATE (after future deploys):" Yellow
Write-Host ""
Write-Color "     docker pull ${IMAGE_NAME}:latest" Green
Write-Color "     docker rm -f $CONTAINER_NAME" Green
Write-Color "     docker run -d ``" Green
Write-Color "       --name $CONTAINER_NAME ``" Green
Write-Color "       --restart unless-stopped ``" Green
Write-Color "       -p ${HOST_PORT}:${CONTAINER_PORT} ``" Green
Write-Color "       -e RAPIDAPI_KEY=your_key_here ``" Green
Write-Color "       ${IMAGE_NAME}:latest" Green
Write-Host ""
Write-Color "========================================" Cyan
Write-Color "   Access: http://YOUR_SERVER_IP:${HOST_PORT}" Cyan
Write-Color "========================================" Cyan
Write-Host ""
