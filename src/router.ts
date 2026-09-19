import type { ModelConfig, RouterConfig } from "./types.js";

export class Router {
    private config: RouterConfig;

    constructor(config: RouterConfig) {
        this.config = config;
        this.validateModels(config.models)
    }

    private validateModels(models: ModelConfig[]) {
        if (models.length < 2)
            throw new Error("Router requires at least 2 models");

        if (models.length > 10)
            throw new Error("Router supports at most 10 models (Jev's Score primitive limit)");

        const names = new Set<string>();
        for (let i = 0; i < models.length; i++) {
            let model = models[i]!;
            if (!model.name.trim())
                throw new Error("Model name cannot be empty");

            if (!Number.isFinite(model.cost) || model.cost < 0)
                throw new Error(`Invalid cost for model: ${model.name}`);

            if (!model.description.trim())
                throw new Error(`Description required for model: ${model.name}`);

            if (names.has(model.name))
                throw new Error(`Duplicate model: ${model.name}`);

            if (i > 0 && model.cost < models[i - 1]!.cost) {
                console.warn(
                    `"${model.name}" (cost=${model.cost}) is cheaper than ` +
                    `"${models[i - 1]!.name}" (cost=${models[i - 1]!.cost}) but listed later. ` +
                    `Models should be ordered weakest to strongest capability — verify this is intentional if costs don't track capability.`
                );

            }
            names.add(model.name)
        }
    }
}