export class Raw extends String {}

export default function raw(value: string) {
  return new Raw(value);
}
