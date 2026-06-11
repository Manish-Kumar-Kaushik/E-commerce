import Accordion from '../components/Accordion'
import Seo from '../components/Seo'
import { faqItems } from '../utils/storeContent'

const FaqsPage = () => (
  <div className="container-shell py-12">
    <Seo title="FAQs" description="Find quick answers on delivery, returns, payment, and promotions." />
    <div className="mx-auto max-w-4xl rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-500">FAQs</p>
      <h1 className="font-serif-display mt-2 text-5xl text-stone-950">Frequently Asked Questions</h1>
      <div className="mt-8">
        <Accordion items={faqItems} />
      </div>
    </div>
  </div>
)

export default FaqsPage
