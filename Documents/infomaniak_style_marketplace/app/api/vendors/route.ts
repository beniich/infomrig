import { NextResponse } from 'next/server';
const demo = [{ id: 'v1', name: 'Demo Vendor' }];
export async function GET(){ return NextResponse.json({ ok:true, data: demo }) }
export async function POST(req: Request){
  const body = await req.text();
  console.log('Create vendor', body);
  return NextResponse.json({ ok:true });
}
