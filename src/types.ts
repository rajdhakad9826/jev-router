export interface ModelConfig {
    name: string;
    description: string;
}

export interface RoutingStrategy {
    threshold?: number;
    minUpgradeConfidence?: number;
    minDowngradeConfidence?: number;
}

export interface RouterConfig {
    models: ModelConfig[];
    strategy?: RoutingStrategy;
    fallbackTier?: string | undefined
}

export interface RouterResult {
    model: string;
    tier: number;
    probabilities: Record<string, number>;
    isFallback: boolean
}