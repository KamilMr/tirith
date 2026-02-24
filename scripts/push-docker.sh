#!/bin/zsh

VERSION=$(node -p "require('./package.json').version")
echo $VERSION

YOUR_USERNAME=kamilmrowka

docker build -t $YOUR_USERNAME/tirith:$VERSION -t $YOUR_USERNAME/tirith:latest . && \
  docker push $YOUR_USERNAME/tirith:$VERSION && \
  docker push $YOUR_USERNAME/tirith:latest

