#!/bin/bash

# Aswan Food Delivery - Production Deployment Script
# This script deploys the application to Railway

set -e

echo "🚀 Starting Aswan Food Delivery Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    print_error "You are not logged in to Railway. Please login first:"
    echo "railway login"
    exit 1
fi

print_status "Building and deploying backend..."

# Deploy backend
cd server

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from example..."
    cp env.example .env
    print_warning "Please update .env with your actual values before deploying!"
fi

# Deploy to Railway
railway up --detach

print_success "Backend deployed successfully!"

# Get the backend URL
BACKEND_URL=$(railway domain)
print_status "Backend URL: https://$BACKEND_URL"

# Update frontend environment
cd ../client

# Create .env file for frontend
cat > .env << EOF
REACT_APP_API_URL=https://$BACKEND_URL/api
REACT_APP_ENV=production
EOF

print_success "Frontend environment updated!"

# Build frontend
print_status "Building frontend..."
npm run build

print_success "Frontend built successfully!"

# Deploy frontend to Vercel (if Vercel CLI is available)
if command -v vercel &> /dev/null; then
    print_status "Deploying frontend to Vercel..."
    vercel --prod
    print_success "Frontend deployed to Vercel!"
else
    print_warning "Vercel CLI not found. Please deploy frontend manually:"
    echo "1. Install Vercel CLI: npm install -g vercel"
    echo "2. Run: vercel --prod"
fi

print_success "🎉 Deployment completed successfully!"
print_status "Backend: https://$BACKEND_URL"
print_status "Frontend: Check Vercel dashboard for URL"

echo ""
echo "📋 Next steps:"
echo "1. Update your domain settings in Railway"
echo "2. Configure your database connection"
echo "3. Set up environment variables in Railway dashboard"
echo "4. Test your application"
echo ""
echo "🔧 Useful commands:"
echo "railway logs - View backend logs"
echo "railway status - Check deployment status"
echo "railway connect - Connect to database"

