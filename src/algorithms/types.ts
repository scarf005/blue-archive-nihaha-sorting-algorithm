export interface SortState {
  array: number[]
  comparing: number[]
  swapping: number[]
  comparisons: number
  arrayAccesses: number
  swaps: number
  // For visual feedback: indices in correct order (green) vs wrong order (red)
  correctOrder?: number[] // Indices that are in correct order during comparison
  wrongOrder?: number[] // Indices that are in wrong order during comparison
}

export type SortGenerator = Generator<SortState, void, unknown>

export interface Algorithm {
  id: string
  name: string
  nameKorean: string
  sort: (arr: number[]) => SortGenerator
  /**
   * Complexity multiplier: affects max array size
   * - 1.0 = O(n log n) or better (full size)
   * - 0.5 = O(n^1.5) (reduced size)
   * - 0.25 = O(n²) or worse (heavily reduced size)
   */
  complexityMultiplier: number
  timeComplexity: string // e.g., "O(n log n)", "O(n²)", etc.
}
