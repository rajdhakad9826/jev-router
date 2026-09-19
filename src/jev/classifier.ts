import type { InternalModel } from "../types.js";
import { score, TypeSafeClient } from "@typesafe-ai/sdk";
const client = new TypeSafeClient();

export class JevClassifier {

    async classify(query: string, models: InternalModel[]): Promise<number[]> {
        const response = await client.systemOne({
            state: { document: query },
            questions: {
                tier: score("Which model tier should handle this query?", models.map(m => m.description) as [string, string, ...string[]]),
            },
        });

        return Object.values(response.answers.tier.probabilities);
    }
}