#!/bin/bash
# Run on the Lightsail server after deploy or docker cp of uploads.
# Backend container runs as nestjs (uid 1001) and needs write access.
set -e
cd "$(dirname "$0")/.."
mkdir -p uploads
sudo chown -R 1001:1001 uploads
sudo chmod -R 775 uploads
echo "Uploads permissions fixed for nestjs (uid 1001)"
