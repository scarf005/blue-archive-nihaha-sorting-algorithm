import type { SortGenerator, SortState } from "./types.ts"

// Helper to create state snapshots with stats
function* yieldState(
  array: number[],
  comparing: number[] = [],
  swapping: number[] = [],
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  yield {
    array: [...array],
    comparing: [...comparing],
    swapping: [...swapping],
    comparisons: stats.comparisons,
    arrayAccesses: stats.arrayAccesses,
    swaps: stats.swaps,
  }
}

// 1. Merge Sort - O(n log n) - Efficient
export function* mergeSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  yield* mergeSortHelper(arr, 0, arr.length - 1, stats)
}

function* mergeSortHelper(
  arr: number[],
  left: number,
  right: number,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  if (left >= right) return

  const mid = Math.floor((left + right) / 2)
  yield* mergeSortHelper(arr, left, mid, stats)
  yield* mergeSortHelper(arr, mid + 1, right, stats)
  yield* merge(arr, left, mid, right, stats)
}

function* merge(
  arr: number[],
  left: number,
  mid: number,
  right: number,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  const leftArr = arr.slice(left, mid + 1)
  const rightArr = arr.slice(mid + 1, right + 1)
  stats.arrayAccesses += leftArr.length + rightArr.length

  let i = 0, j = 0, k = left

  while (i < leftArr.length && j < rightArr.length) {
    stats.comparisons++
    stats.arrayAccesses += 2
    yield* yieldState(arr, [left + i, mid + 1 + j], [], stats)

    if (leftArr[i] <= rightArr[j]) {
      arr[k] = leftArr[i]
      stats.arrayAccesses++
      stats.swaps++
      yield* yieldState(arr, [], [k], stats)
      i++
    } else {
      arr[k] = rightArr[j]
      stats.arrayAccesses++
      stats.swaps++
      yield* yieldState(arr, [], [k], stats)
      j++
    }
    k++
  }

  while (i < leftArr.length) {
    arr[k] = leftArr[i]
    stats.arrayAccesses++
    stats.swaps++
    yield* yieldState(arr, [], [k], stats)
    i++
    k++
  }

  while (j < rightArr.length) {
    arr[k] = rightArr[j]
    stats.arrayAccesses++
    stats.swaps++
    yield* yieldState(arr, [], [k], stats)
    j++
    k++
  }
}

// 2. Selection Sort - O(n²) - Inefficient
export function* selectionSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    stats.arrayAccesses++

    for (let j = i + 1; j < n; j++) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [minIdx, j], [], stats)
      if (arr[j] < arr[minIdx]) {
        minIdx = j
      }
    }

    if (minIdx !== i) {
      ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
      stats.arrayAccesses += 4
      stats.swaps++
      yield* yieldState(arr, [], [i, minIdx], stats)
    }
  }
}

// 3. Insertion Sort - O(n²) - Inefficient
export function* insertionSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  for (let i = 1; i < n; i++) {
    const key = arr[i]
    stats.arrayAccesses++
    let j = i - 1

    while (j >= 0 && arr[j] > key) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [j, j + 1], [], stats)
      arr[j + 1] = arr[j]
      stats.arrayAccesses += 2
      stats.swaps++
      yield* yieldState(arr, [], [j + 1], stats)
      j--
    }
    if (j >= 0) {
      stats.comparisons++
      stats.arrayAccesses++
    }

    arr[j + 1] = key
    stats.arrayAccesses++
    if (j + 1 !== i) stats.swaps++
    yield* yieldState(arr, [], [j + 1], stats)
  }
}

// 4. Binary Insertion Sort - O(n²) - Inefficient
export function* binaryInsertionSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  for (let i = 1; i < n; i++) {
    const key = arr[i]
    stats.arrayAccesses++

    let left = 0
    let right = i - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [mid, i], [], stats)

      if (arr[mid] > key) {
        right = mid - 1
      } else {
        left = mid + 1
      }
    }

    for (let j = i - 1; j >= left; j--) {
      arr[j + 1] = arr[j]
      stats.arrayAccesses += 2
      stats.swaps++
      yield* yieldState(arr, [], [j + 1], stats)
    }

    arr[left] = key
    stats.arrayAccesses++
    yield* yieldState(arr, [], [left], stats)
  }
}

