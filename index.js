const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Command } = require('commander');

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cacheDir>', 'cache directory')
  .parse(process.argv);

const options = program.opts();
const cacheDir = path.resolve(options.cache);

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const app = express();
app.use(express.text());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// HTML форма
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

// POST /write (multipart form)
app.post('/write', upload.none(), (req, res) => {
  const { note_name, note } = req.body;
  const notePath = path.join(cacheDir, note_name);

  if (fs.existsSync(notePath)) {
    return res.status(400).send('Note already exists');
  }

  fs.writeFileSync(notePath, note, 'utf8');
  res.status(201).send('Note created');
});

// GET /notes/:name
app.get('/notes/:name', (req, res) => {
  const notePath = path.join(cacheDir, req.params.name);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }

  const content = fs.readFileSync(notePath, 'utf8');
  res.send(content);
});

// PUT /notes/:name
app.put('/notes/:name', (req, res) => {
  const notePath = path.join(cacheDir, req.params.name);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }

  fs.writeFileSync(notePath, req.body, 'utf8');
  res.send('Note updated');
});

// DELETE /notes/:name
app.delete('/notes/:name', (req, res) => {
  const notePath = path.join(cacheDir, req.params.name);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }

  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

// GET /notes (list all)
app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cacheDir).map(file => {
    const content = fs.readFileSync(path.join(cacheDir, file), 'utf8');
    return { name: file, text: content };
  });

  res.json(notes);
});

// Start server
app.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});
