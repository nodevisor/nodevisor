import Module from '../Module';

export default function isModule(input: any): input is Module {
  return input instanceof Module;
}
