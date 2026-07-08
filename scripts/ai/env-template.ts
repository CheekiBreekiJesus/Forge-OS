import fs from "node:fs";

const example = fs.readFileSync(".env.example", "utf8");
const start = example.indexOf("# =============================================================================\n# FORGEOS AI GATEWAY");

if (start === -1) {
  console.log("# AI Gateway template is not present in .env.example yet.");
} else {
  console.log(example.slice(start).trim());
}
