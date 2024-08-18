import { Card } from "react-bootstrap"

export default function TitleValueCard({ title, value, noPadding }){
  return(
    <Card className = {` summary-card ${!noPadding && 'p-2'}` }>
      <Card.Body className="py-3 py-md-4 rounded-1 text-center">
        <Card.Title className=" mb-4"> {title} </Card.Title>
        <Card.Text className='mb-1'> {value} </Card.Text>
      </Card.Body>
    </Card>
  )
}