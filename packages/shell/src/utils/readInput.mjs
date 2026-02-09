process.stdin.setEncoding('utf8');

let input = '';

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  process.stdout.write(input);
});

process.stdin.on('error', (err) => {
  console.error('Error reading input:', err);
});
