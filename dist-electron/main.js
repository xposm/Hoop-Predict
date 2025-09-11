import { ipcMain as R, app as E, BrowserWindow as T } from "electron";
import { createRequire as D } from "node:module";
import { fileURLToPath as I } from "node:url";
import c from "node:path";
import { spawn as F, exec as j } from "child_process";
import _ from "node:fs";
const h = D(import.meta.url), A = c.dirname(I(import.meta.url));
process.env.APP_ROOT = c.join(A, "..");
const v = process.env.VITE_DEV_SERVER_URL, M = c.join(process.env.APP_ROOT, "dist-electron"), $ = c.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = v ? c.join(process.env.APP_ROOT, "public") : $;
let p;
async function b() {
  return new Promise((a, s) => {
    const e = c.join(process.env.APP_ROOT, "backend"), n = c.join(e, "NCAA-nn"), t = c.join(e, "extractEnv.bat");
    if (console.log("Checking for NCAA-nn environment..."), console.log(`Environment path: ${n}`), _.existsSync(n)) {
      console.log("NCAA-nn environment already exists."), a();
      return;
    }
    if (console.log("NCAA-nn environment not found. Checking for extractEnv.bat..."), !_.existsSync(t)) {
      const o = `extractEnv.bat not found at: ${t}`;
      console.error(o), s(new Error(o));
      return;
    }
    console.log("Extracting NCAA-nn environment..."), console.log(`Running: ${t}`), j(`"${t}"`, {
      cwd: e,
      timeout: 3e5
      // 5 minute timeout
    }, (o, r, i) => {
      if (o) {
        console.error(`Failed to extract environment: ${o.message}`), console.error(`stderr: ${i}`), s(o);
        return;
      }
      if (console.log("Environment extraction completed successfully."), r && console.log(`Extract output: ${r}`), i && console.log(`Extract stderr: ${i}`), _.existsSync(n))
        console.log("NCAA-nn environment verified successfully."), a();
      else {
        const l = "Environment extraction completed but NCAA-nn directory not found";
        console.error(l), s(new Error(l));
      }
    });
  });
}
R.handle("predict-teams", async (a, s, e) => new Promise((n) => {
  const t = c.join(process.env.APP_ROOT, "backend"), o = c.join(t, "NCAA-nn"), r = c.join(o, "python.exe"), i = c.join(t, "inference.py"), l = String(s).trim(), u = String(e).trim();
  if (console.log(`Starting inference: ${l} vs ${u}`), console.log(`Team parameters - Type: ${typeof s}, Value: ${l}`), !l || !u || l === "undefined" || u === "undefined") {
    n({
      success: !1,
      error: "Both team names are required and must be valid strings",
      code: "INVALID_INPUT"
    });
    return;
  }
  const g = F(r, [
    i,
    "--teamOne",
    l,
    // Use converted strings
    "--teamTwo",
    u
    // Use converted strings
  ], {
    cwd: t,
    env: {
      ...process.env,
      PATH: `${c.join(o, "Scripts")};${process.env.PATH}`,
      CONDA_DEFAULT_ENV: "NCAA-nn",
      CONDA_PREFIX: o,
      PYTHONUNBUFFERED: "1"
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  let y = "", S = "", m = !1;
  const N = setTimeout(() => {
    m || (g.kill(), m = !0, n({
      success: !1,
      error: "Inference timed out after 45 seconds",
      code: "TIMEOUT"
    }));
  }, 45e3);
  g.stdout.on("data", (d) => {
    const f = d.toString();
    y += f, console.log(`Python: ${f}`);
  }), g.stderr.on("data", (d) => {
    const f = d.toString();
    S += f, console.error(`Python Error: ${f}`);
  }), g.on("close", (d) => {
    if (clearTimeout(N), !m)
      if (m = !0, console.log(`Python process exited with code: ${d}`), d === 0) {
        const f = y.trim().split(`
`);
        let P = null;
        for (const w of f)
          if (w.includes("JSON saved to:") || w.includes("JSON output saved successfully to:")) {
            const O = w.match(/JSON (?:saved to|output saved successfully to):\s*(.+)/);
            if (O && O[1]) {
              P = O[1].trim();
              break;
            }
          }
        n(P ? {
          success: !0,
          filePath: P,
          teamOne: l,
          // Return converted strings
          teamTwo: u,
          // Return converted strings
          message: "Inference completed successfully"
        } : {
          success: !1,
          error: "Inference completed but could not find JSON file path in output",
          code: "FILE_PATH_NOT_FOUND",
          stdout: y.trim()
        });
      } else
        n({
          success: !1,
          error: `Inference failed with exit code ${d}`,
          code: "PYTHON_ERROR",
          stderr: S.trim(),
          stdout: y.trim()
        });
  }), g.on("error", (d) => {
    clearTimeout(N), !m && (m = !0, console.error(`Python spawn error: ${d.message}`), n({
      success: !1,
      error: `Failed to start Python process: ${d.message}`,
      code: "SPAWN_ERROR",
      pythonPath: r
    }));
  });
}));
R.handle("read-prediction-file", async (a, s) => new Promise((e) => {
  const n = h("fs");
  if (console.log(`Reading prediction file: ${s}`), !n.existsSync(s)) {
    console.error(`File not found: ${s}`), e({
      success: !1,
      error: "Prediction file not found",
      code: "FILE_NOT_FOUND"
    });
    return;
  }
  n.readFile(s, "utf-8", (t, o) => {
    if (t) {
      console.error(`Error reading file: ${t.message}`), e({
        success: !1,
        error: `Failed to read prediction file: ${t.message}`,
        code: "FILE_READ_ERROR"
      });
      return;
    }
    try {
      const r = JSON.parse(o);
      console.log("Successfully parsed JSON data:", r), e({
        success: !0,
        data: r
      });
    } catch (r) {
      const i = r instanceof Error ? r.message : "Unknown JSON parse error";
      console.error(`Error parsing JSON: ${i}`), console.error(`Raw file content: ${o}`), e({
        success: !1,
        error: `Failed to parse JSON: ${i}`,
        code: "JSON_PARSE_ERROR"
      });
    }
  });
}));
R.handle("clear-directory", async (a, s) => {
  try {
    const e = c.resolve(process.cwd(), s), n = h("fs").promises;
    if (!e.includes(process.cwd()))
      return { success: !1, error: "Invalid directory path" };
    try {
      await n.access(e);
    } catch {
      return { success: !0, filesDeleted: 0 };
    }
    const t = await n.readdir(e), o = t.map((r) => {
      const i = c.join(e, r);
      return n.unlink(i);
    });
    return await Promise.all(o), {
      success: !0,
      filesDeleted: t.length
    };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error occurred"
    };
  }
});
function x() {
  p = new T({
    icon: c.join(A, "../build/icon.ico"),
    webPreferences: {
      preload: c.join(A, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), p.webContents.on("did-finish-load", () => {
    p?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), v ? p.loadURL(v) : (p.setMenuBarVisibility(!1), p.loadFile(c.join($, "index.html")));
}
R.handle("list-prediction-files", async () => new Promise((a) => {
  const s = h("fs"), e = h("path"), n = e.join(process.env.APP_ROOT, "results");
  if (console.log(`Scanning results directory: ${n}`), !s.existsSync(n)) {
    a({
      success: !1,
      error: "Results directory not found",
      code: "DIRECTORY_NOT_FOUND"
    });
    return;
  }
  try {
    const o = s.readdirSync(n).filter((r) => r.startsWith("prediction_") && r.endsWith(".json")).map((r) => {
      const i = e.join(n, r), l = r.match(/prediction_(\d+)\.json/), u = l ? parseInt(l[1]) : 0;
      return {
        filename: r,
        filepath: i,
        timestamp: u,
        date: new Date(u * 1e3).toISOString()
      };
    }).sort((r, i) => i.timestamp - r.timestamp);
    console.log(`Found ${o.length} prediction files`), a({
      success: !0,
      files: o,
      count: o.length
    });
  } catch (t) {
    const o = t instanceof Error ? t.message : "Unknown error";
    console.error(`Error reading results directory: ${o}`), a({
      success: !1,
      error: `Failed to read results directory: ${o}`,
      code: "READ_ERROR"
    });
  }
}));
E.whenReady().then(async () => {
  try {
    console.log("App ready - checking conda environment..."), await b(), console.log("Environment check complete - creating window..."), x();
  } catch (a) {
    console.error("Failed to ensure conda environment:", a);
    const { dialog: s } = h("electron"), e = a instanceof Error ? a.message : "Unknown error occurred";
    s.showErrorBox(
      "Environment Setup Failed",
      `Failed to set up Python environment: ${e}

Please ensure extractEnv.bat is present in the backend folder.`
    ), E.quit();
  }
});
E.on("window-all-closed", () => {
  process.platform !== "darwin" && (E.quit(), p = null);
});
E.on("activate", () => {
  T.getAllWindows().length === 0 && x();
});
export {
  M as MAIN_DIST,
  $ as RENDERER_DIST,
  v as VITE_DEV_SERVER_URL
};
