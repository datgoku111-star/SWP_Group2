const fs = require('fs');
let file = 'project/src/components/ReceptionistServiceHub.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
let out = [];
let i = 0;
while (i < lines.length) {
    if (lines[i].startsWith('<<<<<<< HEAD')) {
        let headBlock = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('=======')) {
            headBlock.push(lines[i]);
            i++;
        }
        let remoteBlock = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
            remoteBlock.push(lines[i]);
            i++;
        }
        i++; // skip >>>>>>>

        let headStr = headBlock.join('\n');
        let remoteStr = remoteBlock.join('\n');
        
        // resolve logic based on content
        if (headStr.includes('useState<"ROOMS" | "ORDERS" | "CAR_RENTALS">')) {
            out.push('  const [activeSubTab, setActiveSubTab] = useState<"ROOMS" | "ORDERS" | "CAR_RENTALS" | "EXPERIENCES">("ROOMS");');
        } else if (headStr.includes('fetch("/api/car-bookings")')) {
            out.push('      const [roomsRes, servicesRes, ordersRes, carRes, bookingsRes] = await Promise.all([');
            out.push('        fetch("/api/rooms?all=true"),');
            out.push('        fetch("/api/services?all=true"),');
            out.push('        fetch("/api/orders?status=PENDING,IN_PROGRESS,COMPLETED"),');
            out.push('        fetch("/api/car-bookings"),');
            out.push('        fetch("/api/bookings"),');
        } else if (headStr.includes('setCarRentals(cData)')) {
            out.push('      if (carRes && carRes.ok) {');
            out.push('        const cData = await carRes.json();');
            out.push('        if (Array.isArray(cData)) {');
            out.push('          setCarRentals(cData);');
            out.push('        }');
            out.push('      }');
            out.push('      if (bookingsRes && bookingsRes.ok) {');
            out.push('        const bData = await bookingsRes.json();');
            out.push('        if (Array.isArray(bData)) {');
            out.push('          setBookings(bData);');
            out.push('        }');
            out.push('      }');
        } else if (headStr.includes('setActiveSubTab("CAR_RENTALS")')) {
            out.push('            onClick={() => setActiveSubTab("CAR_RENTALS")}');
            out.push('            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${');
            out.push('              activeSubTab === "CAR_RENTALS"');
            out.push('                ? "bg-white text-primary-700 shadow-lg scale-105"');
            out.push('                : "bg-white/10 text-white hover:bg-white/20"');
            out.push('            }`}');
            out.push('          >');
            out.push('            <Car className="w-4 h-4" />');
            out.push('            Dịch Vụ Thuê Xe ({carRentals.length})');
            out.push('          </button>');
            out.push('          <button');
            out.push('            onClick={() => setActiveSubTab("EXPERIENCES")}');
            out.push('            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${');
            out.push('              activeSubTab === "EXPERIENCES"');
        } else if (headStr.includes('Dịch Vụ Thuê Xe ({carRentals.length})')) {
            out.push('            <Sparkles className="w-4 h-4" />');
            out.push('            Giám Sát Trải Nghiệm');
        } else if (headStr.includes('SUB-TAB 3: CAR RENTALS')) {
            out.push(headStr);
            out.push('');
            out.push(remoteStr);
        } else {
            // default fallback: append both
            out.push(headStr);
            out.push(remoteStr);
        }
    } else {
        out.push(lines[i]);
        i++;
    }
}
fs.writeFileSync(file, out.join('\n'), 'utf8');
