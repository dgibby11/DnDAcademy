@echo off
REM start-map.bat — double-click to run the FAIL Academy campus map.
REM Starts a tiny local static server (Python) and opens it in your browser.
REM Close the "FAIL server" window to stop the server.

cd /d "%~dp0"

REM Launch the static server in its own window (try the py launcher, then python).
where py >nul 2>&1 && (
  start "FAIL server" cmd /c "py -m http.server 8000"
) || (
  start "FAIL server" cmd /c "python -m http.server 8000"
)

REM Give the server a moment to bind, then open the browser.
timeout /t 1 /nobreak >nul
start "" "http://localhost:8000/"
