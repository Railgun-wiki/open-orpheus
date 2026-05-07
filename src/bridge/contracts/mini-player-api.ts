export interface InputRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MiniPlayerContract {
  platform: NodeJS.Platform;

  dragWindow(): Promise<void>;
  setInputRegions(regions: InputRegion[]): Promise<void>;
}
