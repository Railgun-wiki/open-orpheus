import { registerCallHandler } from "../calls";

registerCallHandler<[Record<string, unknown>], void>("rtc.enter", () => {
  /* empty */
});

registerCallHandler<[], [boolean]>("rtc.leave", () => {
  return [true];
});
