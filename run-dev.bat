@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\rosel\Desktop\CRONO"
taskkill /F /IM node.exe >nul 2>&1
call npm run dev
