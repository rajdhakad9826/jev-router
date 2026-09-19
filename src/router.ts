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

        const names = new Set<string>();
        for (const model of models) {
            if (!model.name.trim())
                throw new Error("Model name cannot be empty");

            if (!Number.isFinite(model.cost) || model.cost < 0)
                throw new Error(`Invalid cost for model: ${model.name}`);

            if (!model.description.trim())
                throw new Error(`Description required for model: ${model.name}`);

            if (names.has(model.name))
                throw new Error(`Duplicate model: ${model.name}`);

            names.add(model.name)
        }
    }
}