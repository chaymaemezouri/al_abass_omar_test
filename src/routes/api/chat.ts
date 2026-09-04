import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { programContext } from "@/data/program";

type ChatRequestBody = {
  messages?: { role: "user" | "assistant"; content: string }[];
};

const systemPrompt = `Tu es l'assistant officiel de la campagne électorale décrite ci-dessous (élections législatives 2026 au Maroc).

RÈGLES ABSOLUES :
1. Tu réponds EXCLUSIVEMENT à partir du contenu du programme ci-dessous. Tu n'inventes jamais de chiffre, de mesure, de date ou de promesse.
2. Si la question sort du programme (autres partis, religion, polémique, vie privée, sujets généraux), tu réponds poliment que tu ne peux répondre qu'au sujet du programme, et tu proposes un axe du programme.
3. Tu détectes la langue et le registre du message de l'utilisateur et tu réponds EXACTEMENT dans le même registre :
   - Français -> réponse en français
   - Arabe standard (fusha) -> réponse en fusha
   - Darija marocaine en caractères arabes -> réponse en darija marocaine (caractères arabes)
   - Darija en arabizi (3, 7, 9, chiffres-lettres) -> réponse en arabizi darija
4. Ton respectueux, clair, institutionnel, jamais agressif ni partisan envers d'autres partis.
5. Réponses courtes et structurées (3 à 6 lignes, listes à puces si utile).

PROGRAMME ÉLECTORAL OFFICIEL :
${programContext}`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);

        try {
          const result = streamText({
            model: gateway("google/gemini-3.6-flash"),
            system: systemPrompt,
            messages: messages.slice(-20).map((m) => ({
              role: m.role,
              content: String(m.content ?? "").slice(0, 4000),
            })) as ModelMessage[],
          });

          return result.toTextStreamResponse({
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        } catch (error) {
          const status =
            typeof error === "object" && error !== null && "statusCode" in error
              ? Number((error as { statusCode?: number }).statusCode) || 500
              : 500;
          const message =
            status === 429
              ? "Trop de demandes, merci de réessayer dans un instant."
              : status === 402
                ? "Le service d'assistance est momentanément indisponible (crédits épuisés)."
                : "Une erreur est survenue. Merci de réessayer.";
          return new Response(message, { status });
        }
      },
    },
  },
});
