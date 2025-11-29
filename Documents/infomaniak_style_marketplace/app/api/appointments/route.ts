import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { Appointment, ApiResponse } from '../../../lib/models';

// GET /api/appointments - Get all appointments with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const staffId = searchParams.get('staffId');
    const clientId = searchParams.get('clientId');
    const date = searchParams.get('date');

    let query = `
      SELECT
        a.*,
        c.firstname as client_firstname,
        c.lastname as client_lastname,
        c.email as client_email,
        c.phone as client_phone,
        s.firstname as staff_firstname,
        s.lastname as staff_lastname,
        s.email as staff_email,
        serv.name as service_name,
        serv.duration as service_duration,
        serv.price as service_price
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN services serv ON a.service_id = serv.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (staffId) {
      query += ` AND a.staff_id = $${paramIndex}`;
      params.push(staffId);
      paramIndex++;
    }

    if (clientId) {
      query += ` AND a.client_id = $${paramIndex}`;
      params.push(clientId);
      paramIndex++;
    }

    if (date) {
      query += ` AND DATE(a.date) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    query += ` ORDER BY a.date DESC, a.start_time DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM appointments a WHERE 1=1`;
    const countParams: any[] = [];

    if (status) countQuery += ` AND a.status = $${countParams.length + 1}`; countParams.push(status);
    if (staffId) countQuery += ` AND a.staff_id = $${countParams.length + 1}`; countParams.push(staffId);
    if (clientId) countQuery += ` AND a.client_id = $${countParams.length + 1}`; countParams.push(clientId);
    if (date) countQuery += ` AND DATE(a.date) = $${countParams.length + 1}`; countParams.push(date);

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const appointments = result.rows.map(row => ({
      id: row.id,
      clientId: row.client_id,
      staffId: row.staff_id,
      serviceId: row.service_id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      client: {
        id: row.client_id,
        firstName: row.client_firstname,
        lastName: row.client_lastname,
        email: row.client_email,
        phone: row.client_phone
      },
      staff: {
        id: row.staff_id,
        firstName: row.staff_firstname,
        lastName: row.staff_lastname,
        email: row.staff_email
      },
      service: {
        id: row.service_id,
        name: row.service_name,
        duration: row.service_duration,
        price: row.service_price
      }
    }));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        appointments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des rendez-vous' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, staffId, serviceId, date, startTime, endTime, notes } = body;

    // Validate required fields
    if (!clientId || !staffId || !serviceId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflictQuery = `
      SELECT id FROM appointments
      WHERE staff_id = $1 AND date = $2 AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      ) AND status NOT IN ('cancelled', 'completed')
    `;

    const conflictResult = await pool.query(conflictQuery, [staffId, date, startTime, endTime]);

    if (conflictResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Conflit d\'horaire détecté' },
        { status: 409 }
      );
    }

    // Create appointment
    const insertQuery = `
      INSERT INTO appointments (client_id, staff_id, service_id, date, start_time, end_time, notes, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', NOW(), NOW())
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [clientId, staffId, serviceId, date, startTime, endTime, notes || '']);

    const response: ApiResponse<Appointment> = {
      success: true,
      data: result.rows[0],
      message: 'Rendez-vous créé avec succès'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du rendez-vous' },
      { status: 500 }
    );
  }
}
