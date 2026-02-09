import { exec as childProcessExec } from 'node:child_process';

type ExecResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export default function exec(cmd: string, options: { stdin?: string; signal?: AbortSignal }) {
  const { stdin, signal } = options;

  return new Promise<ExecResult>((resolve) => {
    let fullfilled = false;
    function handleResolve(result: ExecResult) {
      if (fullfilled) {
        return;
      }

      fullfilled = true;
      resolve(result);
    }

    const child = childProcessExec(cmd, (error, stdout, stderr) => {
      if (error) {
        handleResolve({
          exitCode: error.code || null,
          stdout,
          stderr,
        });
        return;
      }

      handleResolve({
        exitCode: 0,
        stdout,
        stderr,
      });
    });

    if (!child) {
      handleResolve({
        exitCode: null,
        stdout: '',
        stderr: 'Failed to execute command',
      });
      return;
    }

    // send data to stdin
    if (child?.stdin) {
      if (stdin) {
        child.stdin.write(stdin);
      }

      child.stdin.end();
    }

    // Listen for the 'close' event to capture non-zero exit codes
    child.on('close', (code) => {
      if (code !== 0) {
        handleResolve({
          exitCode: code,
          stdout: child.stdout ? child.stdout.toString() : '',
          stderr: child.stderr ? child.stderr.toString() : '',
        });
      }
    });

    // Handle 'error' events (e.g., if the process couldn't be spawned)
    child.on('error', (err) => {
      handleResolve({
        exitCode: Number((err as NodeJS.ErrnoException).code) || null,
        stdout: '',
        stderr: err.message,
      });
    });

    if (signal) {
      signal.addEventListener('abort', () => {
        handleResolve({
          exitCode: null,
          stdout: '',
          stderr: signal.reason || 'Command aborted',
        });

        child.kill();
      });
    }
  });
}
