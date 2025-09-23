# Multi-stage build for FastAPI backend
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY --chown=appuser:appuser . .

# Create uploads directory for file storage
RUN mkdir -p uploads && chown appuser:appuser uploads

# Make sure scripts are in path
ENV PATH=/home/appuser/.local/bin:$PATH

# Switch to non-root user
USER appuser

# Expose port (Google Cloud Run will set PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8080/health')" || exit 1

# Start FastAPI with uvicorn
# Google Cloud Run will set PORT environment variable dynamically
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}