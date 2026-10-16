import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VerifyError, verifyPhone } from "./verifymn";

const session = (expiresInMs = 300_000) => ({
  sessionId: "sess-1",
  phone: "99112233",
  shortcode: "144773",
  text: "482916",
  smsUri: "sms:144773?body=482916",
  displayInstruction: "…",
  expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
});
const status = (sessionStatus: string, expiresAt = session().expiresAt) => ({ sessionId: "sess-1", sessionStatus, expiresAt });
const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, ...init });

describe("verifyPhone", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    process.env.VERIFY_MN_API_KEY = "test-key";
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("returns true after PENDING -> VERIFIED, sending a fresh 6-digit code with the bearer key", async () => {
    fetchMock
      .mockResolvedValueOnce(json(session()))
      .mockResolvedValueOnce(json(status("PENDING")))
      .mockResolvedValueOnce(json(status("VERIFIED")));

    const onSession = vi.fn();
    await expect(verifyPhone("99112233", { intervalMs: 1, onSession })).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.verify.mn/sessions");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toMatchObject({ phone: "99112233", text: expect.stringMatching(/^\d{6}$/) });
    expect(JSON.parse(init.body).callback).toBeUndefined();
    expect(onSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns false when the session is EXPIRED", async () => {
    fetchMock.mockResolvedValueOnce(json(session())).mockResolvedValueOnce(json(status("EXPIRED")));
    await expect(verifyPhone("99112233", { intervalMs: 1 })).resolves.toBe(false);
  });

  it("returns false when expiresAt passes while still PENDING", async () => {
    const s = session(30);
    fetchMock.mockResolvedValueOnce(json(s)).mockImplementation(async () => json(status("PENDING", s.expiresAt)));
    await expect(verifyPhone("99112233", { intervalMs: 10 })).resolves.toBe(false);
  });

  it("rejects with a 401 VerifyError on a bad key", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: "unauthorized" }, { status: 401 }));
    await expect(verifyPhone("99112233")).rejects.toMatchObject({ name: "VerifyError", status: 401 });
  });

  it("fails loudly when VERIFY_MN_API_KEY is missing", async () => {
    delete process.env.VERIFY_MN_API_KEY;
    await expect(verifyPhone("99112233")).rejects.toBeInstanceOf(VerifyError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
