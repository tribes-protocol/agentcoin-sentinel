# Building and Publishing Docker Image

To build and publish the Docker image for multiple platforms, follow these steps:

1. Make sure you have Docker installed and are logged into Docker Hub:

   ```bash
   docker buildx build --platform linux/amd64 -t hishtribes/agentcoin-runtime --push .
   ```
