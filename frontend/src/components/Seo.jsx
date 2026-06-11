import { useEffect } from 'react'

const DEFAULT_DESCRIPTION =
  'Ribelle is a premium fashion storefront for luxury Indian womenswear, editorial silhouettes, and modern occasion dressing.'

const Seo = ({ description, title }) => {
  useEffect(() => {
    const previousTitle = document.title
    const previousDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute('content')

    document.title = title ? `${title} | Ribelle` : 'Ribelle'

    let metaDescription = document.querySelector('meta[name="description"]')

    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }

    metaDescription.setAttribute('content', description || DEFAULT_DESCRIPTION)

    return () => {
      document.title = previousTitle || 'Ribelle'

      if (metaDescription) {
        metaDescription.setAttribute('content', previousDescription || DEFAULT_DESCRIPTION)
      }
    }
  }, [description, title])

  return null
}

export default Seo
