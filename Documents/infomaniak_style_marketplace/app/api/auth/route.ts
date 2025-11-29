import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET||'secret';
export async function POST(req: Request){
  const { email } = await req.json();
  const token = jwt.sign({ email }, SECRET, { expiresIn: '7d' });
  return NextResponse.json({ ok:true, token });
}
