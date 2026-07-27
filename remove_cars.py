import re

def remove_car_logic(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove state
    content = re.sub(r'const \[carBookings, setCarBookings\] = useState<any\[\]>\(\[\]\);\s*', '', content)
    content = re.sub(r'const \[carLoading, setCarLoading\] = useState\(true\);\s*', '', content)

    # Remove fetchCarBookings function (until the next const or function)
    content = re.sub(r'const fetchCarBookings = async \(\) => \{.*?\};\s*(?=const )', '', content, flags=re.DOTALL)
    
    # Remove handleReturnVehicle function
    content = re.sub(r'const handleReturnVehicle = async \(id: string\) => \{.*?\};\s*(?=const |useEffect\()', '', content, flags=re.DOTALL)

    # Remove fetchCarBookings(); calls
    content = re.sub(r'fetchCarBookings\(\);\s*', '', content)

    # Remove Car Rentals Section JSX
    # We replace from {/* Car Rentals Section */} to the end of its div.
    # It ends with:
    # 582:       </div>
    # 583:       </div>
    # 584: 
    # 585:       {/* CANCEL MODAL */}
    # So we replace up to 582:       </div> and keep 583:       </div>
    content = re.sub(r'\{\s*/\*\s*Car Rentals Section\s*\*/\s*\}.*?</div>\s*</div>\s*(?=</div>\s*\{\s*/\*\s*CANCEL MODAL)', '', content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

remove_car_logic('project/src/app/bookings/page.tsx')
remove_car_logic('project/src/app/booked-experiences/page.tsx')
