#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const USAGE = "Usage: node scripts/bump-version.mjs <next-version>";
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[\da-zA-Z-][\da-zA-Z-]*)(?:\.(?:0|[1-9]\d*|[\da-zA-Z-][\da-zA-Z-]*))*))?(?:\+([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?$/;

const PACKAGE_JSON_PATH = path.resolve(process.cwd(), "package.json");
const TAURI_CONF_PATH = path.resolve(process.cwd(), "src-tauri/tauri.conf.json");
const CARGO_TOML_PATH = path.resolve(process.cwd(), "src-tauri/Cargo.toml");
const CARGO_LOCK_PATH = path.resolve(process.cwd(), "src-tauri/Cargo.lock");

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function ensureValidInputs(argv) {
  if (argv.length !== 1) {
    fail(`${USAGE}\nReceived ${argv.length} argument(s).`);
  }

  const [nextVersion] = argv;
  if (!SEMVER_REGEX.test(nextVersion)) {
    fail(`Invalid version '${nextVersion}'. Expected semver format (e.g. 0.2.1 or 0.2.1-beta.1).`);
  }

  return nextVersion;
}

async function readJson(filePath) {
  let content;
  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    fail(`Cannot read ${filePath}: ${error.message}`);
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    fail(`Cannot parse JSON in ${filePath}: ${error.message}`);
  }
}

async function readText(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    fail(`Cannot read ${filePath}: ${error.message}`);
  }
}

function getCargoPackageMetadata(cargoToml) {
  const packageSectionMatch = cargoToml.match(/\[package\][\s\S]*?(?=\n\[|$)/);
  if (!packageSectionMatch) {
    fail(`Could not find [package] section in ${CARGO_TOML_PATH}.`);
  }

  const packageSection = packageSectionMatch[0];
  const nameMatch = packageSection.match(/^\s*name\s*=\s*"([^"]+)"\s*$/m);
  const versionMatch = packageSection.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m);
  if (!nameMatch) {
    fail(`Could not find package name in ${CARGO_TOML_PATH}.`);
  }
  if (!versionMatch) {
    fail(`Could not find package version in ${CARGO_TOML_PATH}.`);
  }

  return {
    packageName: nameMatch[1],
    packageSection,
    currentVersion: versionMatch[1],
  };
}

function updateCargoPackageVersion(cargoToml, packageSection, nextVersion) {
  const updatedPackageSection = packageSection.replace(
    /(^\s*version\s*=\s*")([^"]+)("\s*$)/m,
    `$1${nextVersion}$3`,
  );

  if (updatedPackageSection === packageSection) {
    fail(`Failed to update package version in ${CARGO_TOML_PATH}.`);
  }

  return cargoToml.replace(packageSection, updatedPackageSection);
}

function getCargoLockPackageVersion(cargoLock, packageName) {
  const packageBlocks = cargoLock.split(/(?=^\[\[package\]\]$)/m);
  const matchedBlocks = packageBlocks.filter((block) =>
    new RegExp(`^name\\s*=\\s*\"${packageName}\"\\s*$`, "m").test(block),
  );

  if (matchedBlocks.length === 0) {
    fail(`Could not find package '${packageName}' in ${CARGO_LOCK_PATH}.`);
  }
  if (matchedBlocks.length > 1) {
    fail(`Found multiple package entries for '${packageName}' in ${CARGO_LOCK_PATH}.`);
  }

  const packageBlock = matchedBlocks[0];
  const versionMatch = packageBlock.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m);
  if (!versionMatch) {
    fail(`Could not find package version for '${packageName}' in ${CARGO_LOCK_PATH}.`);
  }

  return {
    packageBlock,
    currentVersion: versionMatch[1],
  };
}

function updateCargoLockPackageVersion(cargoLock, packageBlock, nextVersion) {
  const updatedPackageBlock = packageBlock.replace(
    /(^\s*version\s*=\s*")([^"]+)("\s*$)/m,
    `$1${nextVersion}$3`,
  );

  if (updatedPackageBlock === packageBlock) {
    fail(`Failed to update package version in ${CARGO_LOCK_PATH}.`);
  }

  return cargoLock.replace(packageBlock, updatedPackageBlock);
}

async function main() {
  const nextVersion = ensureValidInputs(process.argv.slice(2));

  const packageJson = await readJson(PACKAGE_JSON_PATH);
  const tauriConf = await readJson(TAURI_CONF_PATH);
  const cargoToml = await readText(CARGO_TOML_PATH);
  const cargoLock = await readText(CARGO_LOCK_PATH);

  const { packageName, packageSection, currentVersion: cargoVersion } =
    getCargoPackageMetadata(cargoToml);
  const { packageBlock, currentVersion: cargoLockVersion } = getCargoLockPackageVersion(
    cargoLock,
    packageName,
  );
  const packageVersion = packageJson.version;
  const tauriVersion = tauriConf.version;

  if (!packageVersion || !tauriVersion || !cargoVersion || !cargoLockVersion) {
    fail("One or more version fields are missing.");
  }

  if (
    packageVersion !== tauriVersion ||
    packageVersion !== cargoVersion ||
    packageVersion !== cargoLockVersion
  ) {
    fail(
      [
        "Current versions are inconsistent:",
        `- package.json: ${packageVersion}`,
        `- src-tauri/tauri.conf.json: ${tauriVersion}`,
        `- src-tauri/Cargo.toml: ${cargoVersion}`,
        `- src-tauri/Cargo.lock: ${cargoLockVersion}`,
      ].join("\n"),
    );
  }

  if (nextVersion === packageVersion) {
    fail(`Version is already ${nextVersion}. Provide a different version.`);
  }

  packageJson.version = nextVersion;
  tauriConf.version = nextVersion;
  const updatedCargoToml = updateCargoPackageVersion(cargoToml, packageSection, nextVersion);
  const updatedCargoLock = updateCargoLockPackageVersion(cargoLock, packageBlock, nextVersion);

  await Promise.all([
    writeFile(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8"),
    writeFile(TAURI_CONF_PATH, `${JSON.stringify(tauriConf, null, 2)}\n`, "utf8"),
    writeFile(CARGO_TOML_PATH, updatedCargoToml, "utf8"),
    writeFile(CARGO_LOCK_PATH, updatedCargoLock, "utf8"),
  ]);

  console.log(`Updated version ${packageVersion} -> ${nextVersion}`);
  console.log("- package.json");
  console.log("- src-tauri/tauri.conf.json");
  console.log("- src-tauri/Cargo.toml");
  console.log("- src-tauri/Cargo.lock");
}

await main();
