import { NextResponse } from 'next/server';
export async function POST(req: Request){ const b=await req.json(); console.log('Order',b); return NextResponse.json({ok:true}) }
