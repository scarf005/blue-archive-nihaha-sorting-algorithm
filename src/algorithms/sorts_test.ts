/// <reference lib="deno.ns" />
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts"
import * as sorts from "./sorts.ts"
import type { SortState } from "./types.ts"

// Helper to run a sorting algorithm and return the final sorted array
function runSort(
  sortFn: (arr: number[]) => Generator<SortState>,
  arr: number[],
): number[] {
  const generator = sortFn(arr)
  let result = generator.next()
  while (!result.done) {
    result = generator.next()
  }
  return arr
}

// Helper to check if array is sorted
function isSorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false
  }
  return true
}

// Test data generators
function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000))
}

function generateReversedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => size - i - 1)
}

function generateNearlySortedArray(size: number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i)
  // Swap a few random pairs
  for (let i = 0; i < size / 10; i++) {
    const idx1 = Math.floor(Math.random() * size)
    const idx2 = Math.floor(Math.random() * size)
    ;[arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]]
  }
  return arr
}

// List of all sorting algorithms to test
const sortingAlgorithms = [
  { name: "Merge Sort", fn: sorts.mergeSort },
  { name: "Selection Sort", fn: sorts.selectionSort },
  { name: "Insertion Sort", fn: sorts.insertionSort },
  { name: "Binary Insertion Sort", fn: sorts.binaryInsertionSort },
  { name: "Quick Sort", fn: sorts.quickSort },
  { name: "Bubble Sort", fn: sorts.bubbleSort },
  { name: "Cocktail Shaker Sort", fn: sorts.cocktailShakerSort },
  { name: "Gnome Sort", fn: sorts.gnomeSort },
  { name: "Comb Sort", fn: sorts.combSort },
  { name: "Shell Sort", fn: sorts.shellSort },
  { name: "Heap Sort", fn: sorts.heapSort },
  { name: "Odd-Even Sort", fn: sorts.oddEvenSort },
  { name: "Bitonic Sort", fn: sorts.bitonicSort },
  { name: "Cycle Sort", fn: sorts.cycleSort },
  { name: "LSD Radix Sort", fn: sorts.lsdRadixSort },
  { name: "MSD Radix Sort", fn: sorts.msdRadixSort },
  { name: "Bucket Sort", fn: sorts.bucketSort },
  { name: "Counting Sort", fn: sorts.countingSort },
  { name: "Pancake Sort", fn: sorts.pancakeSort },
  // Note: Bogo Sort excluded from tests as it's non-deterministic and very slow
]

// Test each algorithm
for (const { name, fn } of sortingAlgorithms) {
  Deno.test(`${name} - sorts small random array`, () => {
    const arr = generateRandomArray(10)
    const sorted = runSort(fn, [...arr])
    assertEquals(isSorted(sorted), true, `${name} failed to sort random array`)
  })

  Deno.test(`${name} - sorts already sorted array`, () => {
    const arr = Array.from({ length: 10 }, (_, i) => i)
    const sorted = runSort(fn, [...arr])
    assertEquals(isSorted(sorted), true, `${name} failed with sorted array`)
    assertEquals(
      sorted,
      arr,
      `${name} modified already sorted array incorrectly`,
    )
  })

  Deno.test(`${name} - sorts reversed array`, () => {
    const arr = generateReversedArray(10)
    const sorted = runSort(fn, [...arr])
    assertEquals(
      isSorted(sorted),
      true,
      `${name} failed to sort reversed array`,
    )
  })

  Deno.test(`${name} - sorts array with duplicates`, () => {
    const arr = [5, 2, 8, 2, 9, 1, 5, 5, 3, 2]
    const sorted = runSort(fn, [...arr])
    assertEquals(isSorted(sorted), true, `${name} failed with duplicates`)
  })

  Deno.test(`${name} - sorts single element array`, () => {
    const arr = [42]
    const sorted = runSort(fn, [...arr])
    assertEquals(sorted, [42], `${name} failed with single element`)
  })

  Deno.test(`${name} - sorts empty array`, () => {
    const arr: number[] = []
    const sorted = runSort(fn, [...arr])
    assertEquals(sorted, [], `${name} failed with empty array`)
  })

  Deno.test(`${name} - sorts two element array`, () => {
    const arr = [2, 1]
    const sorted = runSort(fn, [...arr])
    assertEquals(sorted, [1, 2], `${name} failed with two elements`)
  })

  Deno.test(`${name} - nearly sorted array`, () => {
    const arr = generateNearlySortedArray(15)
    const sorted = runSort(fn, [...arr])
    assertEquals(
      isSorted(sorted),
      true,
      `${name} failed with nearly sorted array`,
    )
  })
}

// Test that algorithms yield proper state structure
Deno.test("Merge Sort - yields proper state structure", () => {
  const arr = [3, 1, 4, 1, 5, 9, 2, 6]
  const generator = sorts.mergeSort([...arr])
  const state = generator.next().value as SortState

  assertExists(state, "Generator should yield states")
  assertExists(state.array, "State should have array")
  assertExists(state.comparing, "State should have comparing")
  assertExists(state.swapping, "State should have swapping")
  assertEquals(
    typeof state.comparisons,
    "number",
    "State should have comparisons count",
  )
  assertEquals(
    typeof state.arrayAccesses,
    "number",
    "State should have arrayAccesses count",
  )
  assertEquals(typeof state.swaps, "number", "State should have swaps count")
})

// Test stats tracking
Deno.test("Quick Sort - tracks stats correctly", () => {
  const arr = [5, 2, 8, 1, 9]
  const generator = sorts.quickSort([...arr])

  let lastComparisons = 0
  let lastSwaps = 0
  let result = generator.next()

  while (!result.done) {
    if (result.value) {
      // Stats should be non-decreasing
      assertEquals(
        result.value.comparisons >= lastComparisons,
        true,
        "Comparisons should not decrease",
      )
      assertEquals(
        result.value.swaps >= lastSwaps,
        true,
        "Swaps should not decrease",
      )
      lastComparisons = result.value.comparisons
      lastSwaps = result.value.swaps
    }
    result = generator.next()
  }

  // Should have performed some comparisons and swaps
  assertEquals(lastComparisons > 0, true, "Should have performed comparisons")
})

// Test that Bitonic Sort works with power-of-2 arrays
Deno.test("Bitonic Sort - works with power of 2 sizes", () => {
  for (const size of [2, 4, 8, 16, 32]) {
    const arr = generateRandomArray(size)
    const sorted = runSort(sorts.bitonicSort, [...arr])
    assertEquals(
      isSorted(sorted),
      true,
      `Bitonic Sort failed with size ${size}`,
    )
  }
})

// Performance comparison test (not a strict test, just logs)
Deno.test("Performance comparison - small array", () => {
  const testSize = 20
  const arr = generateRandomArray(testSize)

  for (const { name, fn } of sortingAlgorithms.slice(0, 5)) {
    const start = performance.now()
    const testArr = [...arr]
    runSort(fn, testArr)
    const duration = performance.now() - start
    console.log(`  ${name}: ${duration.toFixed(2)}ms`)
  }
})
