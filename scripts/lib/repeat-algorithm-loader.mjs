import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const buildDir = path.resolve('.repeat-build');

export function loadRepeatAlgorithm() {
  execFileSync('npx', [
    'tsc',
    'src/lib/questionDisplay.ts',
    'src/lib/questionRepeatAlgorithm.ts',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--outDir',
    buildDir,
    '--skipLibCheck',
    '--esModuleInterop',
    '--noEmit',
    'false',
  ], { stdio: 'ignore' });

  const require = createRequire(import.meta.url);
  return {
    ...require(path.join(buildDir, 'questionDisplay.js')),
    ...require(path.join(buildDir, 'questionRepeatAlgorithm.js')),
  };
}
