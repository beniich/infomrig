SELECT
        s.*,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        AVG(CASE WHEN a.status = 'completed' THEN EXTRACT(EPOCH FROM (a.end_time - a.start_time))/3600 END) as avg_appointment_duration
      FROM staff s
      LEFT JOIN appointments a ON s.id = a.staff_id AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE 1=1
    `;
=======
    let query = `
      SELECT
        s.*,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        AVG(CASE WHEN a.status = 'completed' THEN EXTRACT(EPOCH FROM (a.end_time - a.start_time))/3600 END) as avg_appointment_duration
      FROM staff s
      LEFT JOIN appointments a ON s.id = a.staff_id AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE 1=1
    `;
