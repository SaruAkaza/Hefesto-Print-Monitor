Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obter diretorio do script
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverDir = currentDir & "\server"

' Comando para rodar o node de forma oculta (0 = janela oculta)
command = "cmd.exe /c cd /d """ & serverDir & """ && node server.js"
WshShell.Run command, 0, False

' Mensagem de confirmacao amigavel
MsgBox "O Painel de Impressoras foi iniciado com sucesso em SEGUNDO PLANO!" & vbCrLf & vbCrLf & _
       "• Acesso Local: http://localhost:3000" & vbCrLf & _
       "• Acesso Rede: http://10.1.159.240:3000" & vbCrLf & vbCrLf & _
       "Ele continuara rodando silenciosamente na memoria.", vbInformation, "Painel de Impressoras Prevent Senior"
