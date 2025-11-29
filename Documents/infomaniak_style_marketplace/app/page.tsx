import Link from 'next/link';
export default function Page() {
  return (
    <main className="p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Infomaniak-style Marketplace</h1>
        <nav className="space-x-4">
          <Link href="/shop">Shop</Link>
          <Link href="/vendor">Vendor</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <section className="mt-8">
        <h2 className="text-xl">Featured products</h2>
        <p className="mt-2">A minimal starter marketplace. Add products, create vendors, sell.</p>
      </section>
    </main>
  );
}
