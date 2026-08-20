$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "[STATUS: ONLINE]" -ForegroundColor Green
    Write-Host ("  • Processo: " + $proc.Name + " (PID: " + $conn.OwningProcess + ")")
    Write-Host ("  • Memória:  " + [math]::Round($proc.WorkingSet64 / 1MB, 2) + " MB")
    Write-Host "  • Acesso Local: http://localhost:3000"
    Write-Host "  • Acesso Rede:  http://10.1.159.240:3000"
} else {
    Write-Host "[STATUS: OFFLINE] O painel não está rodando na porta 3000." -ForegroundColor Red
}
