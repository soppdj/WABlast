@echo off
title WABlast Pro - Web Application
color 0B
echo ======================================================================
echo    WABlast Pro - Frontend Web Application
echo    Yayasan Khoirur Rooziqiin Bandung
echo ======================================================================
echo.
echo  [INFO] Menjalankan aplikasi web WABlast Pro...
echo  - URL: http://localhost:5173
echo.
echo ======================================================================
echo.

cd /d "%~dp0"
npm run dev
pause
