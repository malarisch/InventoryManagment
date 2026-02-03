#!/bin/bash
set -o pipefail

git pull
npx next build
cp -r .next/static .next/standalone/.next/

systemctl restart invman.service
