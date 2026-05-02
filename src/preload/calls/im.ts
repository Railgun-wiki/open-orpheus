import { registerCallHandler } from "../calls";
import { fireNativeCall } from "../channel";

registerCallHandler<
  [
    {
      chat_roomid: string;
    },
  ],
  void
>("im.enter", (params) => {
  (async () => {
    // Lazy load SDK
    const im = (await import("../nim")).default;
    await im.connect();
    await im.joinRoom(params.chat_roomid);
    fireNativeCall("im.onEnter", { code: 200 });
  })();
});

registerCallHandler<[], void>("im.leave", async () => {
  const im = (await import("../nim")).default;
  await im.leaveRoom();
  await im.disconnect();
});
