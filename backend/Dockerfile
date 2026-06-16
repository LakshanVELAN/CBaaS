FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY backend/ .

# Make start script executable
RUN chmod +x start.sh

EXPOSE 8000

# Use the production startup script (runs migrations + collectstatic at runtime)
CMD ["./start.sh"]
