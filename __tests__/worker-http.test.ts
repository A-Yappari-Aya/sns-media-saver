import { afterEach, describe, expect, it } from "vitest";
import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startWorkerFromEnv } from "../worker/src/index.js";
import type { Server } from "node:http";

const started: Server[] = [];

afterEach(async () => {
  await Promise.all(
    started.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        })
    )
  );
});

async function listen(env: NodeJS.ProcessEnv) {
  const server = await startWorkerFromEnv({ PORT: "0", ...env });
  started.push(server);
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("expected a TCP port");
  return addr.port;
}

async function postResolve(port: number, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`http://127.0.0.1:${port}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

async function writeFakeYtDlp() {
  const dir = await mkdtemp(path.join(tmpdir(), "fake-yt-dlp-"));
  const bin = path.join(dir, "yt-dlp");
  await writeFile(
    bin,
    `#!/bin/sh
echo '{"url":"https://cdn.example/v.mp4","vcodec":"h264","ext":"mp4","title":"t","uploader":"u","width":1280,"height":720}'
`,
    { encoding: "utf8" }
  );
  await chmod(bin, 0o755);
  return bin;
}

describe("worker HTTP /resolve auth", () => {
  it("refuses to start in production without WORKER_TOKEN", async () => {
    await expect(
      startWorkerFromEnv({ NODE_ENV: "production", PORT: "0", WORKER_TOKEN: "" })
    ).rejects.toThrow(/WORKER_TOKEN is required/);
  });

  it("returns 401 without a bearer token and 400 for a disallowed host when authorized", async () => {
    const port = await listen({ NODE_ENV: "test", WORKER_TOKEN: "s3cret" });
    const unauth = await postResolve(port, { url: "https://x.com/a/status/1" });
    expect(unauth.status).toBe(401);
    expect(unauth.json.code).toBe("UNAUTHORIZED");

    const wrong = await postResolve(port, { url: "https://x.com/a/status/1" }, { Authorization: "Bearer nope!!" });
    expect(wrong.status).toBe(401);

    const badHost = await postResolve(
      port,
      { url: "https://example.com/video" },
      { Authorization: "Bearer s3cret" }
    );
    expect(badHost.status).toBe(400);
    expect(badHost.json.code).toBe("HOST_NOT_ALLOWED");
  });

  it("returns 200 from a fake yt-dlp when the request is authorized", async () => {
    const ytDlp = await writeFakeYtDlp();
    const port = await listen({ NODE_ENV: "test", WORKER_TOKEN: "s3cret", YT_DLP_PATH: ytDlp });
    const ok = await postResolve(
      port,
      { url: "https://x.com/a/status/1" },
      { Authorization: "Bearer s3cret" }
    );
    expect(ok.status).toBe(200);
    expect(ok.json.ok).toBe(true);
    expect(ok.json.platform).toBe("x");
    expect(ok.json.items[0]).toMatchObject({ type: "video", url: "https://cdn.example/v.mp4", ext: "mp4" });
  });
});
