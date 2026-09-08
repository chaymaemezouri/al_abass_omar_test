const fs = require('fs');
const path = require('path');

async function main() {
  const pdfParse = require('pdf-parse');
  const pdfPath = path.join(__dirname, '..', 'src', 'assets', '2026 الأرضية الانتخابية.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  // Print first 15000 chars
  console.log(data.text.substring(0, 15000));
}

main().catch(console.error);
