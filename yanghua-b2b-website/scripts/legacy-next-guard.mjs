const command = process.argv[2] || 'dev';

const legacyCommandByName = {
  dev: 'npm run legacy:next:dev',
  build: 'npm run legacy:next:build',
  start: 'npm run legacy:next:start',
};

const legacyCommand = legacyCommandByName[command] || 'npm run legacy:next:dev';

console.error(`
This Next.js app is now a legacy content and Tina source, not the default local frontend.

Use the Astro Small Business theme from the monorepo root instead:
  cd ..
  npm run ${command}

If you intentionally need to debug the archived Next frontend, run:
  ${legacyCommand}
`);

process.exit(1);
