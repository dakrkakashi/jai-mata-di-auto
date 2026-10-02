@echo off
TITLE Jai Mata Di Auto - Local Development Stack
COLOR 0A

echo =========================================================
echo    JAI MATA DI AUTO - LOCAL DEVELOPMENT STACK
echo =========================================================
echo.

IF NOT EXIST "node_modules\" (
    echo [SETUP] Installing root dependencies...
    call npm install
    echo.
)

IF NOT EXIST "jmd\backend\node_modules\" (
    echo [SETUP] Installing backend dependencies...
    pushd jmd\backend
    call npm install
    popd
    echo.
)

echo [LAUNCH] Opening browser at http://localhost:5173 ...
start "" "http://localhost:5173"

echo [DEV] Starting Backend (:3000) and Frontend (:5173) ...
call npm run dev

pause
