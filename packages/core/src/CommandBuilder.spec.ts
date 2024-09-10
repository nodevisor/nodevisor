import CommandBuilder from './CommandBuilder';
import ShellConnection from './connections/ShellConnection';

describe('CommandBuilder', () => {
  it('should create a ShellConnection if no username is provided', async () => {
    const connection = new ShellConnection();

    class ExtendedCommandBuilder<Type = string> extends CommandBuilder<Type> {
      omg() {
        return this as ExtendedCommandBuilder<boolean>;
      }
    }
  
    const commandBuilder = new ExtendedCommandBuilder(connection);

    expect(commandBuilder).toBeInstanceOf(ExtendedCommandBuilder);
  });
});