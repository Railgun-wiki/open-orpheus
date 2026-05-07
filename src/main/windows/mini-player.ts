import os from "node:os";
import { join } from "node:path";

import { BrowserWindow } from "electron";

import { setWindowId, setWindowInputRegion } from "../window";
import { registerIpcHandlers } from "../../bridge/register";
import { MiniPlayerContract } from "../../bridge/contracts/mini-player-api";
import { dragWindow } from "@open-orpheus/window";

let miniPlayerWindow: BrowserWindow | null = null;

export default function createMiniPlayerWindow() {
  miniPlayerWindow = new BrowserWindow({
    width: 310,
    height: 48 + 50 + 340, // Total size: Volume bar preserved + Main + List
    transparent: true,
    hasShadow: false,
    frame: false,
    resizable: true,
    show: false,
    title: "Open Orpheus Mini Player",
    webPreferences: {
      partition: "open-orpheus",
      preload: join(__dirname, "mini-player.js"),
    },
  });
  if (GUI_VITE_DEV_SERVER_URL) {
    miniPlayerWindow.loadURL(`${GUI_VITE_DEV_SERVER_URL}/mini-player`);
  } else {
    miniPlayerWindow.loadURL("gui://frontend/mini-player");
  }
  setWindowId(miniPlayerWindow, "mini_player");

  registerIpcHandlers<MiniPlayerContract>(
    miniPlayerWindow.webContents,
    "miniPlayer",
    {
      dragWindow: async () => {
        if (!miniPlayerWindow || miniPlayerWindow.isDestroyed()) return;
        const hwnd = miniPlayerWindow.getNativeWindowHandle();
        dragWindow(hwnd);
      },
      setInputRegions: async (event, regions) => {
        if (!miniPlayerWindow || miniPlayerWindow.isDestroyed()) return;
        if (os.platform() === "linux") {
          setWindowInputRegion(miniPlayerWindow, regions);
        } else {
          // In Windows/macOS, we don't need to be so specific
          if (regions.length > 0) {
            miniPlayerWindow.setIgnoreMouseEvents(true, {
              forward: true,
            });
          } else {
            miniPlayerWindow.setIgnoreMouseEvents(false);
          }
        }
      },
    }
  );
}
