import { mkdir, readFile, writeFile } from "node:fs/promises";

const css = await readFile("src/exactStyles.css", "utf8");
const assets = await readFile("src/generated/exactAssets.js", "utf8");
const js = await readFile("src/exactApp.js", "utf8");

function buildHtml(forcedDevice = "") {
  const forcedDeviceScript = forcedDevice ? `window.EXX_FORCED_DEVICE = "${forcedDevice}";\n` : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Exx Wallet</title>
    <link rel="icon" type="image/png" href="./favicon.png" />
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script>
${forcedDeviceScript}
${assets}
${js}
    </script>
  </body>
</html>
`;
}

await mkdir("outputs", { recursive: true });
await writeFile("outputs/exx-wallet-exact-preview.html", buildHtml());
await writeFile("outputs/exx-wallet-preview.html", buildHtml());
await writeFile("outputs/exx-wallet-iphone.html", buildHtml("ios"));
await writeFile("outputs/exx-wallet-android.html", buildHtml("android"));
// The deployed root: a single self-contained file (CSS + JS + logo assets
// inlined) so it renders identically anywhere, with no /src path dependencies.
await writeFile("index.html", buildHtml());
console.log("index.html (self-contained) + outputs/exx-wallet-preview.html");
