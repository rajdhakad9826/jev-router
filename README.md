# jev-model-router

jev-model-router routes each query to the cheapest LLM tier that can actually handle it, using [TypeSafe's Jev](https://typesafe.ai) to classify how demanding a query is — fast and cheap, without spending an LLM call on the routing decision itself.

```bash
npm install jev-model-router
```

## Setup

jev-model-router needs a TypeSafe API key to call Jev. Get one from the [TypeSafe console](https://console.typesafe.ai/), then set it as an environment variable before constructing the router:

```bash
export TYPESAFE_API_KEY="your-key-here"
```

## Example

```ts
import { Router } from "jev-model-router";

const router = new Router({
    models: [
        { name: "gpt-4o-mini", description: "Simple questions, formatting, and basic data extraction" },
        { name: "claude-3-5-sonnet", description: "Standard software engineering and logic puzzles" },
        { name: "claude-3-5-opus", description: "Highly complex architectural design and deep reasoning" }
    ],
    fallbackTier: "claude-3-5-sonnet"
});

const result = await router.route(
    "Design a distributed rate limiter for 100,000 requests/sec."
);

console.log(result);
```

```ts
{
    model: "claude-3-5-opus",
    tier: 2,
    probabilities: {
        "gpt-4o-mini": 0,
        "claude-3-5-sonnet": 0.15,
        "claude-3-5-opus": 0.85
    },
    isFallback: false,
}
```

`models` must be ordered weakest → strongest. The router supports either **2 models** (a binary cheap/strong decision) or **3 models** (a cheap/mid/strong cascade) — this is determined automatically from `models.length`, not configured separately.

## API

```ts
interface ModelConfig {
    name: string;         // model identifier, e.g. "claude-3-5-opus"
    description: string;  // one level of the capability rubric sent to Jev
}

interface RoutingStrategy {
    /** 2-model routers only. Confidence needed before routing to the stronger model. Defaults to 0.5. */
    threshold?: number;

    /** 3-model routers only. Confidence needed before escalating from the middle tier to the strongest. Defaults to 0.4. */
    minUpgradeConfidence?: number;

    /** 3-model routers only. Confidence needed before dropping from the middle tier to the cheapest. Defaults to 0.6. */
    minDowngradeConfidence?: number;
}

interface RouterConfig {
    models: ModelConfig[];       // ordered weakest → strongest, exactly 2 or 3 entries
    strategy?: RoutingStrategy;
    fallbackTier?: string;       // model name to use if the TypeSafe Jev API fails
}

interface RouterResult {
    model: string;                          // selected model name
    tier: number;                           // its index in `models`
    probabilities: Record<string, number>;  // Jev's distribution, keyed by model name
    isFallback: boolean;                    // true if the Jev API failed and fallbackTier was used
}

class Router {
    constructor(config: RouterConfig);
    route(query: string): Promise<RouterResult>;
}
```

`strategy` fields are strict to the model count you configure — passing `threshold` with 3 models, or `minUpgradeConfidence`/`minDowngradeConfidence` with 2 models, throws at construction time rather than being silently ignored.

## How routing works

Jev classifies each query against your model descriptions and returns a probability distribution over tiers — e.g. `[0.05, 0.15, 0.80]` for a 3-model setup, meaning an 80% chance the query needs the strongest tier.

**With 3 models**, the router starts at the middle tier and moves off it in either direction based on two independent confidence checks:

```text
if  P(strongest tier)  >= minUpgradeConfidence   → escalate to the strongest tier
if  P(cheapest tier)   >= minDowngradeConfidence  → drop to the cheapest tier
otherwise                                          → stay on the middle tier
```

The escalate check runs first — if both conditions are somehow satisfied at once (possible when the two thresholds don't add to at least 1), escalating wins, since sending a hard query to too weak a model is a worse failure than paying for a model that wasn't strictly necessary.

**With 2 models**, there's no middle tier to start from, so it collapses to a single comparison:

```text
if  P(strongest tier)  >= threshold  → the strong model
otherwise                             → the cheap model
```

### Why confidence thresholds instead of a cost-weighted formula

An earlier version of this library computed an expected-cost-minimizing choice using each model's price and a shared penalty term for under-provisioning. That approach broke down whenever the price gaps between tiers were uneven (which is normal — a jump from a cheap model to a frontier model is rarely proportional to the jump from a cheap model to a mid-tier one): a single shared parameter couldn't correctly calibrate every tier boundary at once, so a model could stay unselected even when Jev was 90%+ confident it was needed. Confidence thresholds sidestep this entirely — each boundary is judged directly against Jev's own probability output, with no cost-scaling step to introduce distortion between tiers.

## Choosing your thresholds

The default thresholds (minUpgradeConfidence: 0.4, minDowngradeConfidence: 0.6) are intentionally quality-leaning.

To adjust this behavior:

* **Lower `minUpgradeConfidence` / higher `minDowngradeConfidence`** → more willing to spend, escalates readily, rarely settles for the cheap tier.
* **Higher `minUpgradeConfidence` / lower `minDowngradeConfidence`** → more cost-conscious, stays cheap unless Jev is clearly confident escalation is warranted.

These two thresholds move in **opposite directions** for the same preference — raising both, or lowering both, produces an inconsistent strategy rather than a more extreme version of either one.

## Status

V2 implements:

* Jev-based capability classification
* Confidence-threshold cascade routing (3 models) and binary threshold routing (2 models)
* Strict, mode-aware config validation
* Graceful fallback handling for API outages
