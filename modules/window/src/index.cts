// This module is the CJS entry point for the library.

import os from "node:os";

// The Rust addon.
import * as addon from "./load.cjs";

// Use this declaration to assign types to the addon's exports,
// which otherwise by default are `any`.
declare module "./load.cjs" {
  function dragWindow(hwnd: Buffer): void;
  function isWayland(): boolean;
  function getLastCreatedWindowId(): string | null;
  function captureNextWindowFirstCursorEnter(
    callback: (x: number, y: number) => void
  ): void;
  function createRegion(windowId: string): string | null;
  function destroyRegion(regionToken: string): boolean;
  function regionAdd(
    regionToken: string,
    x: number,
    y: number,
    w: number,
    h: number
  ): boolean;
  function regionSubtract(
    regionToken: string,
    x: number,
    y: number,
    w: number,
    h: number
  ): boolean;
  function setInputRegion(
    windowId: string,
    regionToken: string | null
  ): boolean;
}

export function dragWindow(hwnd: Buffer): void {
  addon.dragWindow(hwnd);
}

export function isWayland(): boolean {
  if (os.platform() !== "linux") {
    throw new Error("isWayland is only supported on Linux");
  }
  return addon.isWayland();
}

export function getLastCreatedWindowId(): string | null {
  if (os.platform() !== "linux") {
    throw new Error("getLastCreatedWindowId is only supported on Linux");
  }
  return addon.getLastCreatedWindowId();
}

export function captureNextWindowFirstCursorEnter(
  callback: (x: number, y: number) => void
): void {
  if (os.platform() !== "linux") {
    throw new Error(
      "captureNextWindowFirstCursorEnter is only supported on Linux"
    );
  }
  addon.captureNextWindowFirstCursorEnter(callback);
}

export function createRegion(windowId: string): string | null {
  if (os.platform() !== "linux") {
    throw new Error("createRegion is only supported on Linux");
  }
  return addon.createRegion(windowId);
}

export function destroyRegion(regionToken: string): boolean {
  if (os.platform() !== "linux") {
    throw new Error("destroyRegion is only supported on Linux");
  }
  return addon.destroyRegion(regionToken);
}

export function regionAdd(
  regionToken: string,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  if (os.platform() !== "linux") {
    throw new Error("regionAdd is only supported on Linux");
  }
  return addon.regionAdd(regionToken, x, y, w, h);
}

export function regionSubtract(
  regionToken: string,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  if (os.platform() !== "linux") {
    throw new Error("regionSubtract is only supported on Linux");
  }
  return addon.regionSubtract(regionToken, x, y, w, h);
}

export function setInputRegion(
  windowId: string,
  regionToken: string | null
): boolean {
  if (os.platform() !== "linux") {
    throw new Error("setInputRegion is only supported on Linux");
  }
  return addon.setInputRegion(windowId, regionToken);
}
