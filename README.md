<picture>
  <img alt="Nodevisor Logo" width="150px" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</picture>

# Nodevisor - Infrastructure as code

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

To run commands locally, simply use the `$` function provided by Nodevisor. No additional configuration is required for local execution.

```ts
import $ from 'nodevisor';

const result = await $`echo "Hello, World!"`;

console.log(result); // "Hello, World!"
```

_Explanation:_ This code snippet demonstrates how to run a local shell command using Nodevisor. The $ function allows you to execute shell commands within template literals and returns the output of the command.

### Remote Usage

To run commands on a remote machine via SSH, you can create a new Nodevisor instance with remote connection options.

```ts
import $ from 'nodevisor';

// Connect to the server as the 'runner' user
const $con = $.connect({
  host: 'your-server-address',
  username: 'runner',
});

// Run a command on the server
const result = await $con`echo "Hello, World!"`;
console.log(result); // "Hello, World!"

const username = await $con`whoami`;
console.log(username); // runner
```

_Explanation:_ This code shows how to connect to a remote server using SSH and execute commands. The $.connect() function is used to establish a connection to the server, and the returned $con function allows you to run commands remotely.

### Escape variables

Nodevisor automatically escapes variables to prevent shell injection attacks. You can safely use variables in your commands without worrying about special characters:

```ts
import $ from 'nodevisor';

const name = 'my-directory';
await $`mkdir ${name}`;
```

_Explanation:_ In this example, the ${name} variable is safely included in the shell command to create a new directory. Nodevisor ensures that any special characters in the variable are properly escaped, preventing potential security issues.

More information about escaping variables can be found [here](https://nodevisor.com/docs/quotes).

### Command Line - Comming Soon

To install Nodevisor, run this command:

```bash
npm install -g nodevisor

nodevisor --host your-server-address --username runner --command "echo 'Hello, World!'"
```

_Explanation:_ This snippet shows how to install Nodevisor globally and run commands directly from the command line. This feature is still under development.

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

_Explanation:_ This YAML configuration defines a list of tasks to be executed on a set of servers. It's a simple and structured way to manage server setups, but this feature is still in development.

## Packages

Nodevisor is trying to simplify non-unified commands across different operating systems. Therefore, we created unified packages for common tasks.

- [OS](./packages/os/README.md) - Manage operating system settings and configurations
- [FS](./packages/fs/README.md) - Perform file system operations such as copying, moving, and deleting files and directories
- [Packages](./packages/packages/README.md) - Install or remove software packages

- [Auth](./packages/auth/README.md) - Set or update user passwords.
- [Users](./packages/users/README.md) - Manage system users (e.g., adding or removing users)
- [Groups](./packages/groups/README.md) - Manage user groups

- [AuthorizedKeys](./packages/authorized-keys/README.md) - Manage SSH authorized keys for users
- [SSH](./packages/ssh/README.md)
- [UFW](./packages/ufw/README.md) - Manage Uncomplicated Firewall (UFW) settings

- [AWS](./packages/aws/README.md) - Interact with AWS services and manage cloud infrastructure
- [Docker](./packages/docker/README.md) - Manage Docker containers and Swarm clusters

### Using packages

Nodevisor provides a straightforward API to interact with various system components. Here is a basic example demonstrating how to use the Packages and AuthorizedKeys packages:

```ts
import $, { AuthorizedKeys, Packages } from 'nodevisor';

// Establish connection to the server as root
const $con = $.connect({
  host: 'server-address',
  username: 'root',
});

// Install 'curl' and 'git' packages as root
const packages = new Packages($con);
await packages.install(['curl', 'git']);

// or using the shorthand
await $con(Packages).install(['curl', 'git']);

// Create a new connection context as the 'runner' user
const $runner = $con.as('runner');

// Add a public SSH key to the 'runner' user's authorized keys
const authorizedKeys = new AuthorizedKeys($runner);
await authorizedKeys.write(process.env.SSH_PUBLIC_KEY);

// or using the shorthand
await $runner(AuthorizedKeys).write(process.env.SSH_PUBLIC_KEY);
```

In the above example, the $ function is used to establish a connection to the server and execute commands in a unified way. The AuthorizedKeys package manages the authorized_keys file, while the Packages package handles package installations.

## Guides

### Initialize remote VPS

```ts
import $, { AuthorizedKeys, Packages, UFW, Users, SSH } from 'nodevisor';

const USER_USERNAME = 'runner';
const SSH_PUBLIC_KEY = 'your-public-key';

const hosts = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

async function initialize(host: string) {
  const $con = $.connect({
    host,
    username: 'root',
  });

  // Update and upgrade all system packages
  await $con(Packages).updateAndUpgrade();

  // Install UFW firewall and configure basic rules
  await $con(UFW).install({
    allow: [services.ssh, services.web, services.webSecure],
    enable: true,
  });

  // Assign local public key to the server
  await $con(AuthorizedKeys).write(SSH_PUBLIC_KEY);

  // Create a new user named 'runner'
  await $con(Users).add(USER_USERNAME);

  // Switch to the 'runner' user context
  const $runner = $con.as(USER_USERNAME);

  // Allow the 'runner' user to log in with a public key
  await $runner(AuthorizedKeys).write(SSH_PUBLIC_KEY);

  // Disable password authentication for SSH
  await $con(SSH).disablePasswordAuthentication();
}

// Initialize all specified hosts concurrently
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
