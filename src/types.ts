export interface ModelConfig {
    name: string;
    cost: number;
    description: string;
}

export type InternalModel = ModelConfig & {
    normalizedCost: number;
};

export interface RoutingStrategy {
    minUpgradeConfidence?: number;
    minDowngradeConfidence?: number;
}

export interface RouterConfig {
    models: ModelConfig[];
    strategy?: RoutingStrategy
}

export interface RouterResult {
    model: string;
    tier: number;
    probabilities: Record<string, number>;
}