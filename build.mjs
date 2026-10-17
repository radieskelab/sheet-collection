import { build } from "esbuild";
import fs from "fs";
import { execSync } from "child_process";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/SheetCollection.js",
  format: "iife",
  target: "es2019",
  legalComments: "inline"
});

fs.copyFileSync(
  "appsscript.json",
  "dist/appsscript.json"
);

fs.copyFileSync(
  "src/gas/Api.gs",
  "dist/Api.gs"
);

execSync(
  "npx tsc --emitDeclarationOnly --declaration --declarationMap --project tsconfig.json",
  {
    stdio: "inherit"
  }
);

console.log("Build concluído com sucesso para dist/!");