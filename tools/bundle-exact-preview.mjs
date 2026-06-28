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
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exx Wallet Real Mobile App</title>
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
console.log("outputs/exx-wallet-exact-preview.html");
