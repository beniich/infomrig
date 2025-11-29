import Link from 'next/link';
export default function Navbar(){ return (
  <nav className="bg-white shadow p-4 flex justify-between">
    <div className="font-bold">Stitch</div>
    <div className="space-x-4">
      <Link href="/">Home</Link>
      <Link href="/shop">Shop</Link>
      <Link href="/vendor">Vendor</Link>
    </div>
  </nav>
)}
