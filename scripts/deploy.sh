#!/usr/bin/env bash
set -e

echo "export NODE_OPTIONS=--dns-result-order=ipv4first"
export NODE_OPTIONS=--dns-result-order=ipv4first
echo "Node version"
node -v
echo "Running pm2 stop brcris-nextjs"
pm2 stop brcris-nextjs || true
echo "copy env"
cp .env.example  .env
echo "npm run deploy"
npm run deploy
echo "pm2 save --force"
pm2 save --force
echo "finished!"
