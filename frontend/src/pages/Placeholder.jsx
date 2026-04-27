import Layout from '../components/Layout'

const Placeholder = ({ title }) => {
  return (
    <Layout>
      <div className="page-header">
        <h1>{title}</h1>
        <p>This module is currently under development.</p>
      </div>
      <div className="empty-state">
        <div className="empty-icon">🚧</div>
        <h3>Coming Soon</h3>
        <p>We are working hard to bring you the {title} feature.</p>
      </div>
    </Layout>
  )
}

export default Placeholder
