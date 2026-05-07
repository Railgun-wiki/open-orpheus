import type { InputRegion } from "../../main/window";

export interface MiniPlayerContract {
  platform: NodeJS.Platform;

  dragWindow(): Promise<void>;
  setInputRegions(regions: InputRegion[]): Promise<void>;
}
