# Run Flare

Run Flare is a secure, scalable code execution engine that supports multiple programming languages with real-time updates and isolated sandboxing.

## Features

*   **Multi-language Support**: Execute code in JavaScript, TypeScript, Python, Java, C++, and more.
*   **Real-time Updates**: WebSocket integration for instant feedback.
*   **Secure Sandboxing**: Isolated execution environments using Cloudflare Workers and custom Docker containers.
*   **Modern UI**: Built with Next.js and Tailwind CSS.

## Prerequisites

*   [Docker](https://www.docker.com/get-started) installed and running.
*   [Git](https://git-scm.com/) installed.

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/run-flare.git
    cd run-flare
    ```

2.  **Start the application with Docker Compose:**

    ```bash
    docker-compose up --build
    ```

    This command will build the Docker images for both the client and the backend (including the sandbox environment) and start the services.

3.  **Access the application:**

    *   **Client (Frontend)**: Open [http://localhost:3000](http://localhost:3000) in your browser.
    *   **API (Backend)**: The API is available at [http://localhost:8787](http://localhost:8787).

## Project Structure

*   `client/`: Next.js frontend application.
*   `v1/`: Cloudflare Worker backend and sandbox logic.
*   `docker-compose.yml`: Orchestration for running the full stack locally.

## Development

To stop the services, press `Ctrl+C` in the terminal where Docker Compose is running, or run:

```bash
docker-compose down
```
