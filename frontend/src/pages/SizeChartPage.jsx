import Seo from '../components/Seo'
import { sizeChartRows } from '../utils/storeContent'

const SizeChartPage = () => (
  <div className="container-shell py-12">
    <Seo title="Size Chart" description="Review the Ribelle size chart from XS to XXL." />
    <div className="rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Size Guide</p>
      <h1 className="font-serif-display mt-2 text-5xl text-stone-950">Size Chart</h1>
      <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-stone-200">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-stone-100">
            <tr>
              <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-stone-500">Size</th>
              <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-stone-500">Bust</th>
              <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-stone-500">Waist</th>
              <th className="px-5 py-4 text-xs uppercase tracking-[0.25em] text-stone-500">Hips</th>
            </tr>
          </thead>
          <tbody>
            {sizeChartRows.map((row) => (
              <tr key={row.size} className="border-t border-stone-200">
                <td className="px-5 py-4 text-sm font-medium text-stone-900">{row.size}</td>
                <td className="px-5 py-4 text-sm text-stone-600">{row.bust}</td>
                <td className="px-5 py-4 text-sm text-stone-600">{row.waist}</td>
                <td className="px-5 py-4 text-sm text-stone-600">{row.hips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

export default SizeChartPage
