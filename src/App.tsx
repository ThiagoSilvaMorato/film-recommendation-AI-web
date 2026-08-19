import { Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout } from './components/common/Layout'
import { CatalogPage } from './pages/CatalogPage'
import { ProfilePage } from './pages/ProfilePage'
import { TrainingPage } from './pages/TrainingPage'
import { RecommendationsPage } from './pages/RecommendationsPage'

function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </Layout>
    </AppProvider>
  )
}

export default App
