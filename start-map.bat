@echo off
REM start-map.bat — double-click to launch TT Adventure Sessionbook.
REM Runs data integrity tests, starts a local static server, opens the browser.
REM Close the server window to stop the server.

cd /d "%~dp0"

REM ── Data integrity tests ───────────────────────────────────────────────────
where py >nul 2>&1 && (
  py tools\test.py
) || (
  python tools\test.py
)
if %ERRORLEVEL% neq 0 (
  echo.
  echo  *** Fix the errors above when you get a chance. Starting anyway... ***
  echo.
  timeout /t 3 /nobreak >nul
)

REM ── Static server ──────────────────────────────────────────────────────────
where py >nul 2>&1 && (
  start "TT Adventure Sessionbook" cmd /c "py -m http.server 8000"
) || (
  start "TT Adventure Sessionbook" cmd /c "python -m http.server 8000"
)

timeout /t 1 /nobreak >nul
start "" "http://localhost:8000/launcher.html"
