/**
 * LLM completion helper for server-side SEO copy generation.
 *
 * Text-only, single-shot completions across OpenAI, Google Gemini, and
 * Anthropic. Provider and credentials come from environment variables — there
 * is no admin-editable AI settings surface. A missing key means the caller
 * falls back to its deterministic "formula" copy.
 */

import { logger } from "../logger";

export type AiProvider = "openai" | "google" | "anthropic";

export interface AiCompletionMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface AiCompletionInput {
	provider: AiProvider;
	model: string;
	apiKey: string;
	messages: AiCompletionMessage[];
	temperature?: number;
	maxTokens?: number;
	signal?: AbortSignal;
}

export interface AiCompletionResult {
	reply: string;
	model: string;
	provider: AiProvider;
}

export const AI_PROVIDERS: readonly AiProvider[] = ["openai", "google", "anthropic"];

const AI_DEFAULT_MODELS: Record<AiProvider, string> = {
	openai: "gpt-4o-mini",
	google: "gemini-2.5-flash-lite",
	anthropic: "claude-3-5-sonnet-latest",
};

const MAX_MODEL_OVERRIDE_LENGTH = 80;
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 900;
const REQUEST_TIMEOUT_MS = 25_000;
const ANTHROPIC_API_VERSION = "2023-06-01";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const ANTHROPIC_CHAT_URL = "https://api.anthropic.com/v1/messages";

export function normalizeAiProvider(value: unknown, fallback: AiProvider = "openai"): AiProvider {
	return value === "google" || value === "openai" || value === "anthropic" ? value : fallback;
}

function envApiKey(provider: AiProvider): string {
	if (provider === "google") {
		return process.env.GOOGLE_AI_API_KEY?.trim() ?? "";
	}
	if (provider === "anthropic") {
		return process.env.ANTHROPIC_API_KEY?.trim() ?? "";
	}
	return process.env.OPENAI_API_KEY?.trim() ?? "";
}

export function resolveAiModel(provider: AiProvider): string {
	if (provider === "google") {
		const override = process.env.GEMINI_SEO_MODEL?.trim();
		return (override || AI_DEFAULT_MODELS.google).slice(0, MAX_MODEL_OVERRIDE_LENGTH);
	}
	if (provider === "anthropic") {
		const override = process.env.ANTHROPIC_SEO_MODEL?.trim();
		return (override || AI_DEFAULT_MODELS.anthropic).slice(0, MAX_MODEL_OVERRIDE_LENGTH);
	}
	const override = process.env.OPENAI_SEO_MODEL?.trim();
	return (override || AI_DEFAULT_MODELS.openai).slice(0, MAX_MODEL_OVERRIDE_LENGTH);
}

/**
 * Pick the AI provider from `SEO_AI_PROVIDER`, or auto-detect the first
 * provider whose API key is present. Returns null when no key is configured,
 * so callers keep their formula copy instead of attempting a call.
 */
export function resolveAiProviderFromEnv(): { provider: AiProvider; apiKey: string } | null {
	const explicit = process.env.SEO_AI_PROVIDER?.trim();
	const candidates: AiProvider[] = explicit ? [normalizeAiProvider(explicit)] : [...AI_PROVIDERS];
	for (const provider of candidates) {
		const apiKey = envApiKey(provider);
		if (apiKey) {
			return { provider, apiKey };
		}
	}
	return null;
}

async function logProviderHttpError(provider: AiProvider, model: string, response: Response): Promise<void> {
	let body = "";
	try {
		body = (await response.text()).slice(0, 300);
	} catch {
		// Body already consumed or unreadable — status alone is still useful.
	}
	logger.warn({ provider, model, status: response.status, body }, "seo-ai: provider HTTP error");
}

async function callOpenAi(input: AiCompletionInput, signal: AbortSignal): Promise<string | null> {
	const response = await fetch(OPENAI_CHAT_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${input.apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: input.model,
			messages: input.messages.map((message) => ({ role: message.role, content: message.content })),
			temperature: input.temperature ?? DEFAULT_TEMPERATURE,
			max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
		}),
		signal,
	});
	if (!response.ok) {
		await logProviderHttpError("openai", input.model, response);
		return null;
	}
	const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
	return payload.choices?.[0]?.message?.content?.trim() ?? null;
}

async function callGemini(input: AiCompletionInput, signal: AbortSignal): Promise<string | null> {
	const systemMessage = input.messages.find((message) => message.role === "system");
	const contents = input.messages
		.filter((message) => message.role !== "system")
		.map((message) => ({
			role: message.role === "assistant" ? "model" : "user",
			parts: [{ text: message.content }],
		}));
	const url = `${GEMINI_BASE_URL}/${encodeURIComponent(input.model)}:generateContent`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-goog-api-key": input.apiKey,
		},
		body: JSON.stringify({
			...(systemMessage ? { systemInstruction: { parts: [{ text: systemMessage.content }] } } : {}),
			contents,
			generationConfig: {
				temperature: input.temperature ?? DEFAULT_TEMPERATURE,
				maxOutputTokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
			},
		}),
		signal,
	});
	if (!response.ok) {
		await logProviderHttpError("google", input.model, response);
		return null;
	}
	const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
	const text = (payload.candidates?.[0]?.content?.parts ?? [])
		.map((part) => part.text ?? "")
		.join("")
		.trim();
	return text || null;
}

async function callAnthropic(input: AiCompletionInput, signal: AbortSignal): Promise<string | null> {
	const systemMessage = input.messages.find((message) => message.role === "system");
	const response = await fetch(ANTHROPIC_CHAT_URL, {
		method: "POST",
		headers: {
			"x-api-key": input.apiKey,
			"anthropic-version": ANTHROPIC_API_VERSION,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: input.model,
			messages: input.messages
				.filter((message) => message.role !== "system")
				.map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.content })),
			...(systemMessage ? { system: systemMessage.content } : {}),
			temperature: input.temperature ?? DEFAULT_TEMPERATURE,
			max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
		}),
		signal,
	});
	if (!response.ok) {
		await logProviderHttpError("anthropic", input.model, response);
		return null;
	}
	const payload = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
	const text = (payload.content ?? [])
		.filter((block) => block.type === "text")
		.map((block) => block.text ?? "")
		.join("")
		.trim();
	return text || null;
}

export function isAiProviderConfigured(provider: AiProvider, apiKey?: string): boolean {
	return Boolean(apiKey?.trim() || envApiKey(provider));
}

export async function callAiCompletion(input: AiCompletionInput): Promise<AiCompletionResult | null> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	const signal = input.signal ?? controller.signal;
	try {
		let reply: string | null;
		if (input.provider === "google") {
			reply = await callGemini(input, signal);
		} else if (input.provider === "anthropic") {
			reply = await callAnthropic(input, signal);
		} else {
			reply = await callOpenAi(input, signal);
		}
		if (reply === null) {
			return null;
		}
		return { reply, model: input.model, provider: input.provider };
	} catch (error) {
		const reason = error instanceof Error && error.name === "AbortError" ? "timeout" : "network";
		logger.warn(
			{ provider: input.provider, model: input.model, reason, error: error instanceof Error ? error.message : String(error) },
			"seo-ai: provider call threw",
		);
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
