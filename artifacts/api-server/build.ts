import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All packages in this list get BUNDLED into dist/index.js
// Both pg and bcryptjs are pure JavaScript — safe to bundle
const bundled = [
  "bcryptjs",
  "cookie-parser",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-session",
  "pg",
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

  // Only externalize packages that are NOT in bundled list
  // AND are not workspace packages (workspace packages MUST be bundled)
  const externals = allDeps.filter(
    (dep) =>
      !bundled.includes(dep) &&
      !(pkg.dependencies?.[dep]?.startsWith("workspace:")),
  );

  console.log("Externalized (NOT bundled):", externals);

  await esbuild({
    entryPoints: [path.resolve(__dirname, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(distDir, "index.js"),
    external: externals,
    minify: false,
    logLevel: "info",
  });

  console.log("Build complete → dist/index.js");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});

