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
});
