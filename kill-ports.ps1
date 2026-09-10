# Frees the dev ports if a previous session left zombie servers behind.
# Usage: npm run clean   (or: powershell -File kill-ports.ps1)
# NOTE: keep this file pure ASCII - Windows PowerShell 5.1 misreads UTF-8 .ps1 files.
$ports = 5000, 5173
$conns = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue

if (-not $conns) {
  Write-Host "OK: Ports 5000 and 5173 are free - you can run: npm start"
} else {
  foreach ($procId in ($conns.OwningProcess | Select-Object -Unique)) {
    try {
      $name = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "Killed $name (pid $procId)"
    } catch {
      Write-Host "Could not kill process $procId : $($_.Exception.Message)"
    }
  }
  Write-Host "OK: Ports freed - you can run: npm start"
}
