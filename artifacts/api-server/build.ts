import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// These packages are bundled into the final output
const allowlist = [
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-session",
  "cookie-parser",
  "zod",
];

async function buildAll() {
  const distDir = path.resolve(__dirname, "dist");
  await rm(distDir, { recursive: true, force: true });

  console.log("Building server...");
  const pkgPath = path.resolve(__dirname, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  // Externalize native packages and anything NOT in allowlist
  const nativePackages = ["bcrypt", "bcryptjs", "pg"];
  const externals = [
    ...new Set([
      ...nativePackages,
      ...allDeps.filter(
        (dep) =>
          !allowlist.includes(dep) &&
          !(pkg.dependencies?.[dep]?.startsWith("workspace:")),
      ),
    ]),
  ];

  await esbuild({
    entryPoints: [path.resolve(__dirname, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",           // CommonJS output
    outfile: path.resolve(distDir, "index.js"),  // dist/index.js
    external: externals,
    minify: false,           // keep readable for Render logs
    logLevel: "info",
  });

  console.log("Build complete → dist/index.js");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
