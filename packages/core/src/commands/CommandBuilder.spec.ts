import { platform } from 'os';
import CommandBuilder from './CommandBuilder';
import ShellConnection from '../connections/ShellConnection';

describe('CommandBuilder', () => {
  it('should create a ShellConnection if no username is provided', async () => {
    const connection = new ShellConnection();

    class ExtendedCommandBuilder extends CommandBuilder {
      omg() {
        return this as ExtendedCommandBuilder;
      }
    }

    const commandBuilder = new ExtendedCommandBuilder(connection);

    expect(commandBuilder).toBeInstanceOf(ExtendedCommandBuilder);
  });

  it('should detect same platform', async () => {
    const connection = new ShellConnection();

    const commandBuilder = new CommandBuilder(connection);

    const detectedPlatform = await commandBuilder.platform();

    expect(detectedPlatform).toBe(platform());
  });

  it('should generate correct arguments', async () => {
    const connection = new ShellConnection();
    const commandBuilder = new CommandBuilder(connection).setShellQuote();

    // Test boolean values
    commandBuilder.argument('--flag1', true);
    commandBuilder.argument('--flag2', false);
    expect(commandBuilder.toString()).toBe('--flag1=true --flag2=false');

    // Test null value (flag only)
    commandBuilder.clear();
    commandBuilder.argument('--flag', null);
    expect(commandBuilder.toString()).toBe('--flag');

    // Test number value
    commandBuilder.clear();
    commandBuilder.argument('--count', 42);
    expect(commandBuilder.toString()).toBe('--count=42');

    // Test string value
    commandBuilder.clear();
    commandBuilder.argument('--name', 'test');
    expect(commandBuilder.toString()).toBe('--name=test');

    // Test short flag with space separator
    commandBuilder.clear();
    commandBuilder.argument('-n', 'test');
    expect(commandBuilder.toString()).toBe('-n test');

    // Test custom separator
    commandBuilder.clear();
    commandBuilder.argument('--name', 'test', ':');
    expect(commandBuilder.toString()).toBe('--name:test');

    // Test array values
    commandBuilder.clear();
    commandBuilder.argument('--item', ['a', 'b', 'c']);
    expect(commandBuilder.toString()).toBe('--item=a --item=b --item=c');

    // Test object values with subseparator
    commandBuilder.clear();
    commandBuilder.argument('-o', { size: 'A4', copies: '2' });
    expect(commandBuilder.toString()).toBe('-o size=A4 -o copies=2');

    // Test object with custom subseparator
    commandBuilder.clear();
    commandBuilder.argument('-o', { size: 'A4', copies: '2' }, true, ':');
    expect(commandBuilder.toString()).toBe('-o size:A4 -o copies:2');

    // Test record of arguments
    commandBuilder.clear();
    commandBuilder.argument({
      '--name': 'test',
      '--count': 42,
      '--flag': true,
    });
    expect(commandBuilder.toString()).toBe('--name=test --count=42 --flag=true');

    // Test undefined values (should be skipped)
    commandBuilder.clear();
    commandBuilder.argument('--skip', undefined);
    expect(commandBuilder.toString()).toBe('');

    // Test object with undefined values
    commandBuilder.clear();
    commandBuilder.argument('-o', { size: 'A4', skip: undefined });
    expect(commandBuilder.toString()).toBe('-o size=A4');

    // Test object with all undefined values (should be skipped)
    commandBuilder.clear();
    commandBuilder.argument('-o', { skip1: undefined, skip2: undefined });
    expect(commandBuilder.toString()).toBe('');
  });
});
