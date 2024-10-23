import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Server from '../utils/Server';

import SSHConnection from './SSHConnection';
import { createTempFile } from '../utils/tests';
import CommandOutputError from '../errors/CommandOutputError';

describe('SSHConnection', () => {
  let connection: SSHConnection;
  let server: Server;

  beforeEach(async () => {
    server = new Server({
      username: 'test',
      password: 'testpassword',
      hostname: '127.0.0.1',
      port: 2222,
    });

    await server.listen();

    connection = new SSHConnection({
      username: 'test',
      password: 'testpassword',
      host: '127.0.0.1',
      port: 2222,
    });
  });

  afterEach(async () => {
    await connection.close();

    if (server) {
      await server.close();
    }
  });

  it('should not be connected initially', () => {
    expect(connection.isConnected()).toBe(false);
  });

  it('should establish a connection when connect is called', async () => {
    await connection.connect();
    expect(connection.isConnected()).toBe(true);
  });

  it('should execute a simple command and establish a connection', async () => {
    expect(connection.isConnected()).toBe(false);
    const result = await connection.exec('printf "Hello, world!"');
    expect(connection.isConnected()).toBe(true);
    expect(result.text()).toBe('Hello, world!');
  });

  it('should throw an error for an invalid command', async () => {
    try {
      await connection.exec('invalidCommand');
    } catch (error) {
      expect(error).toBeInstanceOf(CommandOutputError);
    }

    expect(connection.isConnected()).toBe(true);

    await expect((await connection.exec('printf "Hello, world!"')).text()).toBe('Hello, world!');
  });

  it('should be able to execute a command after an invalid command', async () => {
    try {
      await connection.exec('invalidCommand');
    } catch (error) {
      expect(error).toBeInstanceOf(CommandOutputError);
    }
    //await expect(await connection.exec('invalidCommand')).rejects.toThrow();

    expect(connection.isConnected()).toBe(true);

    await expect((await connection.exec('printf "Hello, world!"')).text()).toBe('Hello, world!');
  });

  it('should handle file transfer with putContent correctly', async () => {
    const tempFilePath = await createTempFile();

    const testContent = 'Test content';

    await connection.putContent(testContent, tempFilePath);

    const writtenContent = await fs.readFile(tempFilePath, 'utf-8');
    expect(writtenContent).toBe(testContent);

    await fs.unlink(tempFilePath);
  });

  it('should handle file transfer with putContent and custom options (mode)', async () => {
    const tempFilePath = await createTempFile();
    const testContent = 'Test content';
    const customOptions = { mode: 0o600 };

    await connection.putContent(testContent, tempFilePath, customOptions);

    if (os.platform() !== 'win32') {
      const stats = await fs.stat(tempFilePath);
      expect(stats.mode & 0o777).toBe(0o600); // Verify custom file permissions
    }

    await fs.unlink(tempFilePath);
  });

  it('should retrieve file content with getContent correctly', async () => {
    const tempFilePath = await createTempFile();

    const testContent = 'Test content';
    await fs.writeFile(tempFilePath, testContent);

    const retrievedContent = await connection.getContent(tempFilePath);
    expect(retrievedContent.toString()).toBe(testContent);

    await fs.unlink(tempFilePath);
  });

  it('should throw an error when attempting to get content from a non-existent file', async () => {
    const nonExistentFile = '/non/existent/path.txt';
    await expect(connection.getContent(nonExistentFile)).rejects.toThrow();
  });

  it('should handle file transfer using put correctly', async () => {
    const tempFilePath = await createTempFile();
    const localFile = await createTempFile();

    const testContent = 'Test content';
    await fs.writeFile(localFile, testContent);

    await connection.put(localFile, tempFilePath);

    const writtenContent = await fs.readFile(tempFilePath, 'utf-8');
    expect(writtenContent).toBe(testContent);

    await fs.unlink(tempFilePath);
    await fs.unlink(localFile);
  });

  it('should be able to use stdin', async () => {
    const { stdout, stderr, code } = await connection.exec('cat < /dev/stdin', {
      stdin: 'hello',
    });

    expect(stdout).toBe('hello');
    expect(stderr).toBe('');
    expect(code).toBe(0);
  });

  it('should be able to use stdin', async () => {
    const { stdout, stderr, code } = await connection.exec(
      `node ${path.resolve(__dirname, '../utils/readInput.mjs')}`,
      {
        stdin: ' hello  1  ',
      },
    );

    expect(stdout).toBe(' hello  1  ');
    expect(stderr).toBe('');
    expect(code).toBe(0);
  });

  it('should be able to use stdin without trimming', async () => {
    const script = path.resolve(__dirname, '../utils/readInput.mjs');

    const { stdout } = await connection.exec(`node ${script}`, {
      stdin: ' hello  1  ',
    });

    expect(stdout).toBe(' hello  1  ');

    const { stdout: stdout2 } = await connection.exec(`node ${script}`, {
      stdin: '\n hello  1  ',
    });

    expect(stdout2).toBe('\n hello  1  ');

    const { stdout: stdout3 } = await connection.exec(`node ${script}`, {
      stdin: ' hello  1  \n ',
    });

    expect(stdout3).toBe(' hello  1  \n ');

    const { stdout: stdout4 } = await connection.exec(`node ${script}`, {
      stdin: '\n hello  1  \n \n\n',
    });

    expect(stdout4).toBe('\n hello  1  \n \n\n');
  });
});
