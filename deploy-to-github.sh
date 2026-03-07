#!/bin/bash
# ============================================================
# MarketIntel AI — Deploy to GitHub
# Run this script from inside the marketintel-ai folder
# ============================================================

GITHUB_USERNAME="vibhorkumar1209"
REPO_NAME="marketintel-ai"

echo "🚀 Deploying MarketIntel AI to GitHub..."
echo ""

# 1. Rename branch to main
git branch -m master main
echo "✅ Renamed branch to 'main'"

# 2. Create the GitHub repo (requires 'gh' CLI to be logged in)
echo ""
echo "📦 Creating GitHub repository..."
gh repo create "$GITHUB_USERNAME/$REPO_NAME" \
  --public \
  --description "AI-powered market intelligence SaaS — Industry Reports & Market Datapacks" \
  --source=. \
  --remote=origin \
  --push

echo ""
echo "✅ Done! Your repo is live at:"
echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "  1. Go to https://vercel.com and import the repo"
echo "  2. Add all environment variables from .env.example"
echo "  3. Deploy!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
