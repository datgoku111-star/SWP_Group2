const fs = require('fs');

function removeCarLogic(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Remove state
    content = content.replace(/const \[carBookings, setCarBookings\] = useState<any\[\]>\(\[\]\);\s*/g, '');
    content = content.replace(/const \[carLoading, setCarLoading\] = useState\(true\);\s*/g, '');

    // Remove fetchCarBookings function (until the next const or function)
    content = content.replace(/const fetchCarBookings = async \(\) => \{[\s\S]*?\};\s*(?=const |useEffect\()/g, '');
    
    // Remove handleReturnVehicle function
    content = content.replace(/const handleReturnVehicle = async \(id: string\) => \{[\s\S]*?\};\s*(?=const |useEffect\()/g, '');

    // Remove fetchCarBookings(); calls
    content = content.replace(/fetchCarBookings\(\);\s*/g, '');

    // Remove Car Rentals Section JSX
    // It starts with {/* Car Rentals Section */}
    // It ends with </div></div></div> (wait no, we want to leave the container closing tags alone)
    content = content.replace(/\{\s*\/\*\s*Car Rentals Section\s*\*\/\s*\}[\s\S]*?<\/div>\s*<\/div>\s*(?=<\/div>\s*\{\s*\/\*\s*CANCEL MODAL)/, '');

    fs.writeFileSync(filepath, content, 'utf8');
}

removeCarLogic('project/src/app/bookings/page.tsx');
removeCarLogic('project/src/app/booked-experiences/page.tsx');
