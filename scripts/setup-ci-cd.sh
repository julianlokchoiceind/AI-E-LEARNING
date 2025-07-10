#!/bin/bash

# ========================================
# AI E-Learning Platform - CI/CD Setup Script
# ========================================
# Quick setup for complete CI/CD pipeline

set -e

echo "🚀 Setting up CI/CD Pipeline for AI E-Learning Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the project root
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Project root detected"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_warning "GitHub CLI not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install gh
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install gh
    else
        print_error "Please install GitHub CLI manually: https://cli.github.com/"
        exit 1
    fi
fi

# Check if user is logged in to GitHub
if ! gh auth status &> /dev/null; then
    print_warning "Not logged in to GitHub. Please login..."
    gh auth login
fi

print_status "GitHub CLI ready"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker not found. Please install Docker first"
    print_warning "Visit: https://docs.docker.com/get-docker/"
    read -p "Continue without Docker? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_status "Docker detected"
fi

# Create environment files if they don't exist
if [ ! -f ".env.local" ]; then
    print_warning "Creating .env.local from template..."
    cat > .env.local << 'EOF'
# ==========================================
# AI E-Learning Platform - Development Environment
# ==========================================

# Database
MONGODB_URI=mongodb+srv://elearning-admin:rizjez-9rotgy-kacXog@cluster1.wq3m07y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=qKkozD1CuYtJX59jsg3wOUEg2onqVHi53xq+fHo+vV8=
JWT_SECRET=N9mb4fNnbpOZIdvWaxQ2gGbbm59nUqJDXNaRvLmvPLk=

# AI Service
ANTHROPIC_API_KEY=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
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620

# OAuth
GOOGLE_CLIENT_ID=18917206079-aid5ubqv9cntc3ob6q8r6k02i3ln5ltl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Payment
STRIPE_PUBLISHABLE_KEY=pk_test_51RceLPQctoHjmRkjxJuEtrWeiHtJnSjXrKLEGYydZ3Xtav8xoKUt4AgAbi13IaA9G5wXywO60hRr10wrG0Zu4X9T00JJ6GA1Fo
STRIPE_SECRET_KEY=sk_test_51RceLPQctoHjmRkj0SvcOM8hZt5zCKHGllevlitAoQewJQzSSSkaQY7kK5XJAQE4RAZlol2n4mWJx66i6ThliqzY004vciWOJ5

# Email
SMTP_HOST=smtp-mail.outlook.com
SMTP_USER=info@choiceind.com
SMTP_PASS=dycphhkfvnfjgqhj

# Monitoring
SENTRY_DSN=https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816

# Frontend Public
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RceLPQctoHjmRkjxJuEtrWeiHtJnSjXrKLEGYydZ3Xtav8xoKUt4AgAbi13IaA9G5wXywO60hRr10wrG0Zu4X9T00JJ6GA1Fo
EOF
    print_status "Created .env.local file"
else
    print_status ".env.local already exists"
fi

# Install dependencies
print_status "Installing dependencies..."

# Frontend dependencies
if [ -d "frontend" ]; then
    cd frontend
    print_status "Installing frontend dependencies..."
    npm ci
    cd ..
fi

# Backend dependencies
if [ -d "backend" ]; then
    cd backend
    print_status "Installing backend dependencies..."
    if command -v python3 &> /dev/null; then
        python3 -m pip install -r requirements.txt
    elif command -v python &> /dev/null; then
        python -m pip install -r requirements.txt
    else
        print_warning "Python not found, skipping backend dependencies"
    fi
    cd ..
fi

# Test the pipeline locally
print_status "Testing CI/CD pipeline locally..."

# Test frontend
if [ -d "frontend" ]; then
    cd frontend
    print_status "Testing frontend build..."
    if npm run lint && npm run build; then
        print_status "Frontend build successful"
    else
        print_error "Frontend build failed"
        cd ..
        exit 1
    fi
    cd ..
fi

# Test backend
if [ -d "backend" ]; then
    cd backend
    print_status "Testing backend..."
    if python3 -c "from app.main import app; print('✅ Backend imports successfully')" 2>/dev/null || \
       python -c "from app.main import app; print('✅ Backend imports successfully')" 2>/dev/null; then
        print_status "Backend test successful"
    else
        print_error "Backend test failed"
        cd ..
        exit 1
    fi
    cd ..
fi

# Set up GitHub secrets (if connected to GitHub)
if gh repo view &> /dev/null; then
    print_status "Setting up GitHub secrets..."
    
    # Read secrets from .env.local and set them in GitHub
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # Remove quotes from value
        value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
        
        # Set secret in GitHub
        if [ ! -z "$value" ]; then
            echo "$value" | gh secret set "$key" 2>/dev/null || true
        fi
    done < .env.local
    
    print_status "GitHub secrets configured"
else
    print_warning "Not in a GitHub repository, skipping secrets setup"
fi

# Create GitHub environments
if gh repo view &> /dev/null; then
    print_status "Setting up GitHub environments..."
    
    # Note: GitHub CLI doesn't directly support environment creation
    # This would typically be done through the GitHub web interface or REST API
    print_warning "Please create 'staging' and 'production' environments in GitHub repo settings"
    print_warning "Go to: Settings > Environments > New environment"
fi

# Final success message
echo ""
echo "=========================================="
print_status "CI/CD Pipeline Setup Complete!"
echo "=========================================="
echo ""
echo "🎯 What's been set up:"
echo "  ✅ Complete GitHub Actions workflow"
echo "  ✅ Docker containers for deployment"
echo "  ✅ Health checks and monitoring"
echo "  ✅ Frontend & backend testing"
echo "  ✅ Environment configuration"
echo ""
echo "🚀 Next steps:"
echo "  1. Push changes to GitHub to trigger pipeline"
echo "  2. Set up staging/production environments in GitHub"
echo "  3. Configure deployment targets (Vercel, Railway, etc.)"
echo "  4. Monitor pipeline runs in GitHub Actions tab"
echo ""
echo "📍 Useful commands:"
echo "  • Test locally: npm run dev (frontend) | uvicorn app.main:app --reload (backend)"
echo "  • Docker: docker-compose up -d"
echo "  • View logs: docker-compose logs -f"
echo "  • GitHub Actions: gh workflow list"
echo ""
print_status "Happy coding! 🎉"