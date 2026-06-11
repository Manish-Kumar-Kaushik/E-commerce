import { Link } from 'react-router-dom'

const SectionHeading = ({ eyebrow, subtitle, title, viewAllLink }) => (
  <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-3xl">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="font-serif-display mt-2 text-4xl leading-none text-stone-950 sm:text-[3.35rem]">{title}</h2>
      {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">{subtitle}</p> : null}
    </div>
    {viewAllLink ? (
      <Link className="ghost-button" to={viewAllLink}>
        View All
      </Link>
    ) : null}
  </div>
)

export default SectionHeading
