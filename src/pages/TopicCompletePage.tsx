import { useParams } from 'react-router'

function TopicCompletePage() {
  const { topicId } = useParams()

  return (
    <>
      <h1>Aihe suoritettu</h1>
      <p>topicId: {topicId}</p>
    </>
  )
}

export default TopicCompletePage
