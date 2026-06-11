const ProductSkeleton = () => (
  <div className="w-[78vw] max-w-[18rem] shrink-0 snap-start animate-pulse sm:w-[16rem] lg:w-full">
    <div className="surface-panel rounded-[1.75rem] p-3">
      <div className="aspect-[4/5] rounded-[1.35rem] bg-stone-200" />
    </div>
    <div className="surface-panel mt-4 rounded-[1.5rem] px-4 py-4">
      <div className="h-3 w-24 rounded-full bg-stone-200" />
      <div className="mt-4 h-5 w-2/3 rounded-full bg-stone-200" />
      <div className="mt-4 h-4 w-1/3 rounded-full bg-stone-200" />
    </div>
  </div>
)

export default ProductSkeleton
