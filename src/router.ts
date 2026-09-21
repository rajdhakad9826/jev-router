import type { ModelConfig, RouterConfig, RouterResult } from "./types.js";
import { JevClassifier } from "./jev/classifier.js";
import { selectBestTier } from "./core/selection.js";

export class Router {
    private config: RouterConfig;
    private classifier: JevClassifier
    private minUpgrade: number;
    private minDowngrade: number;

    constructor(config: RouterConfig) {
        this.config = config;
        this.validateModels(config.models)
        this.minUpgrade = config.strategy?.minUpgradeConfidence ?? 0.30;
        this.minDowngrade = config.strategy?.minDowngradeConfidence ?? 0.60;
        this.classifier = new JevClassifier()
    }

    public async route(query: string): Promise<RouterResult> {
        const probabilities = await this.classifier.classify(query, this.config.models);
        const selectedTier = selectBestTier(probabilities, this.minUpgrade, this.minDowngrade)

        let resultProbabilities: Record<string, number> = {};
        for (let i = 0; i < this.config.models.length; i++)
            resultProbabilities[this.config.models[i]!.name] = probabilities[i]!

        return {
            model: this.config.models[selectedTier]!.name,
            tier: selectedTier,
            probabilities: resultProbabilities
        }
    }

    private validateModels(models: ModelConfig[]) {
        if (models.length < 2)
            throw new Error("Router requires at least 2 models");

        if (models.length > 3)
            throw new Error("Router supports at most 3 models");

        const names = new Set<string>();
        for (let i = 0; i < models.length; i++) {
            let model = models[i]!;
            if (!model.name.trim())
                throw new Error("Model name cannot be empty");

            if (!model.description.trim())
                throw new Error(`Description required for model: ${model.name}`);

            if (names.has(model.name))
                throw new Error(`Duplicate model: ${model.name}`);

            names.add(model.name)
        }
    }
}