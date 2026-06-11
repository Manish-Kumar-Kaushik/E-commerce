import { useState } from 'react'

const Accordion = ({ items }) => {
  const [openItem, setOpenItem] = useState(items[0]?.title || '')

  return (
    <div className="surface-panel overflow-hidden rounded-[1.8rem]">
      {items.map((item) => {
        const isOpen = openItem === item.title

        return (
          <div key={item.title} className="border-b border-stone-200/70 px-5 py-4 last:border-b-0">
            <button
              type="button"
              onClick={() => setOpenItem(isOpen ? '' : item.title)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="font-medium text-stone-900">{item.title}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500">
                {isOpen ? '-' : '+'}
              </span>
            </button>
            {isOpen ? <p className="mt-3 text-sm leading-7 text-stone-600">{item.content}</p> : null}
          </div>
        )
      })}
    </div>
  )
}

export default Accordion
