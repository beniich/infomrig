import { NextResponse } from 'next/server';
const demo = [{ id: 'p1', title: 'T-shirt', price: 29 }, { id: 'p2', title: 'Mug', price: 12 }];
export async function GET(){ return NextResponse.json({ ok:true, data: demo }) }
export async function POST(req: Request){
  const body = await req.text();
  console.log('Create product', body);
  return NextResponse.json({ ok:true });
}
