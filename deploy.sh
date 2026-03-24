#!/bin/bash
set -e

IMAGE="subte-finder"
CONTAINER="subte"
PORT=${PORT:-3000}

# Check .env exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Copy .env.example and fill in your credentials."
  exit 1
fi

echo "Building image..."
docker build -t $IMAGE .

# Stop and remove existing container if running
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Stopping existing container..."
  docker stop $CONTAINER
  docker rm $CONTAINER
fi

echo "Starting container on port $PORT..."
docker run -d \
  --restart unless-stopped \
  --name $CONTAINER \
  -p $PORT:3000 \
  --env-file .env \
  $IMAGE

echo ""
echo "Done! Running at http://localhost:$PORT"
echo ""
echo "  Logs:    docker logs $CONTAINER -f"
echo "  Stop:    docker stop $CONTAINER"
echo "  Restart: docker restart $CONTAINER"