// 5. Quick Sort - O(n log n) average - Efficient
export function* quickSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  yield* quickSortHelper(arr, 0, arr.length - 1, stats)
}

function* quickSortHelper(
  arr: number[],
  low: number,
  high: number,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  if (low < high) {
    const pi = yield* partition(arr, low, high, stats)
    yield* quickSortHelper(arr, low, pi - 1, stats)
    yield* quickSortHelper(arr, pi + 1, high, stats)
  }
}

function* partition(
  arr: number[],
  low: number,
  high: number,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): Generator<SortState, number, unknown> {
  const pivot = arr[high]
  stats.arrayAccesses++
  let i = low - 1

  for (let j = low; j < high; j++) {
    stats.comparisons++
    stats.arrayAccesses += 2
    yield* yieldState(arr, [j, high], [], stats)
    if (arr[j] < pivot) {
      i++
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      stats.arrayAccesses += 4
      stats.swaps++
      yield* yieldState(arr, [], [i, j], stats)
    }
  }

  ;[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
  stats.arrayAccesses += 4
  stats.swaps++
  yield* yieldState(arr, [], [i + 1, high], stats)
  return i + 1
}

// 6. Bubble Sort - O(n²) - Inefficient
export function* bubbleSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [j, j + 1], [], stats)
      if (arr[j] > arr[j + 1]) {
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        stats.arrayAccesses += 4
        stats.swaps++
        yield* yieldState(arr, [], [j, j + 1], stats)
      }
    }
  }
}

// 7-20: Continue with remaining algorithms following the same pattern...
// I'll implement the remaining ones with proper stats tracking

// 7. Cocktail Shaker Sort - O(n²) - Inefficient
export function* cocktailShakerSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  let start = 0
  let end = arr.length - 1
  let swapped = true

  while (swapped) {
    swapped = false

    for (let i = start; i < end; i++) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [i, i + 1], [], stats)
      if (arr[i] > arr[i + 1]) {
        ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
        stats.arrayAccesses += 4
        stats.swaps++
        yield* yieldState(arr, [], [i, i + 1], stats)
        swapped = true
      }
    }

    if (!swapped) break
    swapped = false
    end--

    for (let i = end - 1; i >= start; i--) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [i, i + 1], [], stats)
      if (arr[i] > arr[i + 1]) {
        ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
        stats.arrayAccesses += 4
        stats.swaps++
        yield* yieldState(arr, [], [i, i + 1], stats)
        swapped = true
      }
    }
    start++
  }
}

// 8. Gnome Sort - O(n²) - Inefficient
export function* gnomeSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  let i = 0

  while (i < arr.length) {
    if (i === 0 || arr[i] >= arr[i - 1]) {
      if (i > 0) {
        stats.comparisons++
        stats.arrayAccesses += 2
      }
      i++
    } else {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [i, i - 1], [], stats)
      ;[arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]
      stats.arrayAccesses += 4
      stats.swaps++
      yield* yieldState(arr, [], [i, i - 1], stats)
      i--
    }
  }
}

// 9. Comb Sort - O(n²) worst case - Inefficient
export function* combSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  let gap = n
  const shrink = 1.3
  let sorted = false

  while (!sorted) {
    gap = Math.floor(gap / shrink)
    if (gap <= 1) {
      gap = 1
      sorted = true
    }

    for (let i = 0; i + gap < n; i++) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [i, i + gap], [], stats)
      if (arr[i] > arr[i + gap]) {
        ;[arr[i], arr[i + gap]] = [arr[i + gap], arr[i]]
        stats.arrayAccesses += 4
        stats.swaps++
        yield* yieldState(arr, [], [i, i + gap], stats)
        sorted = false
      }
    }
  }
}

