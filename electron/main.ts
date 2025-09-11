import { app, BrowserWindow, IpcMain, ipcMain, IpcMainInvokeEvent } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn, exec } from 'child_process'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// Function to check and extract conda environment
async function ensureCondaEnvironment(): Promise<void> {
  return new Promise((resolve, reject) => {
    const backendDir = path.join(process.env.APP_ROOT!, 'backend')
    const envDir = path.join(backendDir, 'NCAA-nn')
    const extractScript = path.join(backendDir, 'extractEnv.bat')

    console.log('Checking for NCAA-nn environment...')
    console.log(`Environment path: ${envDir}`)

    // Check if NCAA-nn environment directory exists
    if (fs.existsSync(envDir)) {
      console.log('NCAA-nn environment already exists.')
      resolve()
      return
    }

    console.log('NCAA-nn environment not found. Checking for extractEnv.bat...')

    // Check if extractEnv.bat exists
    if (!fs.existsSync(extractScript)) {
      const error = `extractEnv.bat not found at: ${extractScript}`
      console.error(error)
      reject(new Error(error))
      return
    }

    console.log('Extracting NCAA-nn environment...')
    console.log(`Running: ${extractScript}`)

    // Execute extractEnv.bat
    exec(`"${extractScript}"`, {
      cwd: backendDir,
      timeout: 300000 // 5 minute timeout
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to extract environment: ${error.message}`)
        console.error(`stderr: ${stderr}`)
        reject(error)
        return
      }

      console.log('Environment extraction completed successfully.')
      if (stdout) {
        console.log(`Extract output: ${stdout}`)
      }
      if (stderr) {
        console.log(`Extract stderr: ${stderr}`)
      }

      // Verify the environment was created
      if (fs.existsSync(envDir)) {
        console.log('NCAA-nn environment verified successfully.')
        resolve()
      } else {
        const error = 'Environment extraction completed but NCAA-nn directory not found'
        console.error(error)
        reject(new Error(error))
      }
    })
  })
}

// IPC Handler that returns file path or error
ipcMain.handle('predict-teams', async (_event, teamOne, teamTwo) => {
  return new Promise((resolve) => {
    const backendDir = path.join(process.env.APP_ROOT!, 'backend')
    const envDir = path.join(backendDir, 'NCAA-nn')
    const pythonExe = path.join(envDir, 'python.exe')
    const scriptPath = path.join(backendDir, 'inference.py')

    // Convert parameters to strings to prevent [object Object]
    const teamOneStr = String(teamOne).trim()
    const teamTwoStr = String(teamTwo).trim()

    console.log(`Starting inference: ${teamOneStr} vs ${teamTwoStr}`)
    console.log(`Team parameters - Type: ${typeof teamOne}, Value: ${teamOneStr}`)

    // Input validation with converted strings
    if (!teamOneStr || !teamTwoStr || teamOneStr === 'undefined' || teamTwoStr === 'undefined') {
      resolve({
        success: false,
        error: 'Both team names are required and must be valid strings',
        code: 'INVALID_INPUT'
      })
      return
    }

    const pythonProcess = spawn(pythonExe, [
      scriptPath,
      '--teamOne', teamOneStr,  // Use converted strings
      '--teamTwo', teamTwoStr   // Use converted strings
    ], {
      cwd: backendDir,
      env: {
        ...process.env,
        PATH: `${path.join(envDir, 'Scripts')};${process.env.PATH}`,
        CONDA_DEFAULT_ENV: 'NCAA-nn',
        CONDA_PREFIX: envDir,
        PYTHONUNBUFFERED: '1'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    let isResolved = false

    // 45 second timeout for inference
    const timeout = setTimeout(() => {
      if (!isResolved) {
        pythonProcess.kill()
        isResolved = true
        resolve({
          success: false,
          error: 'Inference timed out after 45 seconds',
          code: 'TIMEOUT'
        })
      }
    }, 45000)

    // Capture Python output
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString()
      stdout += output
      console.log(`Python: ${output}`)
    })

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString()
      stderr += output
      console.error(`Python Error: ${output}`)
    })

    // Handle process completion
    pythonProcess.on('close', (code) => {
      clearTimeout(timeout)
      if (isResolved) return
      isResolved = true

      console.log(`Python process exited with code: ${code}`)

      if (code === 0) {
        // Parse stdout to find the JSON file path
        const lines = stdout.trim().split('\n')
        let jsonFilePath = null

        // Look for the line with JSON file path
        for (const line of lines) {
          if (line.includes('JSON saved to:') || line.includes('JSON output saved successfully to:')) {
            const match = line.match(/JSON (?:saved to|output saved successfully to):\s*(.+)/)
            if (match && match[1]) {
              jsonFilePath = match[1].trim()
              break
            }
          }
        }

        if (jsonFilePath) {
          resolve({
            success: true,
            filePath: jsonFilePath,
            teamOne: teamOneStr,    // Return converted strings
            teamTwo: teamTwoStr,    // Return converted strings
            message: 'Inference completed successfully'
          })
        } else {
          resolve({
            success: false,
            error: 'Inference completed but could not find JSON file path in output',
            code: 'FILE_PATH_NOT_FOUND',
            stdout: stdout.trim()
          })
        }
      } else {
        resolve({
          success: false,
          error: `Inference failed with exit code ${code}`,
          code: 'PYTHON_ERROR',
          stderr: stderr.trim(),
          stdout: stdout.trim()
        })
      }
    })

    // Handle spawn errors
    pythonProcess.on('error', (error) => {
      clearTimeout(timeout)
      if (isResolved) return
      isResolved = true

      console.error(`Python spawn error: ${error.message}`)
      resolve({
        success: false,
        error: `Failed to start Python process: ${error.message}`,
        code: 'SPAWN_ERROR',
        pythonPath: pythonExe
      })
    })
  })
})


ipcMain.handle('read-prediction-file', async (_event, filePath) => {
  return new Promise((resolve) => {
    const fs = require('fs')
    
    console.log(`Reading prediction file: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      resolve({
        success: false,
        error: 'Prediction file not found',
        code: 'FILE_NOT_FOUND'
      });
      return;
    }

    // Read file
    fs.readFile(filePath, 'utf-8', (err: { message: any }, data: string) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        resolve({
          success: false,
          error: `Failed to read prediction file: ${err.message}`,
          code: 'FILE_READ_ERROR'
        });
        return;
      }

      try {
        const jsonData = JSON.parse(data);
        console.log('Successfully parsed JSON data:', jsonData);
        
        resolve({
          success: true,
          data: jsonData
        });
      } catch (parseErr: unknown) {
        const errorMessage = parseErr instanceof Error ? parseErr.message : 'Unknown JSON parse error';
        console.error(`Error parsing JSON: ${errorMessage}`);
        console.error(`Raw file content: ${data}`);
        resolve({
          success: false, error: `Failed to parse JSON: ${errorMessage}`,
          code: 'JSON_PARSE_ERROR'
        });
      }
    });
  });
});


