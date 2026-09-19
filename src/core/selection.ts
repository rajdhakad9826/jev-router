export function selectBestTier(expectedLosses: number[]): number {
    return expectedLosses.indexOf(Math.min(...expectedLosses));
}