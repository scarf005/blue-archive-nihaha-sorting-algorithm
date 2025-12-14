# AGENTS.md

## TASKS

1. **KEEP RE-READING AGENTS.md per every task, before and after doing task, to check for updates.**
2. **even when all tasks are ticked, forever keep re-read AGENTS.md every 5 seconds to check for new tasks.**
3. SERVER IS ALREADY ON http://localhost:5173, do not `deno task dev`
4. Per each task completed, re-read AGENTS.md, then mark the task as done in AGENTS.md by changing `[ ]` to `[x]`.
5. run `deno task build` to check for errors after every task completed.

- [ ] use https://github.com/avast/vuei18n-po for i18n, and translate all text to korean/english/japanese/chinese
- [ ] refactor and reduce code duplication
- [ ] add more interesting sorting algorithms if possible (preferably very efficient ones)

## Project Overview

Create a meme-style sorting algorithm visualizer web application using **Deno**, **Vite**, and **Vue 3**.
The application visualizes sorting algorithms by slicing an image (`nihaha.png`) into vertical strips and rearranging them. The audio (`nihaha.ogg`) plays chopped/pitch-shifted segments during both sorting and completion phases.

## Tech Stack & Environment

- **Runtime:** Deno.
- **Bundler:** Vite (Vue 3 configuration).
- **Framework:** Vue 3 (Composition API, `<script setup>`).
- **Rendering:** HTML5 Canvas API.
- **Audio:** Web Audio API (AudioContext).

## Core Mechanics

### Data Structure & Initialization

- **Array:** Represents X-coordinates of image slices.
- **Initial State:** On first load, the array must be **already shuffled** (randomized). Do not show the sorted image initially.
- **Values:** `0` to `Array.length - 1`.

### Visualization (Canvas API)

- **Image:** Load `public/assets/nihaha.png`.
- **Slicing:** Draw vertical strips of the image based on the array's current order.
- **Sorting Phase Visuals:** Highlight strips being compared (Red) or swapped (White).
- **Completion Phase Visuals:** Once sorted, perform a "linear sweep" animation. Highlight strips one by one from index `0` to `Length-1` (turning them Green or bright) synchronized with the full audio playback.

### Audio Engine

- **Source:** Load `public/assets/nihaha.ogg`.
- **Mode: Chopped Audio (All Phases)**
  - **Sorting Phase:**
    - Triggered on array access/swap.
    - Play a tiny segment (grain) of the buffer (e.g., 0.1s duration).
    - **Pitch Mapping:** `playbackRate` depends on the value of the element.
      - Low value = Low pitch, High value = High pitch.
  - **Completion Phase:**
    - Play individual chopped segments as the sweep progresses.
    - Each newly highlighted element triggers its corresponding audio segment.
    - Pitch mapped to element value (same as sorting phase).
    - **No full audio playback** - maintains consistency with sorting phase.

## Implementation Notes

- Use `requestAnimationFrame` for the rendering loop.
- **Batched Execution**: Process multiple sorting steps per frame (10 × speed multiplier) for performance.
- **Array Validation**: Always validate array existence and length before rendering.
- **Stats Tracking**: All algorithms track comparisons, arrayAccesses, and swaps.
- Manage `AudioContext` carefully (resume it on first user interaction if blocked by browser policy).
- Ensure the "Linear Sweep" visual during the completion phase looks like a progress bar scanning across the restored image.
- **Algorithm-Specific Sizes**: Inefficient algorithms (O(n²) or worse) automatically use smaller arrays (≤64 elements).
