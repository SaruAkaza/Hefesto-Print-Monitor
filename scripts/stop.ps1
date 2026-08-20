$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $procId = $conn.OwningProcess
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    Write-Host ("[OK] Painel de Impressoras (PID: $procId) foi encerrado com sucesso!") -ForegroundColor Green
} else {
    Write-Host "[INFO] O painel não está em execução na porta 3000." -ForegroundColor Yellow
}
