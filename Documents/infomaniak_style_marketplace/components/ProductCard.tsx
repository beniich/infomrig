export default function ProductCard({product}:{product:any}){
  return (
    <div className="border rounded p-3">
      <h3 className="font-semibold">{product.title}</h3>
      <p className="text-sm">{product.price} CHF</p>
    </div>
  )
}
