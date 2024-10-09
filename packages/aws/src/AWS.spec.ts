import AWS from './AWS';

const itIfSafe = process.env.SAFE === 'true' ? it : xit;

describe('AWS Module', () => {
  let aws: AWS;

  beforeAll(() => {
    aws = new AWS();
  });

  itIfSafe('should return false when AWS CLI is not installed', async () => {
    // You might need to simulate AWS CLI uninstallation for this test
    const isInstalled = await aws.isInstalled();
    expect(isInstalled).toBe(false);
  });

  // skip when env variable is not set
  itIfSafe(
    'should be able to install aws cli',
    async () => {
      await aws.install();

      const isInstalled = await aws.isInstalled();

      expect(isInstalled).toBe(true);
    },
    60 * 1000,
  );

  itIfSafe('should return the correct AWS CLI version', async () => {
    const version = await aws.getVersion();
    expect(version).toMatch(/aws-cli/); // Check that version includes 'aws-cli'
  });

  /*
  itIfSafe('should update AWS CLI if installed', async () => {
    if (await aws.isInstalled()) {
      await aws.update();

      const isInstalled = await aws.isInstalled();
      expect(isInstalled).toBe(true);
    }
  });
  */

  itIfSafe('should set and get AWS CLI configuration values', async () => {
    await aws.set('test.key', 'testValue');
    const value = await aws.get('test.key');

    expect(value).toBe('testValue');
  });

  itIfSafe('should set default AWS region', async () => {
    const region = 'us-east-1';
    await aws.setDefaultRegion(region);

    const storedRegion = await aws.get('default.region');
    expect(storedRegion.trim()).toBe(region);
  });

  itIfSafe('should set AWS credentials', async () => {
    const accessKeyId = 'testAccessKeyId';
    const secretAccessKey = 'testSecretAccessKey';

    await aws.setCredentials(accessKeyId, secretAccessKey);

    const storedAccessKeyId = await aws.get('aws_access_key_id');
    const storedSecretAccessKey = await aws.get('aws_secret_access_key');

    expect(storedAccessKeyId.trim()).toBe(accessKeyId);
    expect(storedSecretAccessKey.trim()).toBe(secretAccessKey);
  });
});
