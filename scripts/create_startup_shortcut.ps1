$startupPath = [System.Environment]::GetFolderPath('Startup')
$targetPath = "C:\Users\TI Prevent\Documents\Painel de Impressoras\INICIAR_EM_SEGUNDO_PLANO.vbs"
$shortcutPath = Join-Path $startupPath "Painel de Impressoras.lnk"

$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = "C:\Users\TI Prevent\Documents\Painel de Impressoras"
$shortcut.Description = "Iniciar Painel de Impressoras Automaticamente em Segundo Plano"
$shortcut.Save()

Write-Host "[OK] Atalho criado com sucesso na Inicialização do Windows!" -ForegroundColor Green
Write-Host "Caminho do Atalho: $shortcutPath" -ForegroundColor Cyan
Write-Host "Destino: $targetPath"