// 10. Shell Sort - O(n²) worst case - Inefficient
export function* shellSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < n; i++) {
      const temp = arr[i]
      stats.arrayAccesses++
      let j = i

      while (j >= gap) {
        stats.comparisons++
        stats.arrayAccesses += 2
        yield* yieldState(arr, [j, j - gap], [], stats)
        if (arr[j - gap] > temp) {
          arr[j] = arr[j - gap]
          stats.arrayAccesses += 2
          stats.swaps++
          yield* yieldState(arr, [], [j], stats)
          j -= gap
        } else {
          break
        }
      }

      arr[j] = temp
      stats.arrayAccesses++
      yield* yieldState(arr, [], [j], stats)
    }
  }
}

// 11. Heap Sort - O(n log n) - Efficient
export function* heapSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(arr, n, i, stats)
  }

  for (let i = n - 1; i > 0; i--) {
    ;[arr[0], arr[i]] = [arr[i], arr[0]]
    stats.arrayAccesses += 4
    stats.swaps++
    yield* yieldState(arr, [], [0, i], stats)
    yield* heapify(arr, i, 0, stats)
  }
}

function* heapify(
  arr: number[],
  n: number,
  i: number,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  let largest = i
  const left = 2 * i + 1
  const right = 2 * i + 2

  if (left < n) {
    stats.comparisons++
    stats.arrayAccesses += 2
    yield* yieldState(arr, [left, largest], [], stats)
    if (arr[left] > arr[largest]) {
      largest = left
    }
  }

  if (right < n) {
    stats.comparisons++
    stats.arrayAccesses += 2
    yield* yieldState(arr, [right, largest], [], stats)
    if (arr[right] > arr[largest]) {
      largest = right
    }
  }

  if (largest !== i) {
    ;[arr[i], arr[largest]] = [arr[largest], arr[i]]
    stats.arrayAccesses += 4
    stats.swaps++
    yield* yieldState(arr, [], [i, largest], stats)
    yield* heapify(arr, n, largest, stats)
  }
}

// 12. Odd-Even Sort - O(n²) - Inefficient
export function* oddEvenSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  let sorted = false

  while (!sorted) {
    sorted = true

    for (let i = 1; i < n - 1; i += 2) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [i, i + 1], [], stats)
      if (arr[i] > arr[i + 1]) {
        ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
        stats.arrayAccesses += 4
        stats.swaps++
        yield* yieldState(arr, [], [i, i + 1], stats)
        sorted = false
      }
    }

    for (let i = 0; i < n - 1; i += 2) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [i, i + 1], [], stats)
      if (arr[i] > arr[i + 1]) {
        ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
        stats.arrayAccesses += 4
        stats.swaps++
        yield* yieldState(arr, [], [i, i + 1], stats)
        sorted = false
      }
    }
  }
}

// 13. Bitonic Sort - O(n log² n) - Efficient
export function* bitonicSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  const n = arr.length

  // Bitonic sort requires power of 2 size, pad if needed
  let powerOf2 = 1
  while (powerOf2 < n) powerOf2 *= 2

  const originalLength = arr.length
  // Pad with large numbers that will sort to the end
  const maxVal = Math.max(...arr, 0) + 1
  while (arr.length < powerOf2) {
    arr.push(maxVal + arr.length)
  }
  stats.arrayAccesses += originalLength

  yield* bitonicSortHelper(arr, 0, arr.length, true, stats)

  // Remove padding
  arr.length = originalLength
}

function* bitonicSortHelper(
  arr: number[],
  low: number,
  cnt: number,
  dir: boolean,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  if (cnt > 1) {
    const k = Math.floor(cnt / 2)
    yield* bitonicSortHelper(arr, low, k, true, stats)
    yield* bitonicSortHelper(arr, low + k, k, false, stats)
    yield* bitonicMerge(arr, low, cnt, dir, stats)
  }
}

function* bitonicMerge(
  arr: number[],
  low: number,
  cnt: number,
  dir: boolean,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  if (cnt > 1) {
    const k = Math.floor(cnt / 2)
    for (let i = low; i < low + k; i++) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [i, i + k], [], stats)
      if ((arr[i] > arr[i + k]) === dir) {
        ;[arr[i], arr[i + k]] = [arr[i + k], arr[i]]
        stats.arrayAccesses += 4
        stats.swaps++
        yield* yieldState(arr, [], [i, i + k], stats)
      }
    }
    yield* bitonicMerge(arr, low, k, dir, stats)
    yield* bitonicMerge(arr, low + k, k, dir, stats)
  }
}

