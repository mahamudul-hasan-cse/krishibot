FROM python:3.11-slim

# System deps for Pillow and the healthcheck (curl).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libjpeg62-turbo \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU-only PyTorch first (saves ~500 MB vs the default GPU build,
# which would never run on a CPU droplet anyway).
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    torch==2.2.0+cpu torchvision==0.17.0+cpu

# Install remaining deps. The torch/torchvision lines in requirements.txt
# are stripped because we already installed the CPU-only versions above.
COPY requirements.txt .
RUN grep -v -E "^(torch|torchvision)" requirements.txt > requirements.prod.txt && \
    pip install --no-cache-dir -r requirements.prod.txt

# Copy application code last so dependency layers stay cached on code changes.
COPY . .

# Run as a non-root user.
RUN useradd -m -u 1000 krishi && \
    mkdir -p /app/data && \
    chown -R krishi:krishi /app
USER krishi

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
