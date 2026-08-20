@echo off
title Encerrar Painel de Impressoras
color 0C
cls
echo ====================================================
echo      ENCERRANDO PAINEL DE IMPRESSORAS (PORTA 3000)
echo ====================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1"
echo.
pause
