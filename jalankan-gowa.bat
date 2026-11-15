@echo off
title WABlast Pro - GOWA WhatsApp Gateway
color 0A
echo ======================================================================
echo    WABlast Pro - WhatsApp Multi-Device Gateway Engine (GOWA)
echo    Yayasan Khoirur Rooziqiin Bandung
echo ======================================================================
echo.

if not exist "%~dp0gowa-bin\gowa.exe" (
    echo [INFO] gowa.exe belum ditemukan di folder gowa-bin.
    echo [INFO] Mengunduh binary resmi GOWA untuk Windows...
    if not exist "%~dp0gowa-bin" mkdir "%~dp0gowa-bin"
    curl.exe -L -o "%~dp0gowa-bin\gowa.zip" "https://github.com/aldinokemal/go-whatsapp-web-multidevice/releases/download/v9.9.0/whatsapp_9.9.0_windows_amd64.zip"
    echo [INFO] Mengekstrak binary...
    powershell -Command "Expand-Archive -Path '%~dp0gowa-bin\gowa.zip' -DestinationPath '%~dp0gowa-bin' -Force"
    if exist "%~dp0gowa-bin\gowa.zip" del "%~dp0gowa-bin\gowa.zip"
    echo [INFO] GOWA engine berhasil disiapkan!
    echo.
)

echo  [INFO] Menjalankan server WhatsApp Gateway tanpa Docker...
echo  - Port       : 3000
echo  - URL Server : http://localhost:3000
echo  - Username   : admin
echo  - Password   : rahasia_wablast_pro
echo.
echo  Jangan tutup jendela ini selama ingin mengirim pesan WhatsApp!
echo ======================================================================
echo.

cd /d "%~dp0gowa-bin"
gowa.exe rest -p 3000 -b admin:rahasia_wablast_pro
pause
