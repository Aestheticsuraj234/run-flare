FROM docker.io/cloudflare/sandbox:0.5.1

# Install Node.js, TypeScript, Python, Java, and GCC toolchains

RUN apt-get update && apt-get install -y \
    nodejs npm \
    python3 python3-pip \
    openjdk-17-jdk \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript compiler globally
RUN npm install -g typescript@5.3

# Setup workspace directory
RUN mkdir -p /workspace
WORKDIR /workspace

# Add any additional environment config you need here

# Entrypoint is handled by Cloudflare sandbox runtime
