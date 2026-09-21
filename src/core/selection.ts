export function selectBestTier(probabilities: number[], minUpgrade: number, minDowngrade: number): number {
    const pTier0 = probabilities[0]!;
    const pTier2 = probabilities[2]!;

    if (pTier2 >= minUpgrade) return 2;
    if (pTier0 >= minDowngrade) return 0;
    return 1
}