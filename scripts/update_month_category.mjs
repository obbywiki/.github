#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const README = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "profile", "README.md");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// e.g. <a href="https://obby.wiki/Category:August_2026">August 2026</a>
const pattern = /(https:\/\/obby\.wiki\/Category:)[A-Za-z]+_\d{4}(">)[A-Za-z]+ \d{4}(<\/a>)/g;

const now = new Date();
const month = MONTHS[now.getUTCMonth()];
const label = `${month} ${now.getUTCFullYear()}`;

const readme = readFileSync(README, "utf8");
if (!readme.match(pattern)) {
  console.error("no Category:<Month>_<Year> link found in profile/README.md");
  process.exit(1);
}

const updated = readme.replace(pattern, `$1${month}_${now.getUTCFullYear()}$2${label}$3`);
if (updated === readme) {
  console.log(`Category link already points at ${label}`);
} else {
  writeFileSync(README, updated);
  console.log(`Category link updated to ${label}`);
}
