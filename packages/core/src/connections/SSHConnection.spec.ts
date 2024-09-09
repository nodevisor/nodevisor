import fs from 'node:fs/promises';
import os from 'node:os';
import Server from '../utils/Server';

import SSHConnection from './SSHConnection';
import { createTempFile } from '../utils/tests';


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
      host: 'localhost',
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
    expect(result).toBe('Hello, world!');
  });

  it('should throw an error for an invalid command', async () => {
    await expect(connection.exec('invalidCommand')).rejects.toThrow();

    expect(connection.isConnected()).toBe(true);

    await expect(await connection.exec('printf "Hello, world!"')).toBe('Hello, world!');
  });

  it('should be able to execute a command after an invalid command', async () => {
    await expect(connection.exec('invalidCommand')).rejects.toThrow();

    expect(connection.isConnected()).toBe(true);

    await expect(await connection.exec('printf "Hello, world!"')).toBe('Hello, world!');
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
  
    const stats = await fs.stat(tempFilePath);
    expect((stats.mode & 0o777)).toBe(0o600); // Verify custom file permissions
  
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
    const localFile =await createTempFile();
  
    const testContent = 'Test content';
    await fs.writeFile(localFile, testContent);
  
    await connection.put(localFile, tempFilePath);
  
    const writtenContent = await fs.readFile(tempFilePath, 'utf-8');
    expect(writtenContent).toBe(testContent);
  
    await fs.unlink(tempFilePath);
    await fs.unlink(localFile);
  });
});