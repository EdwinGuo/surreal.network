import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { authorize, handleUploadRequest } from './metadata/upload';
const app = express();
const port = 8080; // default port to listen

const upload = multer();
app.use(
  cors({
    origin: '*',
    allowedHeaders: '*',
    credentials: true
  })
);

app.use(express.json());

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    await authorize(req.headers.authorization ?? '');
    const uploadResponse = await handleUploadRequest(req, res);
    res.status(201).send(uploadResponse);
  } catch (error) {
    res.status(500).send({
      message: error.message
    });
  }
});

app.get('/', async (req, res) => {
  res.status(200).send();
});

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});
