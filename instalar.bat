@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\rosel\Desktop\CRONO"
echo Instalando dependencias...
call npm install
echo.
echo ====================================================
echo  Instalacion completada. Para iniciar el servidor:
echo.
echo    cd C:\Users\rosel\Desktop\CRONO
echo    npm run dev
echo.
echo  O ejecuta este archivo: run-dev.bat
echo ====================================================
pause