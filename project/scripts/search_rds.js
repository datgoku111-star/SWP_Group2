const fs = require('fs');

try {
  const content = fs.readFileSync('D:/Pho/Pho/docs/RDS.md', 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('book_room_secure') || line.includes('book_room')) {
      console.log(`${idx + 1}: ${line}`);
      // Print a block of 30 lines after the match
      for (let i = 0; i < 40; i++) {
        if (lines[idx + i]) {
          console.log(`+${i}: ${lines[idx + i]}`);
        }
      }
      console.log("-------------------");
    }
  });
} catch (e) {
  console.error("Error reading file:", e);
}
