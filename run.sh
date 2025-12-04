#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Change to script directory (project root)
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# Cleanup on exit
cleanup() {
    echo -e "\n${RED}Shutting down...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start servers
echo -e "${BLUE}🚀 Starting Biocon Vendor Search Application${NC}\n"
echo -e "${GREEN}▶ Starting Backend (port 8000)...${NC}"
(cd "$PROJECT_ROOT/backend" && uvicorn main:app --reload --port 8000) & BACKEND_PID=$!
sleep 2
(cd "$PROJECT_ROOT" && npm run dev) & FRONTEND_PID=$!

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Application is running!${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:8000${NC}"
echo -e "  Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\nPress ${RED}Ctrl+C${NC} to stop both servers\n"

wait $BACKEND_PID $FRONTEND_PID

