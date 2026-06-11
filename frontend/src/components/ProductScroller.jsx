import ProductCard from './ProductCard'
import ProductSkeleton from './ProductSkeleton'
import SectionHeading from './SectionHeading'

const ProductScroller = ({ eyebrow, products = [], subtitle, title, viewAllLink, loading }) => (
  <section className="section-shell">
    <SectionHeading eyebrow={eyebrow} subtitle={subtitle} title={title} viewAllLink={viewAllLink} />
    <div className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:gap-5">
      {loading
        ? Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)
        : products.map((product) => (
            <div key={product._id} className="w-[78vw] max-w-[18rem] shrink-0 snap-start sm:w-[16rem] lg:w-[18rem]">
              <ProductCard product={product} />
            </div>
          ))}
    </div>
  </section>
)

export default ProductScroller
