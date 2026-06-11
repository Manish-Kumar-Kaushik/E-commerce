import { useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { policyContent } from '../utils/storeContent'

const PolicyPage = () => {
  const { type } = useParams()
  const policy = policyContent[type] || policyContent.shipping

  return (
    <div className="container-shell py-12">
      <Seo title={policy.title} description={policy.intro} />
      <div className="mx-auto max-w-4xl rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Policies</p>
        <h1 className="font-serif-display mt-2 text-5xl text-stone-950">{policy.title}</h1>
        <p className="mt-6 text-sm leading-8 text-stone-600">{policy.intro}</p>
        <div className="mt-8 space-y-3">
          {policy.bullets.map((bullet) => (
            <div key={bullet} className="rounded-[1.5rem] bg-stone-50 px-5 py-4 text-sm leading-7 text-stone-700">
              {bullet}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PolicyPage
