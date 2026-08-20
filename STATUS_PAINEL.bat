@echo off
title Status do Painel de Impressoras
color 0A
cls
echo ====================================================
echo      STATUS DO PAINEL DE IMPRESSORAS EM SEGUNDO PLANO
echo ====================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\status.ps1"
echo.
pause
