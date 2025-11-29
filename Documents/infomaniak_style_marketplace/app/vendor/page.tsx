'use client';
import { useState } from 'react';
export default function Vendor() {
  const [title,setTitle]=useState('');
  async function create() {
    await fetch('/api/vendors',{method:'POST', body: JSON.stringify({name: title})});
    alert('Vendor created (demo)');
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl">Vendor Dashboard</h1>
      <input className="border p-2 mt-4" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Vendor name" />
      <button onClick={create} className="ml-2 px-4 py-2 bg-blue-600 text-white rounded">Create</button>
    </div>
  );
}
