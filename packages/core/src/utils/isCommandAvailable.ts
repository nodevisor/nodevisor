import type Nodevisor from '../Nodevisor';
import Platform from '../constants/Platform';

export async function isCommandAvailable(nodevisor: Nodevisor, command: string): Promise<boolean> {
  switch (await nodevisor.platform()) {
    case Platform.WINDOWS:
      return await nodevisor.$`powershell -command "Get-Command ${command} -ErrorAction SilentlyContinue"`.boolean();
    default:
      return await nodevisor.$`command -v ${command}`.boolean(true);
  }
}
