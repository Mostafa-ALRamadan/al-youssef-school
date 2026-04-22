#!/bin/bash

# Clean script for .next folder
echo "Cleaning .next folder..."
rm -rf .next
echo "✓ .next folder cleaned"

# Clean node_modules/.cache if exists
if [ -d "node_modules/.cache" ]; then
  echo "Cleaning node_modules/.cache..."
  rm -rf node_modules/.cache
  echo "✓ node_modules/.cache cleaned"
fi

# Clean TypeScript build info
if [ -f "*.tsbuildinfo" ]; then
  echo "Cleaning TypeScript build info..."
  rm -f *.tsbuildinfo
  echo "✓ TypeScript build info cleaned"
fi

echo "🎉 Cleanup complete!"
