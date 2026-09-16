import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const inputDir = path.join(root, "src", "assets", "capsulesv2");
const outputDir = path.join(root, "src", "assets", "capsulesv2-web");

if (!ffmpegPath) {
  console.error("ffmpeg-static binary missing");
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const files = fs
  .readdirSync(inputDir)
  .filter((name) => name.toLowerCase().endsWith(".mp4"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

function run(file) {
  return new Promise((resolve, reject) => {
    const input = path.join(inputDir, file);
    const output = path.join(outputDir, file);
    const args = [
      "-y",
      "-i",
      input,
      "-vf",
      "scale='min(720,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "28",
      "-profile:v",
      "main",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-ac",
      "1",
      "-movflags",
      "+faststart",
      output,
    ];
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${file} failed (${code}): ${err.slice(-400)}`));
    });
  });
}

const before = files.reduce((sum, file) => sum + fs.statSync(path.join(inputDir, file)).size, 0);
console.log(`Compressing ${files.length} videos… (${(before / 1e6).toFixed(0)} MB in)`);

for (const [index, file] of files.entries()) {
  const t0 = Date.now();
  process.stdout.write(`[${index + 1}/${files.length}] ${file} … `);
  await run(file);
  const inSize = fs.statSync(path.join(inputDir, file)).size;
  const outSize = fs.statSync(path.join(outputDir, file)).size;
  console.log(
    `${(inSize / 1e6).toFixed(1)}→${(outSize / 1e6).toFixed(1)} MB (${Math.round((Date.now() - t0) / 1000)}s)`,
  );
}

const after = files.reduce((sum, file) => sum + fs.statSync(path.join(outputDir, file)).size, 0);
console.log(`Done. ${(before / 1e6).toFixed(0)} MB → ${(after / 1e6).toFixed(0)} MB`);
