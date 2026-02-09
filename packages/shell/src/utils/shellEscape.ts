export default function shellEscape(parameters: string | string[]) {
  const list = Array.isArray(parameters) ? parameters : [parameters];
  const ret: string[] = [];

  list.forEach((s) => {
    if (/[^A-Za-z0-9_\/:=-]/.test(s)) {
      let updated = `'${s.replace(/'/g, "'\\''")}'`;
      updated = updated
        .replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
        .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped

      ret.push(updated);
      return;
    }
    ret.push(s);
  });

  return ret.join(' ');
}
