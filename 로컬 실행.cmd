@echo off
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0scripts\serve-preview.py"
  if errorlevel 1 pause
  exit /b
)
where python >nul 2>nul
if not errorlevel 1 (
  python "%~dp0scripts\serve-preview.py"
  if errorlevel 1 pause
  exit /b
)
echo Python 3 is required for OCR. See docs/getting-started.md.
echo You can open prototype/index.html without OCR.
pause
