import Seo from '../components/Seo'
import { aboutSections } from '../utils/storeContent'

const AboutPage = () => (
  <div className="container-shell py-12">
    <Seo title="About" description="Discover the story behind the Ribelle aesthetic and design point of view." />
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-500">About Us</p>
      <h1 className="font-serif-display mt-2 text-5xl text-stone-950">A premium fashion world built around quiet confidence</h1>
    </div>
    <div className="mt-10 grid gap-8 lg:grid-cols-2">
      {aboutSections.map((section) => (
        <div key={section.title} className="rounded-[2.25rem] border border-stone-200 bg-white p-5">
          <img src={section.image} alt={section.title} className="aspect-[4/5] w-full rounded-[1.75rem] object-cover" />
          <h2 className="font-serif-display mt-6 text-3xl text-stone-950">{section.title}</h2>
          <p className="mt-4 text-sm leading-8 text-stone-600">{section.text}</p>
        </div>
      ))}
    </div>
  </div>
)

export default AboutPage
