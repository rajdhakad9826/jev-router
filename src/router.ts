import type { ModelConfig, RouterConfig, RouterResult, RoutingStrategy } from "./types.js";
import { JevClassifier } from "./jev/classifier.js";
import { selectBinaryTier, selectCascadeTier } from "./core/selection.js";

export class Router {
    private config: RouterConfig;
    private classifier: JevClassifier
    private mode: "binary" | "cascade";
    private threshold!: number;
    private minUpgrade!: number;
    private minDowngrade!: number;


    constructor(config: RouterConfig) {
        this.config = config;
        this.validateModels(config.models)
        this.mode = config.models.length === 2 ? "binary" : "cascade";
        this.resolveStrategy(config.strategy);
        this.classifier = new JevClassifier()
    }

    public async route(query: string): Promise<RouterResult> {
        const probabilities = await this.classifier.classify(query, this.config.models);

        const selectedTier = this.mode === "binary"
            ? selectBinaryTier(probabilities, this.threshold)
            : selectCascadeTier(probabilities, this.minUpgrade, this.minDowngrade);

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

    private validateProbability(value: number, name: string) {
        if (!Number.isFinite(value) || value < 0 || value > 1)
            throw new Error(`${name} must be between 0 and 1, got: ${value}`);
    }


    private resolveStrategy(strategy: RoutingStrategy | undefined) {
        if (this.mode === "binary") {
            if (strategy?.minUpgradeConfidence !== undefined || strategy?.minDowngradeConfidence !== undefined)
                throw new Error(
                    "minUpgradeConfidence/minDowngradeConfidence only apply to 3-model routers. Use `threshold` for a 2-model router."
                );

            this.threshold = strategy?.threshold ?? 0.5;
            this.validateProbability(this.threshold, "threshold");
        } else {
            if (strategy?.threshold !== undefined)
                throw new Error(
                    "`threshold` only applies to 2-model routers. Use minUpgradeConfidence/minDowngradeConfidence for a 3-model router."
                );

            this.minUpgrade = strategy?.minUpgradeConfidence ?? 0.4;
            this.minDowngrade = strategy?.minDowngradeConfidence ?? 0.6;
            this.validateProbability(this.minUpgrade, "minUpgradeConfidence");
            this.validateProbability(this.minDowngrade, "minDowngradeConfidence");
        }
    }

}