import type { InternalModel } from "../types.js";

export function calculateLoss(chosenTier: number, requiredTier: number, normalizedCost: number, lambda: number) {
    const underProvision = Math.max(0, requiredTier - chosenTier);
    return normalizedCost + lambda * underProvision ** 2;
}

export function buildLossMatrix(models: InternalModel[], lambda: number) {
    const numTiers = models.length
    const lossMatrix: number[][] = [];

    for (let chosenTier = 0; chosenTier < numTiers; chosenTier++) {
        const row: number[] = [];
        const chosenModel = models[chosenTier]!
        for (let requiredTier = 0; requiredTier < numTiers; requiredTier++) {
            row.push(calculateLoss(chosenTier, requiredTier, chosenModel.normalizedCost, lambda))
        }
        lossMatrix.push(row);
    }

    return lossMatrix
}

export function calculateExpectedLoss(probabilities: number[], lossMatrix: number[][]): number[] {
    const expectedLosses: number[] = [];
    for (let i = 0; i < lossMatrix.length; i++) {
        let expectedLoss = 0;

        for (let j = 0; j < probabilities.length; j++)
            expectedLoss += probabilities[j]! * lossMatrix[i]![j]!;

        expectedLosses.push(expectedLoss)
    }

    return expectedLosses;
}