import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const run = (command) => {
  execSync(command, { stdio: 'inherit' });
};

const packageJsonPath = join(process.cwd(), 'package.json');
const pluginJsonPath = join(process.cwd(), 'src', 'plugin.json');
const distPath = join(process.cwd(), 'dist');
const packageRootPath = join(process.cwd(), 'package');

if (!existsSync(packageJsonPath) || !existsSync(pluginJsonPath)) {
  throw new Error('Run this script from the plugin root directory.');
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf8'));

const version = packageJson.version;
const pluginId = pluginJson.id;
const stagedPluginPath = join(packageRootPath, pluginId);
const outputZip = join(process.cwd(), `${pluginId}-${version}.zip`);

run('npm run build');

if (existsSync(packageRootPath)) {
  rmSync(packageRootPath, { recursive: true, force: true });
}

if (existsSync(outputZip)) {
  rmSync(outputZip, { force: true });
}

mkdirSync(stagedPluginPath, { recursive: true });
cpSync(distPath, stagedPluginPath, { recursive: true });

run(`cd "${packageRootPath}" && zip -r "${outputZip}" "${pluginId}"`);

rmSync(packageRootPath, { recursive: true, force: true });

console.log(`Created: ${outputZip}`);
