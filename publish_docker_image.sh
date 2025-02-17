docker buildx build --platform linux/amd64 --build-arg CACHE_BUST=$(date +%s) -t hishtribes/agentcoin-runtime .
docker push hishtribes/agentcoin-runtime