import type Shell from '../Shell';
import Platform from '../constants/Platform';

export async function isCommandAvailable(shell: Shell, command: string): Promise<boolean> {
  switch (await shell.platform()) {
    case Platform.WINDOWS:
      return await shell.$`pwsh -command "Get-Command ${command} -ErrorAction SilentlyContinue"`.boolean();
    default:
      return await shell.$`command -v ${command}`.boolean(true);
  }
}
