@echo off
rem One-click start: build frontend (if needed) and run the node server.
rem The server hosts the frontend, the REST API and the AI worker WebSocket.
cd /d %~dp0

if not exist .env (
    echo WARNING: .env not found, copy .env.example to .env and fill in your keys
)

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

if not exist dist\index.html (
    echo Building frontend...
    call npm run build
)

npm run server
pause
