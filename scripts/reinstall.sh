#!/bin/bash
# Clean and reinstall all dependencies for PodPlate Platform

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "PodPlate Platform - Clean Reinstall Script"
echo "=========================================="
echo ""

echo "Step 1: Cleaning node_modules..."
echo ""

# Remove all node_modules in services
for dir in services/*/node_modules; do
    if [ -d "$dir" ]; then
        echo "Removing $dir"
        rm -rf "$dir" 2>/dev/null || true
    fi
done

# Remove root node_modules
if [ -d "node_modules" ]; then
    echo "Removing root node_modules"
    rm -rf node_modules 2>/dev/null || true
fi

echo ""
echo "Step 2: Cleaning package-lock.json files..."
echo ""

# Remove all package-lock.json in services
for file in services/*/package-lock.json; do
    if [ -f "$file" ]; then
        echo "Removing $file"
        rm -f "$file" 2>/dev/null || true
    fi
done

# Remove root package-lock.json
if [ -f "package-lock.json" ]; then
    echo "Removing root package-lock.json"
    rm -f package-lock.json 2>/dev/null || true
fi

echo ""
echo "Step 3: Installing root dependencies..."
echo ""
npm install

echo ""
echo "Step 4: Installing service dependencies..."
echo ""

# Install dependencies for each service
for dir in services/*/; do
    if [ -f "$dir/package.json" ]; then
        echo ""
        echo "Installing dependencies for $dir"
        cd "$dir"
        npm install
        cd "$PROJECT_ROOT"
    fi
done

echo ""
echo "=========================================="
echo "Reinstall completed successfully!"
echo "=========================================="
