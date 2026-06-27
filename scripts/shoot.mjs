import puppeteer from "puppeteer-core";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.SHOOT_URL || "http://localhost:3000/?nointro";
const OUT = process.env.SHOOT_OUT || "/tmp/8e-shot.png";
const W = Number(process.env.SHOOT_W || 1440);
const H = Number(process.env.SHOOT_H || 900);
const FULL = process.env.SHOOT_FULL === "1";
const SCROLL_TO = process.env.SHOOT_SCROLL; // px or selector

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1"],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });

// Gradually scroll to trigger reveals + lazy images, then return.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 180));
  }
  window.scrollTo(0, document.body.scrollHeight);
});
await sleep(900);

if (SCROLL_TO) {
  await page.evaluate((target) => {
    const el = /^\d+$/.test(target)
      ? null
      : document.querySelector(target);
    window.scrollTo(0, el ? el.getBoundingClientRect().top + window.scrollY - 90 : Number(target));
  }, SCROLL_TO);
  await sleep(1200);
} else {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(600);
}

await page.screenshot({ path: OUT, fullPage: FULL });
await browser.close();
console.log("shot ->", OUT);
