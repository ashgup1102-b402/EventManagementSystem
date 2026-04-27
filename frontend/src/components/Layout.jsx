import Sidebar from './Sidebar'
import './Layout.css'

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <main className="page-content fade-in">
        {children}
      </main>
    </div>
  </div>
)

export default Layout
