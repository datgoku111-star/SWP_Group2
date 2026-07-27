const fs = require('fs');

let filepath = 'project/src/app/api/incidents/route.ts';
let content = fs.readFileSync(filepath, 'utf8');

const replacement = `    const data = validatedData.data;
    const incidentCode = generateIncidentCode();
    const currentUserId = user.sub;
    
    // Auto-lookup active booking if booking_id is missing but room_id is provided
    let finalBookingId = data.booking_id;
    let finalCustomerId = data.customer_id;
    
    if (!finalBookingId && data.room_id) {
      const { data: latestBooking } = await supabase
        .from('bookings')
        .select('id, user_id')
        .eq('room_id', data.room_id)
        .in('status', ['CHECKED_IN', 'CHECKED_OUT'])
        .order('check_in_date', { ascending: false })
        .limit(1)
        .single();
        
      if (latestBooking) {
        finalBookingId = latestBooking.id;
        if (!finalCustomerId) {
          finalCustomerId = latestBooking.user_id;
        }
      }
    }
    
    // 2. Insert vào bảng room_incidents
    const { data: newIncident, error: incidentError } = await supabase
      .from('room_incidents')
      .insert({
        incident_code: incidentCode,
        booking_id: finalBookingId,
        room_id: data.room_id,
        customer_id: finalCustomerId,`;

const target = `    const data = validatedData.data;
    const incidentCode = generateIncidentCode();
    const currentUserId = user.sub;
    
    // 2. Insert vào bảng room_incidents
    const { data: newIncident, error: incidentError } = await supabase
      .from('room_incidents')
      .insert({
        incident_code: incidentCode,
        booking_id: data.booking_id,
        room_id: data.room_id,
        customer_id: data.customer_id,`;

content = content.replace(target, replacement);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Updated /api/incidents/route.ts');
