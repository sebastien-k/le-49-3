import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PROVIDERS, getActiveProviderFromStorage } from "@/lib/llm/providers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an in-memory localStorage mock and install it on `window`.
 * Returns helpers to set/clear individual keys.
 */
function createLocalStorageMock() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

// ---------------------------------------------------------------------------
// PROVIDERS constant
// ---------------------------------------------------------------------------

describe("PROVIDERS constant", () => {
  it("contains exactly 3 entries", () => {
    expect(PROVIDERS).toHaveLength(3);
  });

  it('first entry has id "anthropic"', () => {
    expect(PROVIDERS[0].id).toBe("anthropic");
  });

  it('second entry has id "openai"', () => {
    expect(PROVIDERS[1].id).toBe("openai");
  });

  it('third entry has id "gemini"', () => {
    expect(PROVIDERS[2].id).toBe("gemini");
  });

  it("every entry has the required shape", () => {
    const requiredKeys: (keyof (typeof PROVIDERS)[number])[] = [
      "id",
      "label",
      "model",
      "placeholder",
      "consoleUrl",
      "consoleLabel",
      "storageKey",
      "instructions",
    ];
    for (const provider of PROVIDERS) {
      for (const key of requiredKeys) {
        expect(provider[key], `${provider.id}.${key} must be a non-empty string`)
          .toBeTypeOf("string");
        expect(provider[key]).not.toBe("");
      }
    }
  });

  it("each storageKey is unique", () => {
    const keys = PROVIDERS.map((p) => p.storageKey);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------------
// getActiveProviderFromStorage
// ---------------------------------------------------------------------------

describe("getActiveProviderFromStorage", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    // Install the mock on the global window so the function under test can
    // reach it via `localStorage`.
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it("returns null when localStorage is empty", () => {
    const result = getActiveProviderFromStorage();
    expect(result).toBeNull();
  });

  it("returns the anthropic provider when only its key is stored", () => {
    localStorageMock.setItem("le-49-3-anthropic-key", "sk-ant-test");

    const result = getActiveProviderFromStorage();

    expect(result).not.toBeNull();
    expect(result!.provider).toBe("anthropic");
    expect(result!.apiKey).toBe("sk-ant-test");
    expect(result!.config.id).toBe("anthropic");
  });

  it("returns the openai provider when only its key is stored", () => {
    localStorageMock.setItem("le-49-3-openai-key", "sk-openai-test");

    const result = getActiveProviderFromStorage();

    expect(result).not.toBeNull();
    expect(result!.provider).toBe("openai");
    expect(result!.apiKey).toBe("sk-openai-test");
    expect(result!.config.id).toBe("openai");
  });

  it("returns the gemini provider when only its key is stored", () => {
    localStorageMock.setItem("le-49-3-gemini-key", "AI-gemini-test");

    const result = getActiveProviderFromStorage();

    expect(result).not.toBeNull();
    expect(result!.provider).toBe("gemini");
    expect(result!.apiKey).toBe("AI-gemini-test");
    expect(result!.config.id).toBe("gemini");
  });

  it("respects priority order: anthropic wins over openai and gemini", () => {
    localStorageMock.setItem("le-49-3-anthropic-key", "sk-ant-first");
    localStorageMock.setItem("le-49-3-openai-key", "sk-openai-second");
    localStorageMock.setItem("le-49-3-gemini-key", "AI-gemini-third");

    const result = getActiveProviderFromStorage();

    expect(result!.provider).toBe("anthropic");
    expect(result!.apiKey).toBe("sk-ant-first");
  });

  it("respects priority order: openai wins over gemini when anthropic is absent", () => {
    localStorageMock.setItem("le-49-3-openai-key", "sk-openai-test");
    localStorageMock.setItem("le-49-3-gemini-key", "AI-gemini-test");

    const result = getActiveProviderFromStorage();

    expect(result!.provider).toBe("openai");
    expect(result!.apiKey).toBe("sk-openai-test");
  });

  it("returns null when all stored values are empty strings", () => {
    // localStorage.getItem returns the stored string — an empty string is falsy
    // so the function should skip it and return null.
    localStorageMock.setItem("le-49-3-anthropic-key", "");
    localStorageMock.setItem("le-49-3-openai-key", "");
    localStorageMock.setItem("le-49-3-gemini-key", "");

    const result = getActiveProviderFromStorage();

    expect(result).toBeNull();
  });

  it("returned config matches the corresponding PROVIDERS entry exactly", () => {
    localStorageMock.setItem("le-49-3-openai-key", "sk-openai-test");

    const result = getActiveProviderFromStorage();
    const expected = PROVIDERS.find((p) => p.id === "openai");

    expect(result!.config).toEqual(expected);
  });

  it("returns null when window is undefined (SSR simulation)", () => {
    // Temporarily hide `window` to simulate a server-side environment.
    const originalWindow = global.window;
    // @ts-expect-error — intentionally deleting window for SSR test
    delete global.window;

    const result = getActiveProviderFromStorage();
    expect(result).toBeNull();

    global.window = originalWindow;
  });
});
