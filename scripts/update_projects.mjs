#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ORG = "obbywiki";
const README = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "profile", "README.md");
const START = "<!-- PROJECTS:START -->";
const END = "<!-- PROJECTS:END -->";

// (display name, repo slug)
const PROJECTS = [
  ["DynamicJsonLD", "mediawiki-extensions-DynamicJsonLD"],
  ["IntegratedProfiles", "mediawiki-extensions-IntegratedProfiles"],
  ["UserFlairs", "mediawiki-extensions-UserFlairs"],
  ["TrendingArticles", "mediawiki-extensions-TrendingArticles"],
  ["RobloxPlaceMediaExtractor", "mediawiki-extensions-RobloxPlaceMediaExtractor"],
  ["WikiWire", "wikiwire"]
];

async function api(p) {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com${p}`, { headers });
  if (!response.ok) {
    const error = new Error(`GET ${p} failed: HTTP ${response.status}`);
    if (response.status === 403) error.message += " (rate limited? set GITHUB_TOKEN)";

    error.status = response.status;

    throw error;
  }
  return response.json();
}

async function latestVersion(slug) {
  try {
    return (await api(`/repos/${slug}/releases/latest`)).tag_name;
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  const tags = await api(`/repos/${slug}/tags`);
  return tags.length ? tags[0].name : "—";
}

const rows = ["| Project | Description | Latest release |", "| --- | --- | --- |"];
for (const [name, slug] of PROJECTS) {
  const repo = await api(`/repos/${ORG}/${slug}`);
  let description = (repo.description ?? "").replaceAll("|", "\\|");

  if (repo.archived) description = `*(archived)* ${description}`;
  
  const version = await latestVersion(`${ORG}/${slug}`);
  rows.push(`| [${name}](https://github.com/${ORG}/${slug}) | ${description} | ${version} |`);
}

const readme = readFileSync(README, "utf8");
if (!readme.includes(START) || !readme.includes(END)) {
  console.error(`${README} is missing the ${START}/${END} markers`);
  process.exit(1);
}

const [head, rest] = readme.split(START);
const [, tail] = rest.split(END);
const updated = head + START + "\n" + rows.join("\n") + "\n" + END + tail;

if (updated === readme) {
  console.log("Projects table is already up to date");
} else {
  writeFileSync(README, updated);
  console.log("Projects table updated");
}
