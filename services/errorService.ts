
import { OpenAI } from 'openai';

export class AIError extends Error {
    constructor(
        message: string,
        public code: string = 'AI_ERROR',
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'AIError';
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 2, // Fewer retries for heavy models
    baseDelay: number = 2000,
    backoffFactor: number = 2,
    timeout: number = 60000 // 60s timeout for 70B model
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry if it's a permanent error (e.g. 401 Unauthorized, 400 Bad Request)
            if (error instanceof OpenAI.APIError) {
                if (error.status === 401 || error.status === 400) {
                    throw error;
                }
            }

            if (attempt === maxRetries) break;

            const delay = baseDelay * Math.pow(backoffFactor, attempt);
            console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

export function handleAIError(error: any): AIError {
    console.error("AI Service Error:", error);

    if (error instanceof AIError) return error;

    if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
            return new AIError("Błąd autoryzacji API. Sprawdź klucz.", "AUTH_ERROR");
        }
        if (error.status === 429) {
            return new AIError("Przekroczono limit zapytań API.", "RATE_LIMIT");
        }
        if (error.status && error.status >= 500) {
            return new AIError("Błąd serwera AI (NVIDIA).", "SERVER_ERROR");
        }
        return new AIError(`Błąd API: ${error.message}`, "API_ERROR", { status: error.status });
    }

    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
        return new AIError("Błąd połączenia sieciowego. Sprawdź internet.", "NETWORK_ERROR");
    }

    return new AIError("Wystąpił nieoczekiwany błąd AI.", "UNKNOWN_ERROR", { originalError: error });
}
