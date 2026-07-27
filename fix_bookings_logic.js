const fs = require('fs');

function fixFilteringLogic(filepath, isExperiencePage) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Replace fetchBookings filter
    const fetchPattern = /let filtered = data\.filter\(\(b: any\) => b\.room_id [^)]+\);/g;
    
    // Replace search filter
    const searchPattern = /filtered = filtered\.filter\(\(b: any\) => b\.room_id [^)]+\);/g;

    let filterLogic = '';
    if (isExperiencePage) {
        filterLogic = `let filtered = data.filter((b: any) => {
          if (b.special_requests) {
            try {
              const meta = JSON.parse(b.special_requests);
              if (meta?.isExperience) return true;
            } catch(e) {}
          }
          return false;
        });`;
    } else {
        filterLogic = `let filtered = data.filter((b: any) => {
          if (b.special_requests) {
            try {
              const meta = JSON.parse(b.special_requests);
              if (meta?.isExperience || meta?.isCar) return false;
            } catch(e) {}
          }
          return true;
        });`;
    }

    // For fetchBookings (where the variable is declared)
    content = content.replace(fetchPattern, filterLogic);

    // For search (where the variable is already declared, we just reassign)
    let searchFilterLogic = filterLogic.replace('let filtered = data.filter', 'filtered = filtered.filter');
    content = content.replace(searchPattern, searchFilterLogic);

    fs.writeFileSync(filepath, content, 'utf8');
}

fixFilteringLogic('project/src/app/bookings/page.tsx', false);
fixFilteringLogic('project/src/app/booked-experiences/page.tsx', true);
