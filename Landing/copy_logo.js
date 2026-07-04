import fs from 'fs';

const src = "c:\\Users\\Soumya ranjan\\GIET\\admin\\public\\logo.png";
const dest = "c:\\Users\\Soumya ranjan\\GIET\\Landing\\public\\giet_logo.png";

try {
    fs.copyFileSync(src, dest);
    console.log('Logo copied successfully');
} catch (err) {
    console.error('Error copying logo:', err);
}