// 14-20: Remaining algorithms with proper stats tracking
// These follow the same pattern

// 14. Cycle Sort - O(n²) - Inefficient
export function* cycleSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
    let item = arr[cycleStart]
    stats.arrayAccesses++
    let pos = cycleStart

    for (let i = cycleStart + 1; i < n; i++) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [cycleStart, i], [], stats)
      if (arr[i] < item) {
        pos++
      }
    }

    if (pos === cycleStart) continue

    while (item === arr[pos]) {
      stats.comparisons++
      stats.arrayAccesses++
      pos++
    }

    if (pos !== cycleStart) {
      ;[item, arr[pos]] = [arr[pos], item]
      stats.arrayAccesses += 2
      stats.swaps++
      yield* yieldState(arr, [], [pos], stats)
    }

    while (pos !== cycleStart) {
      pos = cycleStart

      for (let i = cycleStart + 1; i < n; i++) {
        stats.comparisons++
        stats.arrayAccesses += 2
        yield* yieldState(arr, [cycleStart, i], [], stats)
        if (arr[i] < item) {
          pos++
        }
      }

      while (item === arr[pos]) {
        stats.comparisons++
        stats.arrayAccesses++
        pos++
      }

      if (item !== arr[pos]) {
        ;[item, arr[pos]] = [arr[pos], item]
        stats.arrayAccesses += 2
        stats.swaps++
        yield* yieldState(arr, [], [pos], stats)
      }
    }
  }
}

// 15. LSD Radix Sort - O(nk) - Efficient
export function* lsdRadixSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  const max = Math.max(...arr)
  stats.arrayAccesses += arr.length

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    yield* countingSortByDigit(arr, exp, stats)
  }
}

function* countingSortByDigit(
  arr: number[],
  exp: number,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  const n = arr.length
  const output = new Array(n)
  const count = new Array(10).fill(0)

  for (let i = 0; i < n; i++) {
    const digit = Math.floor(arr[i] / exp) % 10
    stats.arrayAccesses++
    count[digit]++
    yield* yieldState(arr, [i], [], stats)
  }

  for (let i = 1; i < 10; i++) {
    count[i] += count[i - 1]
  }

  for (let i = n - 1; i >= 0; i--) {
    const digit = Math.floor(arr[i] / exp) % 10
    stats.arrayAccesses++
    output[count[digit] - 1] = arr[i]
    count[digit]--
  }

  for (let i = 0; i < n; i++) {
    arr[i] = output[i]
    stats.arrayAccesses++
    stats.swaps++
    yield* yieldState(arr, [], [i], stats)
  }
}

// 16. MSD Radix Sort - O(nk) - Efficient
export function* msdRadixSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  const max = Math.max(...arr)
  stats.arrayAccesses += arr.length
  const maxDigits = max.toString().length
  yield* msdRadixSortHelper(arr, 0, arr.length - 1, maxDigits - 1, stats)
}

function* msdRadixSortHelper(
  arr: number[],
  left: number,
  right: number,
  digit: number,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  if (left >= right || digit < 0) return

  const buckets: number[][] = Array.from({ length: 10 }, () => [])

  for (let i = left; i <= right; i++) {
    const d = Math.floor(arr[i] / Math.pow(10, digit)) % 10
    stats.arrayAccesses++
    buckets[d].push(arr[i])
    yield* yieldState(arr, [i], [], stats)
  }

  let idx = left
  for (let i = 0; i < 10; i++) {
    for (const val of buckets[i]) {
      arr[idx] = val
      stats.arrayAccesses++
      stats.swaps++
      yield* yieldState(arr, [], [idx], stats)
      idx++
    }
  }

  let pos = left
  for (let i = 0; i < 10; i++) {
    if (buckets[i].length > 1) {
      yield* msdRadixSortHelper(
        arr,
        pos,
        pos + buckets[i].length - 1,
        digit - 1,
        stats,
      )
    }
    pos += buckets[i].length
  }
}

