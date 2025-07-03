# bump-version-cli

A simple interactive CLI tool for bumping the version in your project's `package.json` and creating Git tags, with optional pushing to a remote repository.

## Features

- Interactive prompts for version bumping or tag creation
- Supports all standard [semver](https://semver.org/) version increments (patch, minor, major, prepatch, preminor, premajor, prerelease)
- Pre-release identifiers: standard, alpha, beta, rc
- Creates annotated Git tags
- Optionally pushes tags and commits to remote
- Safe: checks for existing tags locally and remotely, with overwrite/force options

## Installation

Clone this repository and install dependencies:

```bash
git clone <your-repo-url>
cd bump-version-cli
npm install
```

You can link the CLI for global use:

```bash
npm link
```

## Usage

Navigate to your project directory (must contain a `package.json`), then run:

```bash
bump-version-cli
```

Or, if not linked globally:

```bash
npx path/to/bump-version-cli/index.js
```

## How It Works

1. **Choose Action**  
   - _Bump version (current: X.Y.Z)_: Increment the version in `package.json` and create a Git tag.
   - _Create tag with current version (X.Y.Z)_: Only create a Git tag for the current version.

2. **Select Version Type**  
   If you choose to bump the version, select the type of increment:
   - patch, minor, major
   - prepatch, preminor, premajor, prerelease (with pre-release identifier: standard, alpha, beta, rc)

3. **Tag Handling**  
   - If a tag already exists, you can choose to overwrite it.
   - If pushing to remote, you can force-update the tag if it exists remotely.

4. **Push to Remote**  
   - Optionally push the commit and tag to your remote repository.

## Example Session

```
? What do you want to do? (Use arrow keys)
❯ Bump version (current: 1.2.3)
  Create tag with current version (1.2.3)

? Select version bump type: (Use arrow keys)
❯ patch (1.2.3 → 1.2.4)
  minor (1.2.3 → 1.3.0)
  major (1.2.3 → 2.0.0)
  --- Pre-release ---
  prepatch (1.2.3 → 1.2.4-0)
  preminor (1.2.3 → 1.3.0-0)
  premajor (1.2.3 → 2.0.0-0)
  prerelease (1.2.3 → 1.2.4-0)

? Select pre-release (1.2.3 → …): (Use arrow keys)
❯ standard (1.2.3 → 1.2.4-0)
  alpha (1.2.3 → 1.2.4-alpha.0)
  beta (1.2.3 → 1.2.4-beta.0)
  rc (1.2.3 → 1.2.4-rc.0)

🚀 Running: npm version patch …
✅ Version changed: 1.2.3 → 1.2.4

? Push changes and tags to remote? (y/N)
```

## Requirements

- Node.js v14 or newer
- Git installed and initialized in your project

## Notes

- The tool must be run from the root of your Node.js project (where `package.json` is located).
- Make sure you have committed all changes before running the tool to avoid conflicts.

## License

MIT
