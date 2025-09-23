$envName = "NCAA-nn"
$pythonVersion = "3.11"
$requirementsFile = "requirements.txt"

Write-Host "--- Starting Environment Setup for '$envName' ---" -ForegroundColor Cyan

if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Conda is not found in your PATH." -ForegroundColor Red
    Write-Host "Please install Anaconda or Miniconda and ensure it's accessible from PowerShell." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $requirementsFile)) {
    Write-Host "Error: '$requirementsFile' not found in the current directory." -ForegroundColor Red
    exit 1
}

$envExists = conda env list | Select-String -Pattern "\b$($envName)\b" -Quiet

if ($envExists) {
    Write-Host "Conda environment '$envName' already exists. Skipping creation." -ForegroundColor Green
} else {
    Write-Host "Creating new conda environment '$envName' with Python $pythonVersion..." -ForegroundColor Green
    try {
        conda create --name $envName python=$pythonVersion -y
    } catch {
        Write-Host "Failed to create conda environment. Please check your conda installation." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Activating '$envName' and installing packages from '$requirementsFile'..." -ForegroundColor Green

conda.exe run -n $envName pip install -r $requirementsFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "--- Environment setup completed successfully! ---" -ForegroundColor Cyan
    Write-Host "You can now activate the environment by running: conda activate $envName"
} else {
    Write-Host "--- An error occurred during package installation. ---" -ForegroundColor Red
    Write-Host "Please check the output above for details."
}