// 17. Bucket Sort - O(n²) worst - Inefficient
export function* bucketSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  if (n <= 1) return

  const max = Math.max(...arr)
  const min = Math.min(...arr)
  stats.arrayAccesses += arr.length * 2
  const bucketCount = Math.ceil(Math.sqrt(n))
  const bucketSize = (max - min) / bucketCount + 1

  const buckets: number[][] = Array.from({ length: bucketCount }, () => [])

  // Distribution phase - yield for each element
  for (let i = 0; i < n; i++) {
    const bucketIdx = Math.floor((arr[i] - min) / bucketSize)
    stats.arrayAccesses++
    buckets[bucketIdx].push(arr[i])
    yield* yieldState(arr, [i], [], stats)
  }

  let idx = 0
  // Sort each bucket with insertion sort and visualize steps
  for (let b = 0; b < buckets.length; b++) {
    const bucket = buckets[b]

    // Use insertion sort on bucket with visualization
    for (let i = 1; i < bucket.length; i++) {
      const key = bucket[i]
      let j = i - 1
      while (j >= 0 && bucket[j] > key) {
        stats.comparisons++
        bucket[j + 1] = bucket[j]
        j--
      }
      stats.comparisons++
      bucket[j + 1] = key
    }

    // Place sorted bucket elements back into array
    for (const val of bucket) {
      arr[idx] = val
      stats.arrayAccesses++
      stats.swaps++
      yield* yieldState(arr, [], [idx], stats)
      idx++
    }
  }
}

// 18. Counting Sort - O(n+k) - Efficient
export function* countingSort(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  // Handle empty array
  if (n === 0) return

  const max = Math.max(...arr)
  const min = Math.min(...arr)
  stats.arrayAccesses += arr.length * 2
  const range = max - min + 1

  const count = new Array(range).fill(0)
  const output = new Array(n)

  for (let i = 0; i < n; i++) {
    stats.arrayAccesses++
    count[arr[i] - min]++
    yield* yieldState(arr, [i], [], stats)
  }

  for (let i = 1; i < range; i++) {
    count[i] += count[i - 1]
  }

  for (let i = n - 1; i >= 0; i--) {
    stats.arrayAccesses++
    output[count[arr[i] - min] - 1] = arr[i]
    count[arr[i] - min]--
  }

  for (let i = 0; i < n; i++) {
    arr[i] = output[i]
    stats.arrayAccesses++
    stats.swaps++
    yield* yieldState(arr, [], [i], stats)
  }
}

// 19. Pancake Sort - O(n²) - Inefficient
export function* pancakeSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  for (let currSize = arr.length; currSize > 1; currSize--) {
    let maxIdx = 0
    for (let i = 0; i < currSize; i++) {
      stats.comparisons++
      stats.arrayAccesses += 2
      yield* yieldState(arr, [i, maxIdx], [], stats)
      if (arr[i] > arr[maxIdx]) {
        maxIdx = i
      }
    }

    if (maxIdx !== currSize - 1) {
      yield* flip(arr, maxIdx, stats)
      yield* flip(arr, currSize - 1, stats)
    }
  }
}

function* flip(
  arr: number[],
  k: number,
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): SortGenerator {
  let left = 0
  let right = k

  while (left < right) {
    ;[arr[left], arr[right]] = [arr[right], arr[left]]
    stats.arrayAccesses += 4
    stats.swaps++
    yield* yieldState(arr, [], [left, right], stats)
    left++
    right--
  }
}

// 20. Bogo Sort - O(∞) average - Extremely Inefficient
export function* bogoSort(arr: number[]): SortGenerator {
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  let iterations = 0
  const maxIterations = 100000 // Safety limit

  while (!isSorted(arr, stats) && iterations < maxIterations) {
    iterations++
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      yield* yieldState(arr, [i, j], [], stats)
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      stats.arrayAccesses += 4
      stats.swaps++
      yield* yieldState(arr, [], [i, j], stats)
    }
  }
}

function isSorted(
  arr: number[],
  stats: { comparisons: number; arrayAccesses: number; swaps: number },
): boolean {
  for (let i = 1; i < arr.length; i++) {
    stats.comparisons++
    stats.arrayAccesses += 2
    if (arr[i] < arr[i - 1]) return false
  }
  return true
}
