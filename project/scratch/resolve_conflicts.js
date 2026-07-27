const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}', { cwd: 'c:/FER202_2026/Code/Hotel_Project/SWP_Group2/project', absolute: true });

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<<<<<<< HEAD')) {
    console.log('Resolving conflicts in: ' + file);
    // Replace conflict markers with the incoming changes
    // The regex matches <<<<<<< HEAD ... ======= ... >>>>>>> branch
    const regex = /<<<<<<< HEAD[\s\S]*?=======\n([\s\S]*?)>>>>>>> [a-f0-9]+\n/g;
    content = content.replace(regex, '');
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log('Done resolving conflicts.');
