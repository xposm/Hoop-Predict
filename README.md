## Prerequisites

Before starting, ensure you have the following installed on your system:

- **Git Large File Storage (Git LFS)**  
  This project uses Git LFS to manage large files. To clone and work with the repository correctly, Git LFS must be installed on your machine.

  ### Install Git LFS
  -Download and run the installer from [https://git-lfs.github.com](https://git-lfs.github.com) or use Chocolatey:  
    ```
    choco install git-lfs
    ```

- **Node.js 18 or newer (includes npm)**  
This project requires Node.js version 18 or higher. [Download Node.js](https://nodejs.org/) if you don't have it installed.


## Getting Started

1. **Clone the repository:**
 ```
 git clone https://github.com/xposm/ncaaUI2
 cd <this-repository>
 ```
> If errors occur during cloning, please check if it is Git LFS related, and make sure to have it set up correctly.

2. **Install Vite and other dependencies:**
 ```
 npm install
 ```

4. **Run the development server:**
You can now start the Vite dev server with:
 ```
 npm run dev
 ```
