#!/usr/bin/env node

import inquirer from 'inquirer';
import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

// Helper function: read package.json in the directory where CLI was called:
function loadPackageJson() {
	const pkgPath = path.join(process.cwd(), 'package.json');
	try {
		const text = fs.readFileSync(pkgPath, 'utf-8');
		return JSON.parse(text);
	} catch (e) {
		console.error(`❌ Failed to read ${pkgPath}: ${e.message}`);
		process.exit(1);
	}
}

// Функция расчёта следующей версии (из вашего скрипта)
function getNextVersion(currentVersion, versionType, identifier = '') {
	if (!versionType.startsWith('pre')) {
		return semver.inc(currentVersion, versionType);
	}
	if (identifier && identifier !== 'standard') {
		return semver.inc(currentVersion, versionType, identifier);
	} else {
		return semver.inc(currentVersion, versionType);
	}
}

async function main() {
	// 1) Load package.json of the target project
	const pkg = loadPackageJson();
	const currentVersion = pkg.version;

	// 2) Предварительный расчёт «кандидатов» версий
	const nextPatchVersion = getNextVersion(currentVersion, 'patch');
	const nextMinorVersion = getNextVersion(currentVersion, 'minor');
	const nextMajorVersion = getNextVersion(currentVersion, 'major');
	const nextPrepatchVersion = getNextVersion(currentVersion, 'prepatch');
	const nextPreminorVersion = getNextVersion(currentVersion, 'preminor');
	const nextPremajorVersion = getNextVersion(currentVersion, 'premajor');
	const nextPrereleaseVersion = getNextVersion(currentVersion, 'prerelease');

	// 3) First step: ask if we want "tag-only" or increment
	const { action } = await inquirer.prompt([
		{
			type: 'list',
			name: 'action',
			message: 'What do you want to do?',
			loop: false,
			choices: [
				{ name: `Bump version (current: ${currentVersion})`, value: 'increment' },
				{ name: `Create tag with current version (${currentVersion})`, value: 'tag-only' },
			],
		},
	]);

	if (action === 'tag-only') {
		const tagName = `v${currentVersion}`;
		console.log(`🔖 Creating Git tag: ${tagName}…`);

		try {
			const existingTags = execSync('git tag', { stdio: 'pipe' }).toString().split('\n');
			if (existingTags.includes(tagName)) {
				console.error(`❌ Tag ${tagName} already exists.`);
				const { overwrite } = await inquirer.prompt([
					{
						type: 'confirm',
						name: 'overwrite',
						message: `Overwrite tag ${tagName}?`,
						default: false,
					},
				]);
				if (overwrite) {
					console.log(`Deleting existing tag ${tagName}…`);
					execSync(`git tag -d ${tagName}`, { stdio: 'inherit' });
				} else {
					console.log('Operation cancelled.');
					return;
				}
			}
			// Create tag
			execSync(`git tag -a ${tagName} -m "Release version ${currentVersion}"`, { stdio: 'inherit' });
			console.log(`✅ Tag ${tagName} created successfully.`);

			const { shouldPush } = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'shouldPush',
					message: 'Push tag to remote repository?',
					default: false,
				},
			]);
			if (shouldPush) {
				console.log('Pushing tag…');

				try {
					// Check if tag already exists on remote
					const remoteTags = execSync('git ls-remote --tags origin', { stdio: 'pipe' }).toString();
					if (remoteTags.includes(`refs/tags/${tagName}`)) {
						console.log(`Tag ${tagName} already exists on remote.`);
						const { forceUpdate } = await inquirer.prompt([
							{
								type: 'confirm',
								name: 'forceUpdate',
								message: 'Force update tag on remote?',
								default: false,
							},
						]);
						if (forceUpdate) {
							console.log('Force-pushing tag…');
							execSync(`git push -f origin ${tagName}`, { stdio: 'inherit' });
							console.log('✅ Tag updated on remote.');
						} else {
							console.log('Tag push cancelled.');
						}
						return;
					}
				} catch (ignore) {
					console.log('⚠️ Failed to check remote tags, continuing…');
				}

				// If tag does not exist, push
				execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
				console.log('✅ Tag pushed successfully.');
			}
			return;
		} catch (err) {
			console.error(`❌ Error working with Git tag: ${err.message}`);
			return;
		}
	}

	// 4) If "increment" was chosen, ask for bump type
	const { versionType } = await inquirer.prompt([
		{
			type: 'list',
			name: 'versionType',
			message: 'Select version bump type:',
			loop: false,
			choices: [
				{ name: `patch (${currentVersion} → ${nextPatchVersion})`, value: 'patch' },
				{ name: `minor (${currentVersion} → ${nextMinorVersion})`, value: 'minor' },
				{ name: `major (${currentVersion} → ${nextMajorVersion})`, value: 'major' },
				new inquirer.Separator('--- Pre-release ---'),
				{ name: `prepatch (${currentVersion} → ${nextPrepatchVersion})`, value: 'prepatch' },
				{ name: `preminor (${currentVersion} → ${nextPreminorVersion})`, value: 'preminor' },
				{ name: `premajor (${currentVersion} → ${nextPremajorVersion})`, value: 'premajor' },
				{ name: `prerelease (${currentVersion} → ${nextPrereleaseVersion})`, value: 'prerelease' },
			],
		},
	]);

	// Формируем команду `npm version`
	let versionCommand = `npm version ${versionType}`;
	let preidOption = '';

	if (versionType.startsWith('pre')) {
		// Ask for pre-identifier
		const standardVersion = getNextVersion(currentVersion, versionType);
		const alphaVersion = getNextVersion(currentVersion, versionType, 'alpha');
		const betaVersion = getNextVersion(currentVersion, versionType, 'beta');
		const rcVersion = getNextVersion(currentVersion, versionType, 'rc');

		const { preReleaseType } = await inquirer.prompt([
			{
				type: 'list',
				name: 'preReleaseType',
				message: `Select pre-release (${currentVersion} → …):`,
				loop: false,
				choices: [
					{ name: `standard (${currentVersion} → ${standardVersion})`, value: 'standard' },
					{ name: `alpha (${currentVersion} → ${alphaVersion})`, value: 'alpha' },
					{ name: `beta (${currentVersion} → ${betaVersion})`, value: 'beta' },
					{ name: `rc (${currentVersion} → ${rcVersion})`, value: 'rc' },
				],
			},
		]);

		if (preReleaseType !== 'standard') {
			preidOption = ` --preid=${preReleaseType}`;
			versionCommand += preidOption;
		}
	}

	console.log(`🚀 Running: ${versionCommand} …`);
	try {
		execSync(versionCommand, { stdio: 'inherit' });
		// Get new version
		const newVersion = execSync('npm pkg get version', { stdio: 'pipe' })
			.toString()
			.trim()
			.replace(/"/g, '');
		console.log(`✅ Version changed: ${currentVersion} → ${newVersion}`);

		const { shouldPush } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'shouldPush',
				message: 'Push changes and tags to remote?',
				default: false,
			},
		]);
		if (shouldPush) {
			console.log('Pushing changes and tags…');
			execSync('git push --follow-tags', { stdio: 'inherit' });
			console.log('✅ Successfully pushed.');
		}
	} catch (err) {
		console.error(`❌ Error during bump-version: ${err.message}`);
	}
}

main();