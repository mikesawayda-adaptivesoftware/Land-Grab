#!/bin/bash

# Land-Grab - Deploy Script
# This script commits changes to GitHub and pushes a new Docker image to GitHub Container Registry

set -e  # Exit on error

GITHUB_USER="mikesawayda-adaptivesoftware"
IMAGE_NAME="ghcr.io/${GITHUB_USER}/land-grab"
REPO_URL="https://github.com/mikesawayda-adaptivesoftware/Land-Grab.git"
CONTAINER_NAME="land-grab"
HOST_PORT=3089
CONTAINER_PORT=3089

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   🌍 Land-Grab - Deploy Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR"

echo -e "${YELLOW}📁 App directory: $APP_DIR${NC}"
echo ""

# Check for uncommitted changes
cd "$APP_DIR"
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    # Get commit message from user or use default
    if [ -z "$1" ]; then
        COMMIT_MSG="Update Land-Grab - $(date '+%Y-%m-%d %H:%M')"
        echo -e "${YELLOW}💬 Using default commit message: ${COMMIT_MSG}${NC}"
    else
        COMMIT_MSG="$1"
        echo -e "${YELLOW}💬 Commit message: ${COMMIT_MSG}${NC}"
    fi
    echo ""

    # Stage all changes
    echo -e "${BLUE}📦 Staging changes...${NC}"
    git add -A

    # Commit
    echo -e "${BLUE}✍️  Committing...${NC}"
    git commit -m "$COMMIT_MSG"

    # Push to GitHub
    echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
    git remote set-url origin ${REPO_URL} 2>/dev/null || git remote add origin ${REPO_URL}
    git push origin main
    echo -e "${GREEN}✅ GitHub updated successfully!${NC}"
fi
echo ""

# Build and push Docker image to GitHub Container Registry
echo -e "${BLUE}🐳 Building Docker image for linux/amd64...${NC}"
cd "$APP_DIR"

# Check if buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker buildx is not available. Please install it first.${NC}"
    exit 1
fi

# Login to GitHub Container Registry
echo -e "${BLUE}🔐 Logging into GitHub Container Registry...${NC}"
if [ -z "$GITHUB_CR_PAT" ]; then
    echo -e "${RED}❌ Error: GITHUB_CR_PAT environment variable is not set!${NC}"
    echo -e "${YELLOW}Please set it with: export GITHUB_CR_PAT='your_token_here'${NC}"
    echo -e "${YELLOW}Get a token from: https://github.com/settings/tokens${NC}"
    echo -e "${YELLOW}Required scopes: write:packages, read:packages${NC}"
    exit 1
fi
echo "$GITHUB_CR_PAT" | docker login ghcr.io -u ${GITHUB_USER} --password-stdin
echo -e "${GREEN}✅ Logged into ghcr.io${NC}"
echo ""

# Create/use buildx builder
docker buildx create --name mybuilder --use 2>/dev/null || docker buildx use mybuilder 2>/dev/null || true

# Build and push to ghcr.io
echo -e "${YELLOW}⏳ This may take a few minutes...${NC}"
docker buildx build --platform linux/amd64 -t ${IMAGE_NAME}:latest --push .

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Display the Unraid setup instructions
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   🖥️  UNRAID SETUP INSTRUCTIONS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}FIRST TIME SETUP:${NC}"
echo ""
echo -e "  1. Login to GitHub Container Registry on Unraid:"
echo ""
echo -e "     ${GREEN}gh auth token | docker login ghcr.io -u ${GITHUB_USER} --password-stdin${NC}"
echo ""
echo -e "  2. Pull the latest image:"
echo ""
echo -e "     ${GREEN}docker pull ${IMAGE_NAME}:latest${NC}"
echo ""
echo -e "  3. Stop/remove any old containers (if exists):"
echo ""
echo -e "     ${GREEN}docker rm -f ${CONTAINER_NAME} 2>/dev/null || true${NC}"
echo ""
echo -e "  4. Run the container (pass your RapidAPI key):"
echo ""
echo -e "     ${GREEN}docker run -d \\\\${NC}"
echo -e "     ${GREEN}  --name ${CONTAINER_NAME} \\\\${NC}"
echo -e "     ${GREEN}  --restart unless-stopped \\\\${NC}"
echo -e "     ${GREEN}  -p ${HOST_PORT}:${CONTAINER_PORT} \\\\${NC}"
echo -e "     ${GREEN}  -e RAPIDAPI_KEY=your_key_here \\\\${NC}"
echo -e "     ${GREEN}  ${IMAGE_NAME}:latest${NC}"
echo ""
echo -e "  5. Watch logs:"
echo ""
echo -e "     ${GREEN}docker logs -f ${CONTAINER_NAME}${NC}"
echo ""
echo -e "${YELLOW}TO UPDATE (after future deploys):${NC}"
echo ""
echo -e "     ${GREEN}docker pull ${IMAGE_NAME}:latest${NC}"
echo -e "     ${GREEN}docker rm -f ${CONTAINER_NAME} 2>/dev/null || true${NC}"
echo -e "     ${GREEN}docker run -d \\\\${NC}"
echo -e "     ${GREEN}       --name ${CONTAINER_NAME} \\\\${NC}"
echo -e "     ${GREEN}       --restart unless-stopped \\\\${NC}"
echo -e "     ${GREEN}       -p ${HOST_PORT}:${CONTAINER_PORT} \\\\${NC}"
echo -e "     ${GREEN}       -e RAPIDAPI_KEY=your_key_here \\\\${NC}"
echo -e "     ${GREEN}       ${IMAGE_NAME}:latest${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   🌐 Access: http://YOUR_SERVER_IP:${HOST_PORT}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
