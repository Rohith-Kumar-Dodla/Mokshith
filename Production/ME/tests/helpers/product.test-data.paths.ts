import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TEST_DATA_DIR = path.resolve(__dirname, '../test-data/products');

export const VALID_PNG_PATH = path.join(TEST_DATA_DIR, 'valid-sample.png');
export const INVALID_FILE_PATH = path.join(TEST_DATA_DIR, 'invalid-sample.txt');
