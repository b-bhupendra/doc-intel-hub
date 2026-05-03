# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# Build frontend production bundle
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Python Backend & OCR Runtime
# ==========================================
FROM python:3.12-slim AS runtime

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    AI_MODE=cloud \
    PORT=8080

WORKDIR /app

# Install system runtime dependencies for Document Processing & Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend and App code
COPY backend/ /app/backend/
COPY api/ /app/api/
COPY data/ /app/data/

# Create runtime directories for persistence
RUN mkdir -p /app/data /tmp/chroma_db

# Copy compiled frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose standard Cloud Run port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Start FastAPI application using Uvicorn
CMD ["sh", "-c", "uvicorn backend.api.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
