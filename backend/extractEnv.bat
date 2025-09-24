@echo off
echo Extracting conda environment...

if not exist "NCAA-nn" (
    echo Creating NCAA-nn directory...
    mkdir NCAA-nn
    
    echo Extracting archive...
    tar -xzf NCAA-nn.tar.gz -C NCAA-nn
    
    echo Fixing environment prefixes...
    NCAA-nn\Scripts\conda-unpack.exe
    
    echo Environment extraction complete!
) else (
    echo NCAA-nn environment already exists.
)
