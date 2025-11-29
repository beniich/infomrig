'use client';
import { useEffect, useState } from 'react';
export default function Shop() {
  const [products, setProducts] = useState([]);
  useEffect(()=>{ fetch('/api/products').then(r=>r.json()).then(d=>setProducts(d.data||[])) },[]);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Shop</h1>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {products.map(p=> (
          <div key={p.id} className="border p-4 rounded">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm">{p.price} CHF</p>
          </div>
        ))}
      </div>
    </div>
  );
}
