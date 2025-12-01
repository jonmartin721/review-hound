FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Install package in development mode
RUN pip install -e .

# Create data directories
RUN mkdir -p /app/data /app/exports

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DATABASE_PATH=/app/data/reviews.db

# Expose port
EXPOSE 5000

# Default command: run web with scheduler
CMD ["python", "-m", "reviewhound", "web", "--host", "0.0.0.0", "--with-scheduler"]
