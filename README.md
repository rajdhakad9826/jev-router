# jev-router

jev-router selects an LLM based on the expected capability required by a query while considering model cost.

## Setup
 
jev-router needs a TypeSafe API key to call Jev. Get one from the [TypeSafe console](https://console.typesafe.ai/), then set it as an environment variable before constructing the router:
 
```bash
export TYPESAFE_API_KEY="your-key-here"
```


## Example

```ts
const router = new Router({
    models: [
        {
            name: "gpt-5-mini",
            cost: 1,
            description: "Simple questions and basic coding"
        },
        {
            name: "claude-sonnet",
            cost: 5,
            description: "Complex coding and technical reasoning"
        },
        {
            name: "claude-opus",
            cost: 15,
            description: "Very difficult reasoning and complex architecture"
        }
    ]
});

const result = await router.route(
    "Design a distributed rate limiter for 100,000 requests/sec."
);

console.log(result);
```

```ts
{
    model: "claude-opus",
    tier: 2,
    probabilities: {
        "gpt-5-mini": 0,
        "claude-sonnet": 0,
        "claude-opus": 1
    }
}
```

## API
``` ts
interface ModelConfig {
    name: string;         // model identifier, e.g. "claude-opus"
    cost: number;         // any consistent unit; normalized internally
    description: string;  // capability description sent to Jev
}

interface RouterConfig {
    models: ModelConfig[]; // ordered weakest → strongest
}

interface RouterResult {
    model: string;                          // selected model name
    tier: number;                           // index in models
    probabilities: Record<string, number>;  // Jev's probability distribution
}

class Router {
    constructor(config: RouterConfig);
    route(query: string): Promise<RouterResult>;
}
```

## How routing works

Models are ordered from weakest to strongest:

```text
Tier 0 → Tier 1 → Tier 2 → ...
```

For each possible model, the router calculates:

$$
Loss(a,t) = Cost(a) + \lambda \max(0,t-a)^2
$$

where:

* `a` = chosen model tier
* `t` = required capability tier
* `Cost(a)` = normalized cost of the chosen model
* `λ` = penalty for choosing a model that is too weak

The expected loss is:

$$
ExpectedLoss[L(a)] = \sum_t P(t)Loss(a,t)
$$

`t` ranges over all tiers, weighted by P(t)

The router selects the model with the **lowest expected loss**.

This means Jev's highest-probability tier isn't always selected.

For example, with costs `[1, 5, 15]` (normalized to `[0, 0.286, 1]`) and λ = 1:

```text
P(tier 0) = 0
P(tier 1) = 0.45
P(tier 2) = 0.55

Expected loss:
tier 0 → 2.65
tier 1 → 0.84  ← selected
tier 2 → 1.00
```

## Status

V1 implements:

* Jev-based capability classification
* Cost normalization
* Expected-loss routing
* Cost-aware model selection
* Precomputed loss matrix

## Current limitations

* λ is fixed for now — no costSensitivity config yet.
* No built-in fallback — route() throws if the Jev call fails.

More evaluation and routing strategies are planned for future versions.
