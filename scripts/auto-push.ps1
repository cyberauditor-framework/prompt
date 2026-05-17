param(
    [int]$IntervalSeconds = 60,
    [string]$Branch = "main",
    [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
}

try {
    git rev-parse --is-inside-work-tree | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "This folder is not a Git repository."
    }

    Write-Log "Auto-push started. Checking every $IntervalSeconds seconds."
    Write-Log "Target: $Remote/$Branch"

    while ($true) {
        $changes = git status --porcelain

        if (-not [string]::IsNullOrWhiteSpace($changes)) {
            Write-Log "Changes detected. Creating commit..."

            git add -A

            $staged = git diff --cached --name-only
            if ([string]::IsNullOrWhiteSpace($staged)) {
                Write-Log "No staged changes after add."
            }
            else {
                $commitMessage = "chore(auto): sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
                git commit -m $commitMessage | Out-Host

                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Pushing to $Remote/$Branch..."
                    git push $Remote $Branch | Out-Host

                    if ($LASTEXITCODE -eq 0) {
                        Write-Log "Push successful."
                    }
                    else {
                        Write-Log "Push failed. Manual intervention may be required."
                    }
                }
                else {
                    Write-Log "Commit failed."
                }
            }
        }

        Start-Sleep -Seconds $IntervalSeconds
    }
}
catch {
    Write-Error $_
    exit 1
}
