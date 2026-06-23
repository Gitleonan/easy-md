import { readFile, writeFile } from 'node:fs/promises';

const packageJsonPath = new URL('../package.json', import.meta.url);
const cargoTomlPath = new URL('../src-tauri/Cargo.toml', import.meta.url);

const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const version = packageJson.version;

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`package.json version must be semver-compatible, got: ${version}`);
}

const cargoToml = await readFile(cargoTomlPath, 'utf8');
const nextCargoToml = cargoToml.replace(
  /^version = ".*"$/m,
  `version = "${version}"`,
);

if (nextCargoToml === cargoToml) {
  console.log(`Cargo.toml already matches package.json version ${version}`);
} else {
  await writeFile(cargoTomlPath, nextCargoToml);
  console.log(`Synced src-tauri/Cargo.toml to package.json version ${version}`);
}
