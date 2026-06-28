import { mkdir, readFile, writeFile } from "node:fs/promises";

const css = await readFile("src/styles.css", "utf8");
const scriptFiles = [
  "src/services/chains.js",
  "src/services/balanceEngine.js",
  "src/services/ankrRpc.js",
  "src/services/transactionEngine.js",
  "src/services/firebaseSchema.js",
  "src/services/vault.js",
  "src/services/runtimeConfig.js",
  "src/services/firebaseStore.js",
  "src/services/walletProvider.js",
  "src/services/liveEngine.js",
  "src/spec/systemSpec.js",
  "src/state/demoData.js",
  "src/app.js",
];

const scripts = await Promise.all(scriptFiles.map((file) => readFile(file, "utf8")));
const bundledJs = scripts
  .join("\n\n")
  .replace(/^import .*?;\n/gm, "")
  .replace(/\bexport\s+(async\s+function|const|let|var|function|class)\b/g, "$1");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exx Wallet Control Platform Preview</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script>
${bundledJs}
    </script>
  </body>
</html>
`;

await mkdir("outputs", { recursive: true });
await writeFile("outputs/exx-wallet-app.html", html);
await writeFile("outputs/exx-wallet-control-platform.html", html);
console.log("outputs/exx-wallet-app.html");
