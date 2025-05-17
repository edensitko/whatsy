#!/bin/sh
set -e

# Backend
docker build -t edensit139/whatsy:backend-dev ./backend
docker push edensit139/whatsy:backend-dev

docker build -t edensit139/whatsy:backend-prod ./backend
docker push edensit139/whatsy:backend-prod

# Frontend
docker build -t edensit139/whatsy:frontend-dev ./frontend
docker push edensit139/whatsy:frontend-dev

docker build -t edensit139/whatsy:frontend-prod ./frontend
docker push edensit139/whatsy:frontend-prod