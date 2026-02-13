const fs = require('fs');
const locales = ['ha','yo','ig','pcm','fr','sw','am','ar','pt','zu','es','de','zh'];
let allValid = true;
locales.forEach(l => {
  try {
    const data = JSON.parse(fs.readFileSync('src/i18n/locales/' + l + '/common.json', 'utf8'));
    const keys = Object.keys(data.booking || {});
    if (keys.length === 33) {
      console.log(l + ': OK (33 keys)');
    } else {
      console.log(l + ': WRONG KEY COUNT - ' + keys.length);
      allValid = false;
    }
  } catch(e) {
    console.log(l + ': INVALID JSON - ' + e.message);
    allValid = false;
  }
});
if (allValid) {
  console.log('\nAll 13 files are valid JSON with 33 booking keys each.');
}
