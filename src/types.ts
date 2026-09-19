export interface ModelConfig {
    name: string;
    cost: number;
    description: string;
}

export type InternalModel = ModelConfig & {
    normalizedCost: number;
};

export interface RouterConfig {
    models: ModelConfig[];
}

export interface RouterResult {
    model: string;
    tier: number;
    probabilities: Record<string, number>;
}