import { useParams } from 'react-router'

function StudyPage() {
  const { topicId } = useParams()

  return (
    <>
      <h1>Opiskelu</h1>
      <p>topicId: {topicId}</p>
    </>
  )
}

export default StudyPage
