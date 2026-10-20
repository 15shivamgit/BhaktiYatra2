// Block until the E2E API answers, so `next build` prerenders real content instead of the
// empty build fallback (lib/api/content.js).
const url = process.argv[2];
const deadline = Date.now() + 180_000;
while (Date.now() < deadline) {
  try {
    const res = await fetch(url);
    if (res.ok) process.exit(0);
  } catch {
    // not up yet
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
console.error(`API at ${url} did not become ready`);
process.exit(1);
