After opening the folder, open up windows powershell. 
cd to the folder Final_deployment_seal
Open Inference.py, change the PATH variable (it is at the top of the file) to the directory of the folder
for example: PATH = r"D:\NCAA\Final_deployment_seal" 
Save the inference.py file


Download miniconda. You WILL need this in order to execute the inference script as it manages all of the libraries.
Open up windows powershell. 
enter "setting_up.ps1" and return to execute the ps1 file. 
Then activate the conda environment, type into the terminal 
conda activate NCAA-nn
You have set up everything!

To perform inference with teamname, do the following:
python Infernece.py --teamOne {TeamOneName} --teamTwo {TeamTwoName} --cuda 
{TeamOneName} and {TeamTwoName} are placeholders for the actual Teamname. Please remember to enclose them with ""
include --cuda ONLY when you use a Nvidia GPU and has cuda installed (You should already have it tbh)
The inference is still really quick even without cuda so you probabilly don't need it

The program will output the probability from each model and the overall probability