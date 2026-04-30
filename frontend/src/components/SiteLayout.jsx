import Navbar from './Navbar'
import './SiteLayout.css'

const SiteLayout = ({ children }) => (
  <div className="site-layout">
    <Navbar />
    <main className="site-content fade-in">
      {children}
    </main>
  </div>
)

export default SiteLayout
