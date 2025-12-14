#!/usr/bin/env -S deno run --allow-write --allow-read
/// <reference lib="deno.ns" />

/**
 * Create a simple gradient test image as a placeholder for nihaha.png
 * This generates an HTML canvas-based PNG image with colored vertical stripes
 */

const WIDTH = 1920
const HEIGHT = 1080
const STRIPE_COUNT = 128

console.log("Creating placeholder test image...")
console.log(`Dimensions: ${WIDTH}x${HEIGHT}`)
console.log(`Stripes: ${STRIPE_COUNT}`)

// Create a simple HTML file that generates the image
const html = `<!DOCTYPE html>
<html>
<head>
  <title>Generate Test Image</title>
</head>
<body>
  <canvas id="canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const stripeWidth = ${WIDTH} / ${STRIPE_COUNT};

    // Create colorful vertical stripes
    for (let i = 0; i < ${STRIPE_COUNT}; i++) {
      const hue = (i / ${STRIPE_COUNT}) * 360;
      ctx.fillStyle = \`hsl(\${hue}, 70%, 60%)\`;
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, ${HEIGHT});
    }

    // Add some text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText('NIHAHA TEST IMAGE', ${WIDTH / 2}, ${HEIGHT / 2});
    ctx.fillText('NIHAHA TEST IMAGE', ${WIDTH / 2}, ${HEIGHT / 2});

    // Convert to data URL and trigger download
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nihaha.png';
      a.click();
      console.log('Image generated! Check your downloads folder.');
    });
  </script>
</body>
</html>
`

// Write the HTML file
await Deno.writeTextFile("generate-test-image.html", html)

console.log("\nHTML generator created: generate-test-image.html")
console.log("\nTo create the test image:")
console.log("1. Open generate-test-image.html in a web browser")
console.log("2. The image will be automatically downloaded as nihaha.png")
console.log("3. Move nihaha.png to public/assets/")
console.log(
  "\nFor audio, you can use any .ogg file and rename it to nihaha.ogg",
)
