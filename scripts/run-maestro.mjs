import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'where.exe' : 'which';
const lookup = spawnSync(command, ['maestro'], {
  encoding: 'utf8',
});

if (lookup.status !== 0) {
  console.error('Nao foi possivel executar o Maestro porque a CLI nao esta instalada neste ambiente.');
  console.error('Instale a CLI e rode novamente: https://maestro.mobile.dev/getting-started/installing-maestro');
  process.exit(1);
}

const tags = process.env.MAESTRO_TAGS?.trim() || 'smoke';
const args = ['test', '--include-tags', tags, '.maestro'];

const result = spawnSync('maestro', args, {
  stdio: 'inherit',
});

if (result.error) {
  console.error('Nao foi possivel executar o Maestro. Instale a CLI antes de rodar pnpm test:e2e.');
  console.error('Guia rapido: https://maestro.mobile.dev/getting-started/installing-maestro');
  process.exit(1);
}

process.exit(result.status ?? 1);
