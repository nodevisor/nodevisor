import $, {
  AuthorizedKeys,
  AWS,
  Packages,
  UFW,
  Auth,
  endpoints,
  Docker,
  DockerSwarm,
  Users,
  SSH,
} from 'nodevisor';
import { z } from 'zod';

export const schema = z.object({
  host: z
    .string()
    .min(1, 'Host is required')
    .default(process.env.HOST ?? ''),
  root: z
    .object({
      username: z.string().min(1, 'Root username is required'),
      password: z.string().min(1, 'Root password is required'),
      publicKey: z.string().min(1, 'Root public key is required'),
      privateKeyPath: z.string().optional(),
      passphrase: z.string().optional(),
    })
    .default({
      username: process.env.ROOT_USERNAME ?? 'root',
      password: process.env.ROOT_PASSWORD ?? '',
      publicKey: process.env.ROOT_PUBLIC_KEY ?? '',

      privateKeyPath: process.env.ROOT_PRIVATE_KEY_PATH,
      passphrase: process.env.ROOT_PASSPHRASE,
    }),
  app: z
    .object({
      username: z.string().min(1, 'App username is required'),
      password: z.string().min(1, 'App password is required'),
    })
    .default({
      username: process.env.APP_USERNAME ?? 'runner',
      password: process.env.APP_PASSWORD ?? '',
    }),
  aws: z
    .object({
      accessKeyId: z.string().min(1, 'AWS accessKeyId is required'),
      secretAccessKey: z.string().min(1, 'AWS secretAccessKey is required'),
      defaultRegion: z.string().min(1, 'AWS defaultRegion is required'),
    })
    .default({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      defaultRegion: process.env.AWS_DEFAULT_REGION ?? 'eu-central-1',
    }),
});

export default async (config: z.infer<typeof schema>) => {
  const { host, root, app, aws } = schema.parse(config);

  const $con = $.connect({
    host,
    username: root.username,
    password: root.password,

    privateKeyPath: root.privateKeyPath,
    passphrase: root.passphrase,
  });

  // get list of new packages
  await $con(Packages).update();

  // assign public key to the root user
  await $con(AuthorizedKeys).write(root.publicKey);

  // disable password authentication
  await $con(SSH).disablePasswordAuthentication();

  // install firewall and allow only ssh, http and https
  await $con(UFW).install();
  await $con(UFW).allow([endpoints.ssh, endpoints.web, endpoints.webSecure]);
  await $con(UFW).start();

  // create user for the app
  await $con(Users).add(app.username);
  await $con(Auth).setPassword(app.username, app.password);

  // assign public key to the app user
  const $user = $con.as(app.username);
  await $user(AuthorizedKeys).write(root.publicKey);

  // install docker
  await $con(DockerSwarm).install();

  // allow app user to run docker commands without sudo
  await $con(Docker).allowUser(app.username);

  // start swarm
  await $con(DockerSwarm).start();

  // install AWS Cli
  await $con(AWS).install();
  await $con(AWS).setCredentials(aws.accessKeyId, aws.secretAccessKey);
  await $con(AWS).setDefaultRegion(aws.defaultRegion);

  // const ECR = '180538458182.dkr.ecr.eu-central-1.amazonaws.com';

  const password = await $con(AWS).getECRLoginPassword();
  const endpoint = await $con(AWS).getECRDockerRegistryEndpoint('180538458182');

  // await $con`aws ecr get-login-password --region ${aws.defaultRegion} | docker login --username AWS --password-stdin ${endpoint}`;

  await $con(Docker).login({
    username: 'AWS',
    server: endpoint,
    password,
  });

  // pull latest image
  await $con(Docker).pull(`${endpoint}/creolingo-api:latest`);
};

