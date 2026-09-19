import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProgressPage from './pages/ProgressPage'
import StudyPage from './pages/StudyPage'
import TopicCompletePage from './pages/TopicCompletePage'
import TopicsPage from './pages/TopicsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/aiheet" element={<TopicsPage />} />
        <Route path="/aiheet/:topicId/opiskelu" element={<StudyPage />} />
        <Route path="/aiheet/:topicId/valmis" element={<TopicCompletePage />} />
        <Route path="/edistyminen" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
