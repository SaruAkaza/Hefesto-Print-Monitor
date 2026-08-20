@echo off
chcp 65001 > nul
title Sincronização com GitHub - Painel de Impressoras

echo =======================================================
echo    SINCRONIZAR PAINEL DE IMPRESSORAS COM GITHUB
echo =======================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O Git não está instalado ou não foi encontrado no PATH do Windows.
    echo Por favor, baixe e instale o Git em: https://git-scm.com/downloads
    echo ou utilize o GitHub Desktop: https://desktop.github.com/
    echo.
    pause
    exit /b
)

echo [1/3] Verificando status dos arquivos...
git status

echo.
echo Escolha a opção desejada:
echo [1] Subir alterações para o GitHub (Commit + Push)
echo [2] Puxar a última versão do GitHub (Pull)
echo [3] Conectar a um novo repositório remoto (Set Origin)
echo [4] Sair
echo.
set /p opcao="Digite a opção (1-4): "

if "%opcao%"=="1" (
    echo.
    set /p msg="Digite a mensagem da alteração (ex: Atualização de impressoras): "
    if "%msg%"=="" set msg=Atualização do Painel de Impressoras
    git add .
    git commit -m "%msg%"
    git push origin main
    echo.
    echo [OK] Alterações enviadas para o GitHub com sucesso!
)

if "%opcao%"=="2" (
    echo.
    echo Puxando versão mais recente do GitHub...
    git pull origin main
    echo.
    echo [OK] Projeto atualizado com a última versão!
)

if "%opcao%"=="3" (
    echo.
    set /p repo="Cole a URL do repositório GitHub (ex: https://github.com/usuario/painel-impressoras.git): "
    git init
    git branch -M main
    git remote remove origin 2>nul
    git remote add origin %repo%
    git add .
    git commit -m "feat: Painel de Monitoramento de Impressoras Prevent Senior"
    git push -u origin main
    echo.
    echo [OK] Repositório conectado e código enviado com sucesso!
)

echo.
pause
