import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Seo from '../components/Seo'

const NotFoundPage = () => (
  <div className="container-shell py-16">
    <Seo title="Not Found" description="The page you are looking for could not be found." />
    <EmptyState
      title="Page not found"
      description="The page you are trying to visit does not exist or may have moved."
      action={
        <Link to="/" className="gold-button">
          Back Home
        </Link>
      }
    />
  </div>
)

export default NotFoundPage
