import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, 'bn1.jpg');
const dest = path.join(__dirname, 'src', 'assets', 'images', 'bn1.jpg');

if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('File copied successfully to src/assets/images/bn1.jpg');
} else {
    console.log('Source file bn1.jpg not found in root');
}
