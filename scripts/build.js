const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const assets = ["index.html", "src", "picsforfeedback"];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

assets.forEach((asset) => {
  const from = path.join(root, asset);
  if (!fs.existsSync(from)) return;
  const to = path.join(dist, asset);
  fs.cpSync(from, to, { recursive: true });
});

console.log("built static site to dist/");
