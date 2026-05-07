import { exposeApi } from "../bridge/preload";

exposeApi("miniPlayer", {
  platform: process.platform,
});
