#!/bin/bash

# Stop and remove existing containers, then start fresh in background
docker compose -f docker-compose.dev.yml down > /dev/null 2>&1
docker compose -f docker-compose.dev.yml up -d --build > /dev/null 2>&1

# Create a new window named "preview" (without switching to it) and attach to tirith
tmux new-window -d -n "preview" "docker compose -f docker-compose.dev.yml attach tirith"

# Run Babel in watch mode in current terminal
pnpm run build