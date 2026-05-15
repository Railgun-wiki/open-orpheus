import dns from "node:dns";
import { randomBytes } from "node:crypto";

import { RequestError } from "got";
import type { Method } from "got";

import { registerCallHandler } from "../calls";
import { getCookies } from "../cookie";
import { deserialData, encodeAnonymousId } from "../crypto";
import client from "../request";

let globalFailCount = 0;
let globalSucCount = 0;

const ANONYMOUS_REGISTER_PATH = "/api/register/anonimous";
const MUSIC_ORIGIN = "https://music.163.com";
const ANONYMOUS_REGISTER_API_URL = `${MUSIC_ORIGIN}${ANONYMOUS_REGISTER_PATH}`;
const MUSIC_A_COOKIE_NAME = "MUSIC_A";
const MAX_ANONYMOUS_REGISTER_ATTEMPTS = 10;

export type NetworkFetchRequest = {
  url: string;
  method: Method;
  headers: Record<string, string>;
  body: string;
  retryCount: number;
  isDecrypt?: boolean;
};

export type NetworkFetchResponse = {
  code: number;
  error: string;
} & Partial<{
  globalFailCount: number;
  globalSucCount: number;
  headers: Record<string, string>;
  retryTimes: number;
  status: number;
  blob: string;
}>;

function isAnonymousRegisterRequest(url: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith("music.163.com") &&
      (parsed.pathname === ANONYMOUS_REGISTER_PATH ||
        parsed.pathname === "/eapi/register/anonimous")
    );
  } catch {
    return false;
  }
}

function createAnonymousUsername() {
  const id = randomBytes(26).toString("hex").toUpperCase();
  return Buffer.from(`${id} ${encodeAnonymousId(id)}`, "utf8").toString(
    "base64"
  );
}

function responseBodyToBlob(
  request: NetworkFetchRequest,
  responseBody: Buffer<ArrayBufferLike>
) {
  return request.isDecrypt
    ? deserialData(
        responseBody.buffer.slice(
          responseBody.byteOffset,
          responseBody.byteOffset + responseBody.byteLength
        ) as ArrayBuffer
      )
    : responseBody.toString();
}

function parseResponseCode(blob: string) {
  try {
    return JSON.parse(blob)?.code;
  } catch {
    return undefined;
  }
}

async function getMusicA() {
  try {
    const cookies = await getCookies(MUSIC_ORIGIN);
    return cookies[MUSIC_A_COOKIE_NAME] ?? null;
  } catch {
    return null;
  }
}

async function logAnonymousRegisterAttempt(attempt: number, code: unknown) {
  const musicA = await getMusicA();
  console.info("[anonymous] register", {
    attempt,
    code: code ?? null,
    MUSIC_A: Boolean(musicA),
  });
}

async function fetchRequest(request: NetworkFetchRequest, retryCount: number) {
  return await client(request.url, {
    method: request.method,
    headers: {
      ...request.headers,
    },
    body: request.body || undefined,
    throwHttpErrors: false,
    retry: {
      limit: retryCount,
      backoffLimit: 10000,
    },
    hooks: {
      beforeRetry: [
        () => {
          globalFailCount++;
        },
      ],
    },
  });
}

async function fetchAnonymousRegister() {
  return await client.post(ANONYMOUS_REGISTER_API_URL, {
    headers: {
      Accept: "*/*",
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${MUSIC_ORIGIN}/`,
    },
    body: new URLSearchParams({
      username: createAnonymousUsername(),
    }).toString(),
    throwHttpErrors: false,
    retry: {
      limit: 0,
    },
  });
}

registerCallHandler<[NetworkFetchRequest], [NetworkFetchResponse]>(
  "network.fetch",
  async (_, request): Promise<[NetworkFetchResponse]> => {
    const retryCount = request.retryCount ?? 1;
    const isAnonymousRegister = isAnonymousRegisterRequest(request.url);
    let anonymousAttempt = isAnonymousRegister ? 1 : 0;

    try {
      let response = await fetchRequest(request, retryCount);
      let responseBody = Buffer.from(response.rawBody);
      let blob = responseBodyToBlob(request, responseBody);
      let responseCode = parseResponseCode(blob);

      if (isAnonymousRegister) {
        await logAnonymousRegisterAttempt(1, responseCode);
        for (
          let attempt = 2;
          responseCode === 400 && attempt <= MAX_ANONYMOUS_REGISTER_ATTEMPTS;
          attempt++
        ) {
          anonymousAttempt = attempt;
          response = await fetchAnonymousRegister();
          responseBody = Buffer.from(response.rawBody);
          blob = responseBody.toString();
          responseCode = parseResponseCode(blob);
          await logAnonymousRegisterAttempt(attempt, responseCode);
        }
      }

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (Array.isArray(value)) {
          headers[key] = value.join(", ");
        } else if (value !== undefined) {
          headers[key] = value;
        }
      }

      globalSucCount++;

      return [
        {
          code: 0,
          blob,
          error: "",
          globalFailCount,
          globalSucCount,
          headers,
          retryTimes: retryCount - response.retryCount - 1,
          status: response.statusCode,
        },
      ];
    } catch (error) {
      if (isAnonymousRegister) {
        await logAnonymousRegisterAttempt(anonymousAttempt, null);
        console.warn("[anonymous] register failed", {
          attempt: anonymousAttempt,
          error:
            (error as Error)?.message ||
            (error ? String(error) : "Unknown error"),
        });
      }

      globalFailCount++;
      const retryTimes =
        error instanceof RequestError && error.request
          ? retryCount - error.request.retryCount - 1
          : 0;

      return [
        {
          code: 28,
          error:
            (error as Error)?.message ||
            (error ? String(error) : "Unknown error"),
          status: 0,
          blob: "",
          headers: {},
          retryTimes,
        },
      ];
    }
  }
);

registerCallHandler<
  [],
  [
    {
      dnsInvalid: boolean;
      firstDNS: string;
      inProxy: boolean;
      restricted: boolean;
      unreachable: boolean;
    },
  ]
>("network.getEnv", () => [
  {
    dnsInvalid: false,
    firstDNS: dns.getServers()[0] || "",
    inProxy: false,
    restricted: false,
    unreachable: false,
  },
]);
