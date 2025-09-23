import { ipcMain, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn, exec } from "child_process";
import fs from "node:fs";
const require2 = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
async function ensureCondaEnvironment() {
  return new Promise((resolve, reject) => {
    const backendDir = path.join(process.env.APP_ROOT, "backend");
    const envDir = path.join(backendDir, "NCAA-nn");
    const extractScript = path.join(backendDir, "extractEnv.bat");
    console.log("Checking for NCAA-nn environment...");
    console.log(`Environment path: ${envDir}`);
    if (fs.existsSync(envDir)) {
      console.log("NCAA-nn environment already exists.");
      resolve();
      return;
    }
    console.log("NCAA-nn environment not found. Checking for extractEnv.bat...");
    if (!fs.existsSync(extractScript)) {
      const error = `extractEnv.bat not found at: ${extractScript}`;
      console.error(error);
      reject(new Error(error));
      return;
    }
    console.log("Extracting NCAA-nn environment...");
    console.log(`Running: ${extractScript}`);
    exec(`"${extractScript}"`, {
      cwd: backendDir,
      timeout: 3e5
      // 5 minute timeout
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to extract environment: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      console.log("Environment extraction completed successfully.");
      if (stdout) {
        console.log(`Extract output: ${stdout}`);
      }
      if (stderr) {
        console.log(`Extract stderr: ${stderr}`);
      }
      if (fs.existsSync(envDir)) {
        console.log("NCAA-nn environment verified successfully.");
        resolve();
      } else {
        const error2 = "Environment extraction completed but NCAA-nn directory not found";
        console.error(error2);
        reject(new Error(error2));
      }
    });
  });
}
ipcMain.handle("predict-teams", async (_event, teamOne, teamTwo) => {
  return new Promise((resolve) => {
    const backendDir = path.join(process.env.APP_ROOT, "backend");
    const envDir = path.join(backendDir, "NCAA-nn");
    const pythonExe = path.join(envDir, "python.exe");
    const scriptPath = path.join(backendDir, "inference.py");
    const teamOneStr = String(teamOne).trim();
    const teamTwoStr = String(teamTwo).trim();
    console.log(`Starting inference: ${teamOneStr} vs ${teamTwoStr}`);
    console.log(`Team parameters - Type: ${typeof teamOne}, Value: ${teamOneStr}`);
    if (!teamOneStr || !teamTwoStr || teamOneStr === "undefined" || teamTwoStr === "undefined") {
      resolve({
        success: false,
        error: "Both team names are required and must be valid strings",
        code: "INVALID_INPUT"
      });
      return;
    }
    const pythonProcess = spawn(pythonExe, [
      scriptPath,
      "--teamOne",
      teamOneStr,
      // Use converted strings
      "--teamTwo",
      teamTwoStr
      // Use converted strings
    ], {
      cwd: backendDir,
      env: {
        ...process.env,
        PATH: `${path.join(envDir, "Scripts")};${process.env.PATH}`,
        CONDA_DEFAULT_ENV: "NCAA-nn",
        CONDA_PREFIX: envDir,
        PYTHONUNBUFFERED: "1"
      },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let isResolved = false;
    const timeout = setTimeout(() => {
      if (!isResolved) {
        pythonProcess.kill();
        isResolved = true;
        resolve({
          success: false,
          error: "Inference timed out after 45 seconds",
          code: "TIMEOUT"
        });
      }
    }, 45e3);
    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      console.log(`Python: ${output}`);
    });
    pythonProcess.stderr.on("data", (data) => {
      const output = data.toString();
      stderr += output;
      console.error(`Python Error: ${output}`);
    });
    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);
      if (isResolved) return;
      isResolved = true;
      console.log(`Python process exited with code: ${code}`);
      if (code === 0) {
        const lines = stdout.trim().split("\n");
        let jsonFilePath = null;
        for (const line of lines) {
          if (line.includes("JSON saved to:") || line.includes("JSON output saved successfully to:")) {
            const match = line.match(/JSON (?:saved to|output saved successfully to):\s*(.+)/);
            if (match && match[1]) {
              jsonFilePath = match[1].trim();
              break;
            }
          }
        }
        if (jsonFilePath) {
          resolve({
            success: true,
            filePath: jsonFilePath,
            teamOne: teamOneStr,
            // Return converted strings
            teamTwo: teamTwoStr,
            // Return converted strings
            message: "Inference completed successfully"
          });
        } else {
          resolve({
            success: false,
            error: "Inference completed but could not find JSON file path in output",
            code: "FILE_PATH_NOT_FOUND",
            stdout: stdout.trim()
          });
        }
      } else {
        resolve({
          success: false,
          error: `Inference failed with exit code ${code}`,
          code: "PYTHON_ERROR",
          stderr: stderr.trim(),
          stdout: stdout.trim()
        });
      }
    });
    pythonProcess.on("error", (error) => {
      clearTimeout(timeout);
      if (isResolved) return;
      isResolved = true;
      console.error(`Python spawn error: ${error.message}`);
      resolve({
        success: false,
        error: `Failed to start Python process: ${error.message}`,
        code: "SPAWN_ERROR",
        pythonPath: pythonExe
      });
    });
  });
});
ipcMain.handle("read-prediction-file", async (_event, filePath) => {
  return new Promise((resolve) => {
    const fs2 = require2("fs");
    console.log(`Reading prediction file: ${filePath}`);
    if (!fs2.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      resolve({
        success: false,
        error: "Prediction file not found",
        code: "FILE_NOT_FOUND"
      });
      return;
    }
    fs2.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        resolve({
          success: false,
          error: `Failed to read prediction file: ${err.message}`,
          code: "FILE_READ_ERROR"
        });
        return;
      }
      try {
        const jsonData = JSON.parse(data);
        console.log("Successfully parsed JSON data:", jsonData);
        resolve({
          success: true,
          data: jsonData
        });
      } catch (parseErr) {
        const errorMessage = parseErr instanceof Error ? parseErr.message : "Unknown JSON parse error";
        console.error(`Error parsing JSON: ${errorMessage}`);
        console.error(`Raw file content: ${data}`);
        resolve({
          success: false,
          error: `Failed to parse JSON: ${errorMessage}`,
          code: "JSON_PARSE_ERROR"
        });
      }
    });
  });
});
ipcMain.handle("clear-directory", async (event, dirPath) => {
  try {
    const resolvedPath = path.resolve(process.cwd(), dirPath);
    const fs2 = require2("fs").promises;
    if (!resolvedPath.includes(process.cwd())) {
      return { success: false, error: "Invalid directory path" };
    }
    try {
      await fs2.access(resolvedPath);
    } catch {
      return { success: true, filesDeleted: 0 };
    }
    const files = await fs2.readdir(resolvedPath);
    const deletePromises = files.map((file) => {
      const filePath = path.join(resolvedPath, file);
      return fs2.unlink(filePath);
    });
    await Promise.all(deletePromises);
    return {
      success: true,
      filesDeleted: files.length
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage
    };
  }
});
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(__dirname, "../build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.setMenuBarVisibility(false);
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.handle("list-prediction-files", async () => {
  return new Promise((resolve) => {
    const fs2 = require2("fs");
    const path2 = require2("path");
    const resultsDir = path2.join(process.env.APP_ROOT, "results");
    console.log(`Scanning results directory: ${resultsDir}`);
    if (!fs2.existsSync(resultsDir)) {
      resolve({
        success: false,
        error: "Results directory not found",
        code: "DIRECTORY_NOT_FOUND"
      });
      return;
    }
    try {
      const files = fs2.readdirSync(resultsDir);
      const predictionFiles = files.filter((file) => file.startsWith("prediction_") && file.endsWith(".json")).map((file) => {
        const filePath = path2.join(resultsDir, file);
        const match = file.match(/prediction_(\d+)\.json/);
        const timestamp = match ? parseInt(match[1]) : 0;
        return {
          filename: file,
          filepath: filePath,
          timestamp,
          date: new Date(timestamp * 1e3).toISOString()
        };
      }).sort((a, b) => b.timestamp - a.timestamp);
      console.log(`Found ${predictionFiles.length} prediction files`);
      resolve({
        success: true,
        files: predictionFiles,
        count: predictionFiles.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error reading results directory: ${errorMessage}`);
      resolve({
        success: false,
        error: `Failed to read results directory: ${errorMessage}`,
        code: "READ_ERROR"
      });
    }
  });
});
app.whenReady().then(async () => {
  try {
    console.log("App ready - checking conda environment...");
    await ensureCondaEnvironment();
    console.log("Environment check complete - creating window...");
    createWindow();
  } catch (error) {
    console.error("Failed to ensure conda environment:", error);
    const { dialog } = require2("electron");
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    dialog.showErrorBox(
      "Environment Setup Failed",
      `Failed to set up Python environment: ${errorMessage}

Please ensure extractEnv.bat is present in the backend folder.`
    );
    app.quit();
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