// Handle clearing any directory by path parameter

ipcMain.handle('clear-directory', async (event:IpcMainInvokeEvent, dirPath:string) => {
  try {
    // Resolve the directory path relative to app root
    const resolvedPath = path.resolve(process.cwd(), dirPath);
    const fs = require('fs').promises;
    // Security check - ensure we're only clearing directories within the app
    if (!resolvedPath.includes(process.cwd())) {
      return { success: false, error: 'Invalid directory path' };
    }
    
    // Check if directory exists
    try {
      await fs.access(resolvedPath);
    } catch {
      return { success: true, filesDeleted: 0 };
    }

    // Read all files in the directory - files is string[]
    const files = await fs.readdir(resolvedPath);
    
    // Delete all files
    const deletePromises = files.map((file:string) => {
      const filePath = path.join(resolvedPath, file);
      return fs.unlink(filePath);
    });
    
    await Promise.all(deletePromises);
    
    return { 
      success: true, 
      filesDeleted: files.length 
    };
  } catch (error) {
    // Properly handle unknown error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
});



function createWindow() {
  win = new BrowserWindow({
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.setMenuBarVisibility(false); // Hide menu bar
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Add these interfaces to your main.ts for better typing
interface PredictionFileInfo {
  filename: string;
  filepath: string;
  timestamp: number;
  date: string;
}

interface ListFilesResponse {
  success: boolean;
  files?: PredictionFileInfo[];
  count?: number;
  error?: string;
  code?: string;
}

//Handler to list result files generated by predictions
ipcMain.handle('list-prediction-files', async (): Promise<ListFilesResponse> => {
  return new Promise<ListFilesResponse>((resolve) => {
    const fs = require('fs');
    const path = require('path');
    
    const resultsDir: string = path.join(process.env.APP_ROOT!, 'results');
    
    console.log(`Scanning results directory: ${resultsDir}`);
    
    if (!fs.existsSync(resultsDir)) {
      resolve({
        success: false,
        error: 'Results directory not found',
        code: 'DIRECTORY_NOT_FOUND'
      });
      return;
    }
    
    try {
      const files: string[] = fs.readdirSync(resultsDir);
      
      const predictionFiles: PredictionFileInfo[] = files
        .filter((file: string) => file.startsWith('prediction_') && file.endsWith('.json'))
        .map((file: string) => {
          const filePath: string = path.join(resultsDir, file);
          const match: RegExpMatchArray | null = file.match(/prediction_(\d+)\.json/);
          const timestamp: number = match ? parseInt(match[1]) : 0;
          
          return {
            filename: file,
            filepath: filePath,
            timestamp: timestamp,
            date: new Date(timestamp * 1000).toISOString()
          };
        })
        .sort((a: PredictionFileInfo, b: PredictionFileInfo) => b.timestamp - a.timestamp);
      
      console.log(`Found ${predictionFiles.length} prediction files`);
      
      resolve({
        success: true,
        files: predictionFiles,
        count: predictionFiles.length
      });
      
    } catch (error: unknown) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error reading results directory: ${errorMessage}`);
      resolve({
        success: false,
        error: `Failed to read results directory: ${errorMessage}`,
        code: 'READ_ERROR'
      });
    }
  });
});


app.whenReady().then(async () => {
  try {
    console.log('App ready - checking conda environment...')
    await ensureCondaEnvironment()
    console.log('Environment check complete - creating window...')
    createWindow()
  } catch (error) {
    console.error('Failed to ensure conda environment:', error)
    
    // Show error dialog to user
    const { dialog } = require('electron')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    dialog.showErrorBox(
      'Environment Setup Failed', 
      `Failed to set up Python environment: ${errorMessage}\n\nPlease ensure extractEnv.bat is present in the backend folder.`
    )
    
    // Exit the application
    app.quit()
  }
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