/*
const homeDirectory = os.homedir();

const {
  HOST,

  ROOT_PASSWORD,
  ROOT_USERNAME = 'root',
  ROOT_PASSPHRASE = '',
  ROOT_PRIVATE_KEY = `${homeDirectory}/.ssh/id_rsa`,
  ROOT_PUBLIC_KEY = `${homeDirectory}/.ssh/id_rsa.pub`,

  USER_USERNAME = 'runner',
  USER_PASSWORD,

  DOCKER_COMPOSE_PATH,
  COMPOSE_DOT_ENV,
} = process.env;

async function prepare() {
  if (!HOST) {
    throw new Error('Host is required');
  }

  if (!ROOT_USERNAME) {
    throw new Error('Username is required');
  }

  if (!ROOT_PASSWORD && !ROOT_PRIVATE_KEY) {
    throw new Error('Password or private key is required');
  }

  if (!USER_PASSWORD) {
    throw new Error('User password is required');
  }

  const connection = new Connection({
    host: HOST,
    username: ROOT_USERNAME,
    password: ROOT_PASSWORD,
    privateKeyPath: ROOT_PRIVATE_KEY,
    passphrase: ROOT_PASSPHRASE,
  });

  try {
    // update all packages
    await packages.updateAndUpgrade(connection); // *

    // install firewall
    await ufw.install(connection, {
      allow: [services.ssh, services.web, services.webSecure],
      enable: true,
    });

    // assign local public key to the server
    await authorizedKeys.write(connection, ROOT_PUBLIC_KEY); // *

    // create user
    await user.add(connection, USER_USERNAME); // *
    await auth.setPassword(connection, USER_USERNAME, USER_PASSWORD); // * // do not need it, because we will use ssh keys

    const userConnection = connection.as(USER_USERNAME); // *
    await authorizedKeys.write(userConnection, ROOT_PUBLIC_KEY); // *

    // disable login with password
    await ssh.disablePasswordAuthentication(connection);

    // install all necessary packages
    // await htop.install(connection);

    // install aws cli
    await aws.install(connection); // *

    await docker.install(connection); // *
    await docker.swarmInit(connection); // *

    // allow user to run docker commands
    await docker.allowUser(connection, USER_USERNAME); // *

    // without restart runner has no access to docker
    await packages.restart(connection, 'docker');

    // restart vps -- without it docker is not working

    // wait for connection to be established

    // copy docker-compose.yml to the server
    const home = await env.home(userConnection); // *

    if (DOCKER_COMPOSE_PATH) {
      await sftp.put(userConnection, DOCKER_COMPOSE_PATH, `${home}/docker-compose.yml`);
    } else {
      log('No docker-compose.yml path provided');
    }

    if (COMPOSE_DOT_ENV) {
      await sftp.putContent(userConnection, COMPOSE_DOT_ENV, `${home}/.env`);

      // load env file
      await env.load(userConnection, `${home}/.env`);

      const awsAccessKeyId = await env.get(userConnection, 'AWS_ACCESS_KEY_ID');
      const awsSecretAccessKey = await env.get(userConnection, 'AWS_SECRET_ACCESS_KEY');
      const awsDefaultRegion = await env.get(userConnection, 'AWS_DEFAULT_REGION');

      if (awsAccessKeyId && awsSecretAccessKey) {
        await aws.setCredentials(userConnection, awsAccessKeyId, awsSecretAccessKey);
      }

      if (awsDefaultRegion) {
        await aws.setDefaultRegion(userConnection, awsDefaultRegion);

        // login ECR to be able to pull images
        const ECR = '180538458182.dkr.ecr.eu-central-1.amazonaws.com';
        //  await userConnection.$`aws ecr get-login-password --region ${awsDefaultRegion} | docker login --username AWS --password-stdin ${ECR}`;

        // pull latest image
        await userConnection(docker).pull(`${ECR}/creolingo-api:latest`); // *

        // remove service
        // await userConnection.$`docker stack rm creolingo`;
        // start service
        await userConnection.$`docker stack deploy -c ./docker-compose.yml creolingo`;
      }
    }
  } catch (error) {
    console.error('Failed to connect or execute command:', error);
  } finally {
    connection.disconnect();
  }
}

*/
