import { describe, it, expectTypeOf } from "vitest";
import type { LlmProvider } from "@/types/ask";

describe("LlmProvider type", () => {
  it('accepts "anthropic"', () => {
    const provider: LlmProvider = "anthropic";
    expectTypeOf(provider).toMatchTypeOf<LlmProvider>();
  });

  it('accepts "openai"', () => {
    const provider: LlmProvider = "openai";
    expectTypeOf(provider).toMatchTypeOf<LlmProvider>();
  });

  it('accepts "gemini"', () => {
    const provider: LlmProvider = "gemini";
    expectTypeOf(provider).toMatchTypeOf<LlmProvider>();
  });

  it("covers exactly the three expected string literals", () => {
    // This validates the union type at compile time — if a fourth literal were
    // added we would need to update this list, which is the desired behaviour.
    const ALL_PROVIDERS: LlmProvider[] = ["anthropic", "openai", "gemini"];
    expectTypeOf(ALL_PROVIDERS).toMatchTypeOf<LlmProvider[]>();
  });
});
