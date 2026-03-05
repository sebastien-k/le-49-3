import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TabularData } from "@/types/dataset";

// ---------------------------------------------------------------------------
// SDK mocks
//
// Each SDK exports a class that the production code instantiates with `new`.
// Vitest requires the mock implementation to be a regular `function` (not an
// arrow function) so that it can be called as a constructor.
//
// We wrap each constructor in `vi.fn()` with a `function` implementation so
// that Vitest tracks constructor calls via `.mock.calls` AND the function can
// be used with `new`. The inner method spies live at the top level so tests
// can configure and inspect them directly.
// ---------------------------------------------------------------------------

const anthropicCreateSpy = vi.fn();
const openaiCreateSpy = vi.fn();
const geminiGenerateSpy = vi.fn();

// Constructor spies — vi.fn() wrapping a real `function` body is the only
// pattern that gives us both `new`-ability and `.mock.calls` tracking.
const AnthropicConstructorSpy = vi.fn(function (
  this: { messages: unknown },
  _opts: unknown,
) {
  this.messages = { create: anthropicCreateSpy };
});

const OpenAIConstructorSpy = vi.fn(function (
  this: { chat: unknown },
  _opts: unknown,
) {
  this.chat = { completions: { create: openaiCreateSpy } };
});

const GoogleGenAIConstructorSpy = vi.fn(function (
  this: { models: unknown },
  _opts: unknown,
) {
  this.models = { generateContent: geminiGenerateSpy };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: AnthropicConstructorSpy,
}));

