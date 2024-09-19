<picture>
  <img alt="Nodevisor Logo" width="150px" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</picture>

# Nodevisor

Easily manage servers and deploy applications, all under your control.
Nodevisor **unifies** scripts across different platforms, helping you avoid common problems when managing servers and scaling apps.

**_Note:_** We're just starting out, so things might change as we grow.

## Why choose Nodevisor?

- **Works everywhere:** Manage Linux, Mac, and Windows servers without having to learn different commands for each system.
- **Familiar API**: Nodevisor’s API is similar to Node.js, making it easy for developers to start using.
- **Automate your setup:** Set up and manage servers using code, simple YAML files, command line, or a web interface (coming soon).
- **Easy app deployment:** Deploy and scale your apps from one server to thousands.
- **Secure:** Keep passwords and other sensitive data safe during server tasks.
- **One tool for everything:** Handle server setups, deployments, and automation tasks with one platform.
- **Built-in integration:** Built-in Integration: Directly control Docker containers, Docker Swarm services, and manage AWS cloud resources with Nodevisor.

## How you can use Nodevisor

Nodevisor lets you control your servers in different ways:

- **Remote control with SSH:** Manage servers remotely using SSH, which lets you run commands securely.
- **Local control:** Manage your computer without needing SSH, perfect for local tasks and automation.

### Coming soon

Nodevisor is still in the early stages, and we’re working on exciting new features:

- **Server/client mode:** Securely connect clients to a Nodevisor server to manage changes and instructions.
- **Web interface:** An easy-to-use website to manage servers. You can host it yourself or use our cloud version for quick access.
- **GitHub Actions integration:** Easily integrate with CI/CD pipelines for smoother deployment.
- **YAML configuration:** Set up servers simply using YAML files.

## Writing shell scripts with Nodevisor

Nodevisor allows you to write shell scripts with the simplicity of template literals, making it easier and safer to work with shell commands. Nodevisor automatically handles variable escaping and error management.

### Installation

Install Nodevisor as a standard Node.js library:

```sh
npm install nodevisor
```

### Local Usage

To run commands locally, simply use the $ function provided by Nodevisor. No additional configuration is required for local execution.

```ts
import $ from 'nodevisor';

const result = await $`echo "Hello, World!"`;

console.log(result); // "Hello, World!"
```

### Remote Usage

To run commands on a remote machine via SSH, you can create a new Nodevisor instance with remote connection options.

```ts
import $ from 'nodevisor';

const $con = $.connect({
  host: 'your-server-address',
  username: 'runner',
});

const result = await $con`echo "Hello, World!"`;
console.log(result); // "Hello, World!"

const username = await $con`whoami`;
console.log(username); // runner
```

### Escape variables

Nodevisor automatically escapes variables to prevent shell injection attacks. You can safely use variables in your commands without worrying about special characters:

```ts
import $ from 'nodevisor';

const name = 'my-directory';
await $`mkdir ${name}`;
```

More information about escaping variables can be found [here](https://nodevisor.com/docs/quotes).

### Command Line - Comming Soon

To install Nodevisor, run this command:

```bash
npm install -g nodevisor

nodevisor --host your-server-address --username runner --command "echo 'Hello, World!'"
```

### YAML Configuration - Comming Soon

You can also use YAML to configure your Nodevisor instance.

```yaml

- name: Prepare web servers
  remote_user: root
  hosts:
    - '192.168.1.1'
    - '192.168.1.2'
    - '192.168.1.3'

  tasks:
  - name: Install packages
    nodevisor.packages
      install:
        - curl
        - git
```

## Guides

### Initialize remote VPS

```ts
import $, { authorizedKeys, packages, ufw, users, ssh } from 'nodevisor';

const USER_USERNAME = 'runner';
const SSH_PUBLIC_KEY = 'your-public-key';

const hosts = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

async function initialize(host: string) {
  const $con = $.connect({
    host,
    username: 'root',
  });

  // update and upgrade all system packages
  await $con(packages).updateAndUpgrade();

  // install ufw firewall
  await $con(ufw).install({
    allow: [services.ssh, services.web, services.webSecure],
    enable: true,
  });

  // assign local public key to the server
  await $con(authorizedKeys).write(SSH_PUBLIC_KEY);

  // create user named runner
  await $con(users).add(USER_USERNAME);

  // switch to user named runner
  const $runner = $con.as(USER_USERNAME);

  // allow user to login with public key
  await $runner(authorizedKeys).write(SSH_PUBLIC_KEY);

  // disable login with password
  await $con(ssh).disablePasswordAuthentication();
}

const results = await Promise.all(hosts.map((host) => initialize(host)));
```

### Install packages on remote server

Installing packages on a remote server is easy because will determine the package manager based on the operating system.
It will use:

- apt (Debian, Ubuntu)
- yum (Fedora, CentOS, RHEL)
- brew (macOS)
- winget (Windows)

```ts
import $, { packages } from 'nodevisor';

const $con = $.connect({
  host: 'server-address',
  username: 'root',
  password: 'password',
});

await $con(packages).install('curl');
```

### Supported operating systems

Nodevisor is tested on:

- Linux: Ubuntu 20+, Debian 11+, Fedora 39+
- macOS: macOS 12+
- Windows: Windows 10+ (PowerShell required)

## License

Nodevisor has a special license. In some cases, you may need to get a company license.

You can use Nodevisor for free if:

- You are using it for personal use.
- You are an organization managing up to 2 servers.
- You are a non-profit organization.
- You are trying out Nodevisor to see if it works for you, without commercial use.

For more details, read our [LICENSE page](https://github.com/nodevisor/nodevisor/blob/main/LICENSE.md).

## Pricing

We offer simple pricing:

- **$9 per server, per month:**

You get all features and unlimited users.

For more details, check our [pricing page](https://www.nodevisor.com/pricing).

## Need help?

If you have questions or need help, please open an issue on our [GitHub issues page](https://github.com/nodevisor/nodevisor/issues/new?title=Help%20needed%3A%20Question%20about%20Nodevisor&labels=question).

**Start using Nodevisor today and make server management and deployments easier**
