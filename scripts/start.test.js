import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const startScript = fileURLToPath(new URL('./start.sh', import.meta.url));

describe('development startup script', () => {
  let temporaryDirectory;
  let binDirectory;
  let commandLog;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'tirith-start-'));
    binDirectory = join(temporaryDirectory, 'bin');
    commandLog = join(temporaryDirectory, 'commands.log');

    writeExecutable(
      binDirectory,
      'docker',
      `#!/bin/sh
printf 'docker %s\\n' "$*" >> "$COMMAND_LOG"
case " $* " in
  *" up "*)
    if [ "$FAIL_COMPOSE_UP" = "1" ]; then
      echo 'compose failed' >&2
      exit 42
    fi
    ;;
esac
`,
    );
    writeExecutable(
      binDirectory,
      'tmux',
      `#!/bin/sh
printf 'tmux %s\\n' "$*" >> "$COMMAND_LOG"
`,
    );
    writeExecutable(
      binDirectory,
      'pnpm',
      `#!/bin/sh
printf 'pnpm %s\\n' "$*" >> "$COMMAND_LOG"
`,
    );
  });

  afterEach(() => {
    rmSync(temporaryDirectory, {recursive: true, force: true});
  });

  it('stops and exposes the error when Docker Compose cannot start the services', () => {
    const result = runStartScript({FAIL_COMPOSE_UP: '1'});
    const commands = readFileSync(commandLog, 'utf8');

    expect(result.status).toBe(42);
    expect(result.stderr).toContain('compose failed');
    expect(commands).not.toContain('tmux');
    expect(commands).not.toContain('pnpm');
  });

  it('waits for the Docker services before attaching to tirith', () => {
    const result = runStartScript();
    const commands = readFileSync(commandLog, 'utf8').split('\n');

    expect(result.status).toBe(0);
    expect(commands[1]).toContain(
      'docker compose -f docker-compose.dev.yml up -d --build --wait',
    );
    expect(commands[2]).toContain('tmux new-window');
  });

  function runStartScript(environment = {}) {
    return spawnSync('bash', [startScript], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        ...environment,
        PATH: `${binDirectory}:${process.env.PATH}`,
        COMMAND_LOG: commandLog,
      },
    });
  }
});

function writeExecutable(directory, name, content) {
  mkdirSync(directory, {recursive: true});
  const path = join(directory, name);
  writeFileSync(path, content);
  chmodSync(path, 0o755);
}
