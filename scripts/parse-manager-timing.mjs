import { readFileSync } from "fs";

const log = readFileSync(
  "C:/Users/LENOVO/.cursor/projects/c-Users-LENOVO-Desktop-inclu-pilot/terminals/351505.txt",
  "utf8",
);

const lines = log.match(/GET \/manager 200 in [^\n]+/g) ?? [];
const totals = [];
const middleware = [];
const app = [];

for (const line of lines) {
  const totalMatch = line.match(/in ([\d.]+)(ms|s)/);
  if (!totalMatch) continue;
  let total =
    totalMatch[2] === "s"
      ? parseFloat(totalMatch[1]) * 1000
      : parseInt(totalMatch[1], 10);
  totals.push(total);

  const proxy = line.match(/proxy\.ts: (\d+)ms/);
  const appCode = line.match(/application-code: (\d+)ms/);
  if (proxy) middleware.push(parseInt(proxy[1], 10));
  if (appCode) app.push(parseInt(appCode[1], 10));
}

function stats(arr) {
  if (!arr.length) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return {
    n: arr.length,
    avg: Math.round(sum / arr.length),
    min: Math.min(...arr),
    max: Math.max(...arr),
    p95: arr.sort((a, b) => a - b)[Math.floor(arr.length * 0.95)] ?? arr.at(-1),
  };
}

console.log(JSON.stringify({ totals: stats(totals), middleware: stats(middleware), application: stats(app) }, null, 2));
