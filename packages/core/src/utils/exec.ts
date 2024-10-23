import { exec as childProcessExec } from 'node:child_process';

export default function execCmd(cmd: string, stdin?: string) {
  return new Promise<{
    exitCode: number | null;
    stdout: string;
    stderr: string;
  }>((resolve) => {
    const child = childProcessExec(cmd, (error, stdout, stderr) => {
      if (error) {
        resolve({
          exitCode: error.code || null,
          stdout,
          stderr,
        });
        return;
      }

      resolve({
        exitCode: 0,
        stdout,
        stderr,
      });
    });

    if (!child) {
      resolve({
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
        resolve({
          exitCode: code,
          stdout: child.stdout ? child.stdout.toString() : '',
          stderr: child.stderr ? child.stderr.toString() : '',
        });
      }
    });

    // Handle 'error' events (e.g., if the process couldn't be spawned)
    child.on('error', (err) => {
      resolve({
        exitCode: Number((err as NodeJS.ErrnoException).code) || null,
        stdout: '',
        stderr: err.message,
      });
    });
  });
}