vi.mock("openai", () => ({
  default: OpenAIConstructorSpy,
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: GoogleGenAIConstructorSpy,
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const QUESTION = "Combien de communes compte la France ?";
const RAW_ANSWER = "Il y a 34 965 communes en France.";
const PROVENANCE = {
  datasetTitle: "Référentiel géographique français",
  resourceTitle: "communes-2023.csv",
};

const TABULAR_DATA: TabularData = {
  columns: ["__id", "nom", "code_insee", "population"],
  rows: [
    { __id: "1", nom: "Paris", code_insee: "75056", population: "2145906" },
    { __id: "2", nom: "Lyon", code_insee: "69123", population: "516092" },
  ],
  totalRows: 34965,
  page: 1,
  pageSize: 2,
};

// ---------------------------------------------------------------------------
// synthesizeAnswer — provider dispatch
// ---------------------------------------------------------------------------

describe("synthesizeAnswer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Anthropic
  // -------------------------------------------------------------------------

  describe("when provider is anthropic", () => {
    it("calls the Anthropic SDK and returns the text block content", async () => {
      anthropicCreateSpy.mockResolvedValueOnce({
        content: [{ type: "text", text: "La France compte 34 965 communes." }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      const result = await synthesizeAnswer(
        "anthropic",
        "sk-ant-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      expect(result).toBe("La France compte 34 965 communes.");
      expect(anthropicCreateSpy).toHaveBeenCalledOnce();
    });

    it("forwards the api key to the Anthropic constructor", async () => {
      anthropicCreateSpy.mockResolvedValueOnce({
        content: [{ type: "text", text: "OK" }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "anthropic",
        "sk-ant-mykey",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      expect(AnthropicConstructorSpy).toHaveBeenCalledOnce();
      const [[callArg]] = AnthropicConstructorSpy.mock.calls;
      expect(callArg).toEqual({ apiKey: "sk-ant-mykey" });
    });

    it("throws when Anthropic returns no text block", async () => {
      anthropicCreateSpy.mockResolvedValueOnce({ content: [] });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");

      await expect(
        synthesizeAnswer(
          "anthropic",
          "sk-ant-test",
          QUESTION,
          RAW_ANSWER,
          null,
          PROVENANCE,
        ),
      ).rejects.toThrow("Synthèse LLM : réponse vide");
    });

    it("includes the question in the prompt sent to Anthropic", async () => {
      anthropicCreateSpy.mockResolvedValueOnce({
        content: [{ type: "text", text: "OK" }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "anthropic",
        "sk-ant-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      const [[callArg]] = anthropicCreateSpy.mock.calls as [
        [{ messages: { content: string }[] }],
      ][];
      expect(callArg.messages[0].content).toContain(QUESTION);
    });

    it("includes the provenance dataset title in the prompt", async () => {
      anthropicCreateSpy.mockResolvedValueOnce({
        content: [{ type: "text", text: "OK" }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "anthropic",
        "sk-ant-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      const [[callArg]] = anthropicCreateSpy.mock.calls as [
        [{ messages: { content: string }[] }],
      ][];
      expect(callArg.messages[0].content).toContain(PROVENANCE.datasetTitle);
    });

    it("includes the provenance resource title in the prompt", async () => {
      anthropicCreateSpy.mockResolvedValueOnce({
        content: [{ type: "text", text: "OK" }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "anthropic",
        "sk-ant-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      const [[callArg]] = anthropicCreateSpy.mock.calls as [
        [{ messages: { content: string }[] }],
      ][];
      expect(callArg.messages[0].content).toContain(PROVENANCE.resourceTitle);
    });

    it("includes a data summary in the prompt when tabular data is provided", async () => {
      anthropicCreateSpy.mockResolvedValueOnce({
        content: [{ type: "text", text: "OK" }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "anthropic",
        "sk-ant-test",
        QUESTION,
        RAW_ANSWER,
        TABULAR_DATA,
        PROVENANCE,
      );

      const [[callArg]] = anthropicCreateSpy.mock.calls as [
        [{ messages: { content: string }[] }],
      ][];
      const prompt = callArg.messages[0].content;

      // Non-internal columns should be listed.
      expect(prompt).toContain("nom");
      expect(prompt).toContain("code_insee");
      // Total row count must appear.
      expect(prompt).toContain("34965");
    });

    it("truncates rawAnswer longer than 2000 characters in the prompt", async () => {
      anthropicCreateSpy.mockResolvedValueOnce({
        content: [{ type: "text", text: "OK" }],
      });

      const longRaw = "x".repeat(3000);

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "anthropic",
        "sk-ant-test",
        QUESTION,
        longRaw,
        null,
        PROVENANCE,
      );

      const [[callArg]] = anthropicCreateSpy.mock.calls as [
        [{ messages: { content: string }[] }],
      ][];
      const prompt = callArg.messages[0].content;

      expect(prompt).toContain("[...tronqué]");
      // The full untruncated string must NOT appear.
      expect(prompt).not.toContain("x".repeat(3000));
    });
  });

  // -------------------------------------------------------------------------
  // OpenAI
  // -------------------------------------------------------------------------

  describe("when provider is openai", () => {
    it("calls the OpenAI SDK and returns the message content", async () => {
      openaiCreateSpy.mockResolvedValueOnce({
        choices: [{ message: { content: "34 965 communes au total." } }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      const result = await synthesizeAnswer(
        "openai",
        "sk-openai-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      expect(result).toBe("34 965 communes au total.");
      expect(openaiCreateSpy).toHaveBeenCalledOnce();
    });

    it("forwards the api key to the OpenAI constructor", async () => {
      openaiCreateSpy.mockResolvedValueOnce({
        choices: [{ message: { content: "OK" } }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "openai",
        "sk-openai-mykey",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      expect(OpenAIConstructorSpy).toHaveBeenCalledOnce();
      const [[callArg]] = OpenAIConstructorSpy.mock.calls;
      expect(callArg).toEqual({ apiKey: "sk-openai-mykey" });
    });

    it("throws when OpenAI returns an empty choices array", async () => {
      openaiCreateSpy.mockResolvedValueOnce({ choices: [] });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");

      await expect(
        synthesizeAnswer(
          "openai",
          "sk-openai-test",
          QUESTION,
          RAW_ANSWER,
          null,
          PROVENANCE,
        ),
      ).rejects.toThrow("Synthèse LLM : réponse vide");
    });

    it("includes the question in the prompt sent to OpenAI", async () => {
      openaiCreateSpy.mockResolvedValueOnce({
        choices: [{ message: { content: "OK" } }],
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "openai",
        "sk-openai-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      const [[callArg]] = openaiCreateSpy.mock.calls as [
        [{ messages: { content: string }[] }],
      ][];
      expect(callArg.messages[0].content).toContain(QUESTION);
    });
  });

  // -------------------------------------------------------------------------
  // Gemini
  // -------------------------------------------------------------------------

  describe("when provider is gemini", () => {
    it("calls the Gemini SDK and returns the response text", async () => {
      geminiGenerateSpy.mockResolvedValueOnce({
        text: "France : 34 965 communes.",
      });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      const result = await synthesizeAnswer(
        "gemini",
        "AI-gemini-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      expect(result).toBe("France : 34 965 communes.");
      expect(geminiGenerateSpy).toHaveBeenCalledOnce();
    });

    it("forwards the api key to the GoogleGenAI constructor", async () => {
      geminiGenerateSpy.mockResolvedValueOnce({ text: "OK" });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "gemini",
        "AI-mykey",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      expect(GoogleGenAIConstructorSpy).toHaveBeenCalledOnce();
      const [[callArg]] = GoogleGenAIConstructorSpy.mock.calls;
      expect(callArg).toEqual({ apiKey: "AI-mykey" });
    });

    it("throws when Gemini returns no text", async () => {
      geminiGenerateSpy.mockResolvedValueOnce({ text: undefined });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");

      await expect(
        synthesizeAnswer(
          "gemini",
          "AI-gemini-test",
          QUESTION,
          RAW_ANSWER,
          null,
          PROVENANCE,
        ),
      ).rejects.toThrow("Synthèse LLM : réponse vide");
    });

    it("includes the question in the prompt sent to Gemini", async () => {
      geminiGenerateSpy.mockResolvedValueOnce({ text: "OK" });

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");
      await synthesizeAnswer(
        "gemini",
        "AI-gemini-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      const [[callArg]] = geminiGenerateSpy.mock.calls as [
        [{ contents: string }],
      ][];
      expect(callArg.contents).toContain(QUESTION);
    });
  });

  // -------------------------------------------------------------------------
  // Timeout
  // -------------------------------------------------------------------------

  describe("timeout behaviour", () => {
    it("rejects with a timeout error when the provider takes too long", async () => {
      vi.useFakeTimers();

      // A promise that never resolves — simulates a hung network call.
      anthropicCreateSpy.mockImplementationOnce(() => new Promise(() => {}));

      const { synthesizeAnswer } = await import("@/lib/ask/synthesis");

      const resultPromise = synthesizeAnswer(
        "anthropic",
        "sk-ant-test",
        QUESTION,
        RAW_ANSWER,
        null,
        PROVENANCE,
      );

      // Advance time past the 15 s threshold.
      vi.advanceTimersByTime(16_000);

      await expect(resultPromise).rejects.toThrow("Synthèse LLM : timeout");

      vi.useRealTimers();
    });
  });
});
