const express = require('express');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

try {
  const program = new Command();

  program
    .requiredOption('-h, --host <host>', 'server host')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <cacheDir>', 'cache directory')
    .parse(process.argv);

  const options = program.opts();

  console.log('Parsed options:', options);

  const cachePath = path.resolve(options.cache);
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
    console.log(`Cache directory created at ${cachePath}`);
  }

  const app = express();

  app.get('/', (req, res) => {
    res.send('Server is running with provided parameters!');
  });

  app.listen(options.port, options.host, () => {
    console.log(`✅ Server is running at http://${options.host}:${options.port}`);
  });
} catch (err) {
  console.error('❌ Error occurred:', err.message);
  process.exit(1);
}
