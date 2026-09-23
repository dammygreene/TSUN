import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __clearMarketCache,
  getBTCPrice,
  getMarketOverview,
  getSOLPrice,
  getTokenHolders,
  getTokenPrice,
  toDataState,
} from "@/lib/market/providers";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  __clearMarketCache();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("market providers", () => {
  it("maps CoinGecko SOL data to a verified quote", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { solana: { usd: 212.31, usd_24h_change: 4.72, usd_market_cap: 1_000_000_000, usd_24h_vol: 50_000_000 } })),
    );
    const r = await getSOLPrice();
    expect(r.ok).toBe(true);
    expect(r.data?.priceUsd).toBe(212.31);
    expect(r.data?.change24h).toBeCloseTo(0.0472);
    expect(r.source).toBe("CoinGecko");
  });

  it("reports RATE_LIMITED on 429", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(429, { error: "slow down" })));
    const r = await getBTCPrice();
    expect(r.ok).toBe(false);
    expect(r.error).toBe("RATE_LIMITED");
    expect(toDataState(r)).toBe("error");
  });

  it("reports TIMEOUT on abort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const e = new Error("aborted");
        e.name = "AbortError";
        throw e;
      }),
    );
    const r = await getSOLPrice();
    expect(r.ok).toBe(false);
    expect(r.error).toBe("TIMEOUT");
  });

  it("reports MALFORMED_RESPONSE on bad shape", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(200, { nope: true })));
    const r = await getSOLPrice();
    expect(r.ok).toBe(false);
    expect(r.error).toBe("MALFORMED_RESPONSE");
  });

  it("dedups with fresh cache instead of refetching", async () => {
    const spy = vi.fn(async () => jsonResponse(200, { bitcoin: { usd: 90000 } }));
    vi.stubGlobal("fetch", spy);
    await getBTCPrice();
    await getBTCPrice();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("returns NOT_CONFIGURED for TSUN without a mint", async () => {
    const r = await getTokenPrice();
    expect(r.ok).toBe(false);
    expect(r.error).toBe("NOT_CONFIGURED");
    expect(toDataState(r)).toBe("unavailable");
  });

  it("returns honest holders unavailability", async () => {
    const r = await getTokenHolders();
    expect(r.ok).toBe(false);
    expect(toDataState(r)).toBe("unavailable");
  });

  it("builds a partial overview when only some providers work", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("solana")) return jsonResponse(200, { solana: { usd: 200, usd_24h_change: 6 } });
        if (url.includes("bitcoin")) return jsonResponse(200, { bitcoin: { usd: 90000, usd_24h_change: -4 } });
        return jsonResponse(500, {});
      }),
    );
    const r = await getMarketOverview();
    expect(r.ok).toBe(true);
    expect(r.data?.movers.length).toBe(2);
    expect(r.data?.sentiment).toBe("CHOP");
    expect(r.data?.tsun).toBeNull();
  });

  it("fails the overview honestly when all providers fail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, {})));
    const r = await getMarketOverview();
    expect(r.ok).toBe(false);
    expect(r.error).toBe("ALL_PROVIDERS_FAILED");
  });
});
