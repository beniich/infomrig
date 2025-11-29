'use client';
import { useState } from 'react';
export default function VendorForm(){
  const [name,setName]=useState('');
  async function submit(){ await fetch('/api/vendors',{method:'POST', body: JSON.stringify({name})}); alert('ok') }
  return <div><input value={name} onChange={e=>setName(e.target.value)} /><button onClick={submit}>Save</button></div>
}
