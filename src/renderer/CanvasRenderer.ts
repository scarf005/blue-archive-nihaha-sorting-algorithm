export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private image: HTMLImageElement | null = null
  private imageUrl: string
  private sliceCount: number

  constructor(
    canvas: HTMLCanvasElement,
    imageUrl: string,
    sliceCount: number = 128,
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get 2D context")
    this.ctx = ctx
    this.imageUrl = imageUrl
    this.sliceCount = sliceCount

    // Set default font for stats
    this.ctx.font = "14px monospace"
  }

  loadImage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.image = img
        this.resize()
        resolve()
      }
      img.onerror = reject
      img.src = this.imageUrl
    })
  }

  resize(): void {
    if (!this.image) return

    // Make canvas fill the window
    this.canvas.width = globalThis.innerWidth
    this.canvas.height = globalThis.innerHeight
  }

  render(
    array: number[],
    comparing: number[] = [],
    swapping: number[] = [],
  ): void {
    if (!this.image || !array || array.length === 0) return

    const width = this.canvas.width
    const height = this.canvas.height
    const actualSliceCount = array.length
    const sliceWidth = width / actualSliceCount

    this.ctx.clearRect(0, 0, width, height)

    // Draw each slice
    for (let i = 0; i < actualSliceCount; i++) {
      const sourceX = array[i]
      const sourceSliceWidth = this.image.width / actualSliceCount

      // Calculate exact pixel positions to avoid gaps
      const destX = Math.floor(i * sliceWidth)
      const nextDestX = Math.floor((i + 1) * sliceWidth)
      const destWidth = nextDestX - destX

      // Draw the image slice
      this.ctx.drawImage(
        this.image,
        sourceX * sourceSliceWidth, // source X
        0, // source Y
        sourceSliceWidth, // source width
        this.image.height, // source height
        destX, // dest X
        0, // dest Y
        destWidth, // dest width (calculated to fill exactly)
        height, // dest height
      )

      // Apply highlight overlays
      if (comparing.includes(i)) {
        // Determine if elements being compared are in correct order
        // Compare with other comparing elements
        const comparingPairs = comparing.filter((idx) => idx !== i)
        let isCorrectOrder = true

        for (const otherIdx of comparingPairs) {
          if (i < otherIdx) {
            // If current element should be before other element
            isCorrectOrder = array[i] <= array[otherIdx]
          } else {
            // If current element should be after other element
            isCorrectOrder = array[i] >= array[otherIdx]
          }
          break // Only check first pair
        }

        // Green overlay for correct order, Red for wrong order
        if (comparingPairs.length > 0) {
          this.ctx.fillStyle = isCorrectOrder
            ? "rgba(0, 255, 0, 0.5)" // Green
            : "rgba(255, 0, 0, 0.5)" // Red
        } else {
          // Single element comparison - use neutral color
          this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
        }
        this.ctx.fillRect(destX, 0, destWidth, height)
      } else if (swapping.includes(i)) {
        // White overlay for swap
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
        this.ctx.fillRect(destX, 0, destWidth, height)
      }
    }
  }

  renderCompletionSweep(array: number[], sweepIndex: number): void {
    if (!this.image || !array || array.length === 0) return

    const width = this.canvas.width
    const height = this.canvas.height
    const actualSliceCount = array.length
    const sliceWidth = width / actualSliceCount

    this.ctx.clearRect(0, 0, width, height)

    // Draw all slices
    for (let i = 0; i < actualSliceCount; i++) {
      const sourceX = array[i]
      const sourceSliceWidth = this.image.width / actualSliceCount

      // Calculate exact pixel positions to avoid gaps
      const destX = Math.floor(i * sliceWidth)
      const nextDestX = Math.floor((i + 1) * sliceWidth)
      const destWidth = nextDestX - destX

      this.ctx.drawImage(
        this.image,
        sourceX * sourceSliceWidth,
        0,
        sourceSliceWidth,
        this.image.height,
        destX,
        0,
        destWidth,
        height,
      )

      // White highlight for swept slices (minimalistic)
      if (i <= sweepIndex) {
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
        this.ctx.fillRect(destX, 0, destWidth, height)
      }
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  setSliceCount(count: number): void {
    this.sliceCount = count
  }

  getSliceCount(): number {
    return this.sliceCount
  }
}
