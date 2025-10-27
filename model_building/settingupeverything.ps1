# =============================================================================
# Conda Environment Setup Script for PowerShell
# =============================================================================

# Define the name of the environment for easy reuse
$envName = "NCAA"

# --- Step 1: Create the Conda Environment ---
# Creates a new environment named "NCAA" with Python 3.11
# The -y flag automatically confirms any prompts.
Write-Host "Creating conda environment: $envName..."
conda create --name $envName python=3.11 -y

# --- Step 2: Add Conda Forge Channel ---
# Conda Forge is a community channel with a wide variety of packages.
Write-Host "Adding conda-forge to channels..."
conda config --add channels conda-forge

# --- Step 3: Install Packages from requirements.txt ---
# Uses 'conda run' to execute the command inside the specified environment.
Write-Host "Installing packages from requirements.txt into $envName..."
conda run -n $envName conda install --file requirements.txt -y

# --- Step 4: Install PyTorch with CUDA support ---
# Uses 'conda run' to execute the pip command inside the environment.
# This ensures pip uses the Python interpreter from the NCAA environment.
Write-Host "Installing PyTorch for CUDA 12.1 in $envName..."
conda run -n $envName pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu129

# --- Step 5: Install ONNX packages ---
Write-Host "Installing ONNX packages in $envName..."
conda run -n $envName pip install --upgrade onnx onnxscript

# --- Final Message ---
Write-Host "Setup complete. To activate the environment manually, run: conda activate $envName"

