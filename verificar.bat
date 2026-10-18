@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\rosel\Desktop\CRONO"
echo Verificando compilacion...
call npx vite build 2>&1
echo.
if %ERRORLEVEL% EQU 0 (
    echo BUILD EXITOSO
) else (
    echo BUILD CON ERRORES
)
pause