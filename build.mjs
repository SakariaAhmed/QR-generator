import { build, context } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
await mkdir("dist", { recursive: true });
for (const file of ["index.html", "style.css"])
  await copyFile(`web/${file}`, `dist/${file}`);
const options = {
  entryPoints: ["web/app.mjs"],
  bundle: true,
  minify: true,
  outfile: "dist/app.js",
  target: ["es2020"],
};
if (process.argv.includes("--serve")) {
  const ctx = await context(options);
  await ctx.watch();
  await ctx.serve({
    servedir: "dist",
    host: "127.0.0.1",
    port: Number(process.env.PORT || 4317),
  });
  console.log(`QR Studio: http://127.0.0.1:${process.env.PORT || 4317}`);
} else await build(options);
