const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_DIR = path.join(__dirname, 'cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}
app.use(express.static(path.join(__dirname, 'UploadForm.html')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'UploadForm.html'));
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Note Service API',
      version: '1.0.0',
      description: 'API для роботи з нотатками',
    },
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати список усіх нотаток
 *     responses:
 *       200:
 *         description: Список файлів
 */
app.get('/notes', (req, res) => {
  fs.readdir(CACHE_DIR, (err, files) => {
    if (err) return res.status(500).send('Помилка читання каталогу');
    res.json(files);
  });
});

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримати вміст конкретної нотатки
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Назва нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Вміст нотатки
 *       404:
 *         description: Нотатку не знайдено
 */
app.get('/notes/:name', (req, res) => {
  const notePath = path.join(CACHE_DIR, req.params.name);
  if (!fs.existsSync(notePath)) return res.status(404).send('Нотатку не знайдено');
  res.sendFile(notePath);
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Оновити нотатку
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Назва нотатки
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             example: Новий вміст нотатки
 *     responses:
 *       200:
 *         description: Нотатку оновлено
 *       404:
 *         description: Нотатку не знайдено
 */
app.put('/notes/:name', (req, res) => {
  const notePath = path.join(CACHE_DIR, req.params.name);
  if (!fs.existsSync(notePath)) return res.status(404).send('Нотатку не знайдено');
  fs.writeFileSync(notePath, req.body.data || '');
  res.send('Нотатку оновлено');
});

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Видалити нотатку
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Назва нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Нотатку видалено
 *       404:
 *         description: Нотатку не знайдено
 */
app.delete('/notes/:name', (req, res) => {
  const notePath = path.join(CACHE_DIR, req.params.name);
  if (!fs.existsSync(notePath)) return res.status(404).send('Нотатку не знайдено');
  fs.unlinkSync(notePath);
  res.send('Нотатку видалено');
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Завантажити нову нотатку
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Файл завантажено
 */
app.post('/write', upload.single('note'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(CACHE_DIR, req.file.originalname);
  fs.rename(tempPath, targetPath, err => {
    if (err) return res.status(500).send('Помилка збереження файлу');
    res.send('Файл збережено');
  });
});


app.get('/', (req, res) => {
  res.send(`
    <form method="POST" enctype="multipart/form-data" action="/write">
      <input type="file" name="note" />
      <button type="submit">Завантажити</button>
    </form>
  `);
});

app.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
});
