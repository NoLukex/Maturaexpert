import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Persistent Cloud Sync Directory and Storage
  const DATA_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const SYNC_FILE = path.join(DATA_DIR, "cloud_sync.json");

  function readSyncData(): Record<string, any> {
    try {
      if (fs.existsSync(SYNC_FILE)) {
        return JSON.parse(fs.readFileSync(SYNC_FILE, "utf-8"));
      }
    } catch (err) {
      console.warn("Error reading sync file:", err);
    }
    return {};
  }

  function writeSyncData(data: Record<string, any>) {
    try {
      fs.writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.warn("Error writing sync file:", err);
    }
  }

  // Cloud Sync Endpoints
  app.get("/api/cloud/status", (_req, res) => {
    const store = readSyncData();
    res.json({
      ok: true,
      cloudActive: true,
      storageType: "server-cloud-database",
      profileCount: Object.keys(store).length
    });
  });

  app.get("/api/cloud/sync/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const cleanId = (userId || "mateusz-wisniewski").toLowerCase().trim();
      const store = readSyncData();
      const userData = store[cleanId] || null;
      return res.json({ ok: true, data: userData });
    } catch (error: any) {
      return res.status(500).json({ ok: false, error: error?.message });
    }
  });

  app.post("/api/cloud/sync/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const cleanId = (userId || "mateusz-wisniewski").toLowerCase().trim();
      const payload = req.body;
      const store = readSyncData();
      store[cleanId] = {
        ...payload,
        serverUpdatedAt: Date.now()
      };
      writeSyncData(store);
      return res.json({ ok: true, savedAt: Date.now(), userId: cleanId });
    } catch (error: any) {
      return res.status(500).json({ ok: false, error: error?.message });
    }
  });

  let aiClient: GoogleGenAI | null = null;
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  };

  const CANDIDATE_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];

  async function generateWithGemini(contents: any, config: any) {
    const ai = getAI();
    let lastError: any = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        if (response.text) {
          return { text: response.text, model };
        }
      } catch (err: any) {
        console.warn(`Model ${model} warning:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error("All Gemini models failed");
  }

  // Status check
  app.get("/api/ai/status", (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);
    res.json({
      status: "ok",
      isRealAI: true,
      provider: "Google Gemini",
      model: "gemini-3.1-flash-lite / gemini-flash-latest",
      hasKey
    });
  });

  // Chat completion endpoint (Real Gemini)
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { systemInstruction, history = [], userMessage } = req.body;
      if (!userMessage) {
        return res.status(400).json({ error: "Missing userMessage" });
      }

      const contents = [
        ...history.map((h: { role: string; content: string }) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }]
        })),
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ];

      const result = await generateWithGemini(contents, {
        systemInstruction: systemInstruction || undefined,
        temperature: 0.7,
      });

      return res.json({ text: result.text, model: result.model, isRealAI: true });
    } catch (error: any) {
      console.error("Gemini Chat API Error:", error?.message || error);
      return res.status(500).json({
        error: error?.message || "Failed to generate AI chat response",
        isRealAI: false
      });
    }
  });

  // General text/JSON completion endpoint (Real Gemini)
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction, jsonMode = false } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt" });
      }

      const result = await generateWithGemini(prompt, {
        systemInstruction: systemInstruction || undefined,
        responseMimeType: jsonMode ? "application/json" : undefined,
        temperature: jsonMode ? 0.3 : 0.7,
      });

      return res.json({ text: result.text, model: result.model, isRealAI: true });
    } catch (error: any) {
      console.error("Gemini Generate API Error:", error?.message || error);
      return res.status(500).json({
        error: error?.message || "Failed to generate AI content",
        isRealAI: false
      });
    }
  });

  // Grade writing task endpoint with CKE criteria (Real Gemini)
  app.post("/api/ai/grade-writing", async (req, res) => {
    try {
      const { topic, studentText } = req.body;
      const cleanText = typeof studentText === "string" ? studentText.trim() : "";
      if (!cleanText) {
        return res.status(400).json({ error: "Proszę wpisać tekst wypracowania przed oceną." });
      }

      const prompt = `
Jesteś certyfikowanym, oficjalnym egzaminatorem CKE (Centralna Komisja Egzaminacyjna) oceniającym wypowiedź pisemną (e-mail / wpis na blogu) na egzaminie maturalnym z języka angielskiego na poziomie podstawowym (Formuła 2023/2026).
Przeprowadź bardzo wnikliwą, dokładną analizę pracy ucznia zgodnie z oficjalnymi kryteriami CKE.

POLECENIE DO ZADANIA:
${topic || "Napisz e-mail do kolegi z Anglii (80-130 słów), rozwijając 4 podpunkty polecenia."}

TEKST NAPISANY PRZEZ UCZNIA:
"""
${cleanText}
"""

ZASADY OCENIANIA CKE:
1. Treść (0-4 pkt): Sprawdź dokładnie realizację KAŻDEGO z 4 podpunktów polecenia:
   - "rozwinięty" (podpunkt zrealizowany ze szczegółami i rozwinięciem),
   - "odniesiony" (podpunkt tylko zasygnalizowany/wspomniany jednym prostym zdaniem bez rozwinięcia),
   - "brak" (uczeń nie odniósł się do tego punktu).
   Oficjalny limit słów to 80-130 słów. Prace poniżej 80 słów podlegają obniżeniu punktów za treść wg taryfikatora CKE.
2. Spójność i logika (0-2 pkt): Akapity, spójniki (however, because, although, moreover, on the other hand, fortunately), powitanie i pożegnanie z podpisem XYZ.
3. Zakres środków językowych (0-2 pkt): Poziom B1/B1+, bogactwo słownictwa tematycznego, różnorodność struktur (Past Simple, Past Continuous, Present Perfect, modalne, spójniki).
4. Poprawność środków językowych (0-2 pkt): Brak rażących błędów gramatycznych/leksykalnych/ortograficznych. Wylicz DOKŁADNIE każdy błąd z cytatem, poprawką i regułą.
Suma = suma 4 kryteriów (od 0 do maksymalnie 10 pkt).

ZWRÓĆ ODPOWIEDŹ DOKŁADNIE W FORMACIE JSON (bez żadnego dodatkowego tekstu poza obiektem JSON):
{
  "tresc": { "punkty": 4, "komentarz": "Szczegółowy komentarz do realizacji i rozwinięcia treści" },
  "spojnosc": { "punkty": 2, "komentarz": "Komentarz do spójności, logiki, akapitów i struktury" },
  "zakres": { "punkty": 2, "komentarz": "Komentarz do zasobu słownictwa i zróżnicowania struktur" },
  "poprawnosc": { 
    "punkty": 2, 
    "komentarz": "Komentarz do poprawności gramatycznej, leksykalnej i ortograficznej",
    "bledy": ["Błąd -> Poprawka: reguła"]
  },
  "suma": 10,
  "podsumowanie": "Wyczerpujące podsumowanie z oficjalnymi uwagami egzaminatora CKE (2-4 zdania). Wskaż ocenę ogólną, najważniejsze uwagi dotyczące realizacji tematu i języka, co zadecydowało o liczbie punktów oraz kluczowe zalecenia.",
  "wskazowki": ["Konkretna wskazówka 1", "Konkretna wskazówka 2", "Konkretna wskazówka 3"],
  "podpunkty": [
    {
      "bulletNumber": 1,
      "bulletText": "Treść 1. podpunktu polecenia",
      "status": "rozwiniety",
      "cytat": "Dokładny cytat z tekstu ucznia lub 'Brak odniesienia w tekście'",
      "comment": "Wyjaśnienie oceny: czy podpunkt został tylko zasygnalizowany czy rozwinięty o szczegóły"
    },
    {
      "bulletNumber": 2,
      "bulletText": "Treść 2. podpunktu polecenia",
      "status": "rozwiniety",
      "cytat": "Cytat z tekstu",
      "comment": "Wyjaśnienie oceny"
    },
    {
      "bulletNumber": 3,
      "bulletText": "Treść 3. podpunktu polecenia",
      "status": "odniesiony",
      "cytat": "Cytat z tekstu",
      "comment": "Wyjaśnienie oceny"
    },
    {
      "bulletNumber": 4,
      "bulletText": "Treść 4. podpunktu polecenia",
      "status": "brak",
      "cytat": "Brak w tekście",
      "comment": "Wyjaśnienie oceny"
    }
  ],
  "szczegoloweBledy": [
    {
      "original": "dokładny fragment z błędem z tekstu ucznia",
      "corrected": "poprawna forma",
      "category": "gramatyka",
      "explanation": "wyjaśnienie reguły gramatycznej/leksykalnej po polsku"
    }
  ],
  "mocneStrony": [
    "Co uczeń zrobił bardzo dobrze w tej pracy (np. dobra struktura, ciekawe słówko, właściwy czas)"
  ],
  "rekomendacjeLeksykalne": [
    {
      "original": "proste słowo użyte przez ucznia (np. good)",
      "suggested": "bogatszy odpowiednik na poziomie B1/B2 (np. fantastic, magnificent, delightful)",
      "reason": "dlaczego warto zamienić i jak to podbije punkty za zakres środków"
    }
  ],
  "ulepszonaWersja": "Pełna, przeredagowana wzorcowa wersja pracy ucznia (ok. 90-110 słów) na 10/10 pkt, zachowująca jego oryginalny pomysł i sens, ale z wyeliminowanymi wszystkimi błędami i pięknym stylem maturalnym.",
  "statystykiTekstu": {
    "liczbaSlow": 105,
    "liczbaZdan": 8,
    "sredniaDlugoscZdania": 13.1,
    "poziomJezykowy": "B1",
    "zgodnoscLimituSlow": "w_normie",
    "maPowitanie": true,
    "maPozegnanie": true,
    "maAkapity": true
  }
}
`;

      const result = await generateWithGemini(prompt, {
        responseMimeType: "application/json",
        temperature: 0.2
      });

      let rawText = (result.text || "").trim();
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }
      const firstBrace = rawText.indexOf("{");
      const lastBrace = rawText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        rawText = rawText.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(rawText);
      const tresc = typeof parsed.tresc?.punkty === 'number' ? parsed.tresc.punkty : 2;
      const spojnosc = typeof parsed.spojnosc?.punkty === 'number' ? parsed.spojnosc.punkty : 1;
      const zakres = typeof parsed.zakres?.punkty === 'number' ? parsed.zakres.punkty : 1;
      const poprawnosc = typeof parsed.poprawnosc?.punkty === 'number' ? parsed.poprawnosc.punkty : 1;
      const suma = typeof parsed.suma === 'number' ? parsed.suma : (tresc + spojnosc + zakres + poprawnosc);

      // Extract raw simple errors array if present
      const rawErrorsList: string[] = Array.isArray(parsed.poprawnosc?.bledy) ? parsed.poprawnosc.bledy : [];

      // Extract detailed errors
      const detailedErrors = Array.isArray(parsed.szczegoloweBledy)
        ? parsed.szczegoloweBledy.map((err: any) => ({
            original: String(err.original || ''),
            corrected: String(err.corrected || ''),
            category: (['gramatyka', 'leksyka', 'ortografia', 'interpunkcja', 'styl'].includes(err.category)
              ? err.category
              : 'gramatyka') as any,
            explanation: String(err.explanation || '')
          })).filter((e: any) => e.original || e.corrected)
        : rawErrorsList.map(errStr => {
            const parts = errStr.split('->');
            if (parts.length > 1) {
              const [orig, rest] = parts;
              const subParts = (rest || '').split(':');
              return {
                original: orig.trim(),
                corrected: (subParts[0] || '').trim(),
                category: 'gramatyka' as const,
                explanation: (subParts[1] || '').trim() || 'Korekta językowa'
              };
            }
            return {
              original: errStr,
              corrected: '',
              category: 'gramatyka' as const,
              explanation: errStr
            };
          });

      // Synchronize simple error strings for backwards compatibility
      const finalBledy = detailedErrors.length > 0
        ? detailedErrors.map(e => `${e.original} -> ${e.corrected}: ${e.explanation}`)
        : rawErrorsList;

      // Extract bullet points analysis
      const bulletPoints = Array.isArray(parsed.podpunkty) && parsed.podpunkty.length > 0
        ? parsed.podpunkty.map((bp: any, idx: number) => ({
            bulletNumber: typeof bp.bulletNumber === 'number' ? bp.bulletNumber : idx + 1,
            bulletText: String(bp.bulletText || `Podpunkt ${idx + 1}`),
            status: (['rozwiniety', 'odniesiony', 'brak'].includes(bp.status) ? bp.status : 'odniesiony') as any,
            cytat: bp.cytat ? String(bp.cytat) : undefined,
            comment: String(bp.comment || '')
          }))
        : undefined;

      // Compute local text stats as fallback/validator
      const words = cleanText.split(/\s+/).filter(w => w.length > 0);
      const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const computedWordCount = words.length;
      const lower = cleanText.toLowerCase();

      const textStats = {
        liczbaSlow: typeof parsed.statystykiTekstu?.liczbaSlow === 'number' ? parsed.statystykiTekstu.liczbaSlow : computedWordCount,
        liczbaZdan: typeof parsed.statystykiTekstu?.liczbaZdan === 'number' ? parsed.statystykiTekstu.liczbaZdan : Math.max(1, sentences.length),
        sredniaDlugoscZdania: typeof parsed.statystykiTekstu?.sredniaDlugoscZdania === 'number'
          ? parsed.statystykiTekstu.sredniaDlugoscZdania
          : Math.round((computedWordCount / Math.max(1, sentences.length)) * 10) / 10,
        poziomJezykowy: parsed.statystykiTekstu?.poziomJezykowy || (computedWordCount >= 80 ? 'B1' : 'A2'),
        zgodnoscLimituSlow: computedWordCount < 80 ? 'za_krotki' as const : computedWordCount > 130 ? 'za_dlugi' as const : 'w_normie' as const,
        maPowitanie: typeof parsed.statystykiTekstu?.maPowitanie === 'boolean'
          ? parsed.statystykiTekstu.maPowitanie
          : /\b(hi|hello|dear|hey)\b/i.test(lower),
        maPozegnanie: typeof parsed.statystykiTekstu?.maPozegnanie === 'boolean'
          ? parsed.statystykiTekstu.maPozegnanie
          : /\b(bye|see you|write back|best wishes|regards|yours)\b/i.test(lower),
        maAkapity: typeof parsed.statystykiTekstu?.maAkapity === 'boolean'
          ? parsed.statystykiTekstu.maAkapity
          : cleanText.includes('\n')
      };

      const normalized = {
        tresc: {
          punkty: Math.min(4, Math.max(0, tresc)),
          komentarz: parsed.tresc?.komentarz || "Ocena realizacji elementów treści polecenia."
        },
        spojnosc: {
          punkty: Math.min(2, Math.max(0, spojnosc)),
          komentarz: parsed.spojnosc?.komentarz || "Ocena spójności logicznej tekstu."
        },
        zakres: {
          punkty: Math.min(2, Math.max(0, zakres)),
          komentarz: parsed.zakres?.komentarz || "Ocena różnorodności słownictwa i struktur."
        },
        poprawnosc: {
          punkty: Math.min(2, Math.max(0, poprawnosc)),
          komentarz: parsed.poprawnosc?.komentarz || "Ocena poprawności gramatycznej i leksykalnej.",
          bledy: finalBledy
        },
        suma: Math.min(10, Math.max(0, suma)),
        podsumowanie: parsed.podsumowanie || `Praca oceniona na ${suma}/10 pkt.`,
        wskazowki: Array.isArray(parsed.wskazowki) && parsed.wskazowki.length > 0
          ? parsed.wskazowki
          : ["Dbaj o limit słów 80-130.", "Rozwijaj każdy z 4 podpunktów polecenia.", "Używaj różnorodnych spójników."],
        podpunkty: bulletPoints,
        szczegoloweBledy: detailedErrors,
        mocneStrony: Array.isArray(parsed.mocneStrony) ? parsed.mocneStrony : [],
        rekomendacjeLeksykalne: Array.isArray(parsed.rekomendacjeLeksykalne) ? parsed.rekomendacjeLeksykalne : [],
        ulepszonaWersja: typeof parsed.ulepszonaWersja === 'string' && parsed.ulepszonaWersja.trim().length > 0
          ? parsed.ulepszonaWersja.trim()
          : undefined,
        statystykiTekstu: textStats
      };

      return res.json({ assessment: normalized, model: result.model, isRealAI: true });
    } catch (error: any) {
      console.error("Gemini Grade Writing API Error:", error?.message || error);
      return res.status(500).json({
        error: error?.message || "Failed to grade writing with Gemini",
        isRealAI: false
      });
    }
  });

  // Audio / TTS Proxy
  app.get("/api/tts", async (req, res) => {
    try {
      const q = req.query.q as string;
      const tl = (req.query.tl as string) || "en";
      if (!q) {
        return res.status(400).send("Missing query");
      }
      const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=${tl}&client=tw-ob`;
      const response = await fetch(targetUrl, {
        headers: {
          "Referer": "https://translate.google.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });
      if (!response.ok) {
        return res.status(response.status).send("TTS upstream error");
      }
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(Buffer.from(buffer));
    } catch (err) {
      res.status(500).send("TTS error");
    }
  });

  // Vite middleware for development vs static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
