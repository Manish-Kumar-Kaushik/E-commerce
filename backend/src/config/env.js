import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

dotenv.config({
  path: path.resolve(currentDirectory, '../../.env'),
});
