FROM docker.io/cloudflare/sandbox:0.5.1

# Install Node.js, TypeScript, Python, Java, and GCC toolchains

RUN apt-get update && apt-get install -y \
    nodejs npm \
    python3 python3-pip \
    openjdk-17-jdk \
    g++ \
    util-linux \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript compiler globally
RUN npm install -g typescript@5.3

# Setup workspace directory
RUN mkdir -p /workspace

# Security: Create non-root user and restrict permissions
RUN useradd -m -d /home/sandboxuser -s /bin/bash sandboxuser \
    && chown -R sandboxuser:sandboxuser /workspace \
    && chmod o-r /etc/passwd /etc/shadow

WORKDIR /workspace

# Switch to non-root user
USER sandboxuser

ENV TMPDIR=/workspace

# Entrypoint is handled by Cloudflare sandbox runtime
