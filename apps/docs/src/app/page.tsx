import Link from 'next/link';
import { highlight } from 'sugar-high';

function Code({ code }: { code: string }) {
  return (
    <pre className="landing-code">
      <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
    </pre>
  );
}

const heroCode = `import $, { Packages, Users, UFW, Docker, endpoints } from 'nodevisor';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });

await $server(Packages).install(['curl', 'git']);
await $server(Users).add('runner');
await $server(UFW).allow([endpoints.ssh, endpoints.web]);
await $server(Docker).install();`;

const features = [
  {
    title: 'Agentless remote execution',
    description:
      'SSH into any server with nothing to install. Run commands locally or remotely with the same API. Variables are auto-escaped to prevent injection.',
    code: `const $server = $.connect({ host: '10.0.0.10', username: 'root' });

// Safe — variables are automatically escaped
const name = 'my-dir; rm -rf /';
await $server\`mkdir \${name}\`;

// Parse output as text, JSON, lines, or boolean
const hostname = await $server\`hostname\`.text();
const config = await $server\`cat config.json\`.json();`,
  },
  {
    title: 'Cross-platform typed modules',
    description:
      'One API for Linux, macOS, and Windows. Auto-detects apt, yum, brew, or winget. Full type safety and autocomplete in your editor.',
    code: `// Auto-detects apt, yum, brew, or winget
await $server(Packages).install(['nginx', 'curl']);

// Create users, set passwords, manage SSH keys
await $server(Users).add('deploy');
await $server(AuthorizedKeys).write(publicKey);

// Firewall with predefined endpoints
await $server(UFW).allow([endpoints.ssh, endpoints.web]);`,
  },
  {
    title: 'Docker cluster deployment',
    description:
      'Define your entire production stack in TypeScript. Build, push, and deploy to Docker Swarm with one command.',
    code: `const cluster = new DockerCluster({
  name: 'production',
  nodes: [new DockerNode({ host: '10.0.0.1' })],
});

cluster.addDependency(new Traefik({ ssl: { email: 'ops@co.com' } }));
cluster.addDependency(new Postgres({ password: process.env.DB_PASS! }));
cluster.addDependency(new NodeWeb({ appDir: './app', port: 3000 }));

await cluster.deploy();`,
  },
];

const comparisonYaml = `# ansible/playbook.yml
---
- hosts: webservers
  become: yes
  tasks:
    - name: Install packages
      apt:
        name: "{{ item }}"
        state: present
      loop:
        - curl
        - git
        - docker.io
    - name: Create deploy user
      user:
        name: runner
        shell: /bin/bash
    - name: Configure UFW
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - "22"
        - "80"
        - "443"
    - name: Enable UFW
      ufw:
        state: enabled`;

const comparisonTs = `// .nodevisor/setup.ts
import $, { Packages, Users, UFW, Docker, endpoints } from 'nodevisor';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });

await $server(Packages).install(['curl', 'git']);
await $server(Users).add('runner');
await $server(UFW).allow([endpoints.ssh, endpoints.web, endpoints.webSecure]);
await $server(UFW).start();
await $server(Docker).install();`;

export default function HomePage() {
  return (
    <main className="landing-shell">
      <div className="landing-grid" />

      {/* Hero */}
      <section className="landing-hero">
        <p className="landing-kicker">Nodevisor</p>
        <h1>Automate any server with TypeScript.</h1>
        <p className="landing-description">
          Deploy Docker clusters, manage packages, configure firewalls —
          agentless over SSH with nothing to install. Cross-platform across
          Linux, macOS, and Windows.
        </p>

        <Code code={heroCode} />

        <div className="landing-actions">
          <Link
            href="/docs/getting-started"
            className="landing-btn landing-btn-primary"
          >
            Get Started
          </Link>
          <Link
            href="/docs/packages"
            className="landing-btn landing-btn-secondary"
          >
            API Reference
          </Link>
        </div>

        <div className="landing-install">
          <code>npm install nodevisor</code>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        {features.map((feature) => (
          <div key={feature.title} className="landing-feature">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
            <Code code={feature.code} />
          </div>
        ))}
      </section>

      {/* Comparison */}
      <section className="landing-comparison">
        <h2>Why not YAML?</h2>
        <p className="landing-comparison-description">
          Ansible needs YAML playbooks, Jinja templates, and inventory files.
          Nodevisor is just TypeScript — use loops, conditionals, async/await,
          and the full npm ecosystem.
        </p>
        <div className="landing-comparison-grid">
          <div className="landing-comparison-panel">
            <span className="landing-comparison-label">Ansible</span>
            <Code code={comparisonYaml} />
          </div>
          <div className="landing-comparison-panel">
            <span className="landing-comparison-label landing-comparison-label-highlight">
              Nodevisor
            </span>
            <Code code={comparisonTs} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="landing-bottom-cta">
        <h2>Ready to automate?</h2>
        <p>One package. Full infrastructure control.</p>
        <div className="landing-actions">
          <Link
            href="/docs/getting-started"
            className="landing-btn landing-btn-primary"
          >
            Get Started
          </Link>
          <Link
            href="/docs/examples"
            className="landing-btn landing-btn-secondary"
          >
            See Examples
          </Link>
        </div>
      </section>
    </main>
  );
}
