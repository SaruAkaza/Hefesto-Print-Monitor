@echo off
title Painel de Monitoramento de Impressoras
color 0B
cls
echo ====================================================
echo    INICIANDO PAINEL DE MONITORAMENTO DE IMPRESSORAS
echo ====================================================
echo.
echo [1/2] Verificando dependencias...
cd /d "%~dp0\server"
if not exist node_modules (
    echo Instalando modulos do Node.js...
    npm install
)

echo.
echo [2/2] Iniciando Servidor...
echo.
echo O painel ficara disponivel para toda a sua rede local!
echo Para fechar o servidor, basta fechar esta janela.
echo.
node server.js
pause
