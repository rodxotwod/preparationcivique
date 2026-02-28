const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/questions.json', 'utf8'));

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Better slugify for French
function frenchSlugify(text) {
    const a = 'àáâäæãåāăąçćčđďèéêëėęîïíīįìłñńôöòóœøōõßśšûüùúūÿžźż';
    const b = 'aaaaaaaaaacccddeeeeeeeiiiiiiilnnoooooooosssuuuuuyzzz';
    const p = new RegExp(a.split('').join('|'), 'g');

    return text.toString().toLowerCase()
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[\s\W-]+/g, '-') // Replace spaces, non-word characters and dashes with a single dash (-)
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
}

data.forEach(category => {
  category.questions.forEach(q => {
    q.slug = frenchSlugify(q.q);
    
    // Add generic but useful details
    q.details = `La question "${q.q}" est une notion fondamentale pour réussir l'examen civique. En effet, ${q.a.charAt(0).toLowerCase() + q.a.slice(1)} Comprendre ce point permet de mieux cerner les attentes de la République française vis-à-vis de ses citoyens. Il est recommandé de bien mémoriser cette information, car elle illustre parfaitement le thème : ${category.category}.`;
  });
});

fs.writeFileSync('src/data/questions.json', JSON.stringify(data, null, 2));
console.log("Data enriched with slugs and details.");
