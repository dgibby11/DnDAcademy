@echo off
REM start-map.bat — double-click to run the F.U.C.K.S. Academy campus map.
REM Starts a tiny local static server (Python) and opens it in your browser.
REM Close the "FUCKS server" window to stop the server.

cd /d "%~dp0"

REM Launch the static server in its own window (try the py launcher, then python).
where py >nul 2>&1 && (
  start "FUCKS server" cmd /c "py -m http.server 8000"
) || (
  start "FUCKS server" cmd /c "python -m http.server 8000"
)

REM Give the server a moment to bind, then open the browser.
timeout /t 1 /nobreak >nul
start "" "http://localhost:8000/"
