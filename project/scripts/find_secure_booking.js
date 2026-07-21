const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(walk(fullPath));
      }
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = walk('D:/Pho/Pho/project');

for (const file of allFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('book_room_secure')) {
      console.log(`Found in: ${file}`);
    }
  } catch (e) {}
}
console.log("Search completed.");
