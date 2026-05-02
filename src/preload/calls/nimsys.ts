import { registerCallHandler } from "../calls";

registerCallHandler<[], void>("nimsys.enter", async () => {
  /* empty */
});

registerCallHandler<[], void>("nimsys.leave", async () => {
  /* empty */
});
