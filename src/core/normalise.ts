export function normalizeCosts(costs: number[]): number[] {
    const min = Math.min(...costs);
    const max = Math.max(...costs);

    if (max === min)
        return costs.map(() => 0);

    return costs.map(cost => (cost - min) / (max - min))
}