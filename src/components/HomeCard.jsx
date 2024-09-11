        import { Card } from "react-bootstrap"
        import { Link } from "react-router-dom"
        
        export default function HomeCard({main, left, right, href, bg}){

          return(
          <Card className = "px-0 shadow">
            <Card.Body className = "p-0">
              <div className = "card-header text-center">
                <p className = "card-title mb-3 mt-auto" >
                  {main.title}
                </p>
                <p className = "display-6 text-gold fw-bold  mb-auto" >
                  { main.value}
                </p>
              </div>
              <div className = "card-content bg-body-tertiary text-center d-flex justify-content-between">
                <div className = "w-50 py-1 my-2">
                  <p className="text-muted mb-2" > {left.title} </p>
                  <p className = "display-6h my-0 fw-bold"> {left.value} </p>
                </div>
                <div className = "vr"></div>
                <div className = "w-50 py-1 mt-1" > 
                  <p className="text-muted mb-2"  > {right.title} </p>
                  <p className = "my-0 fw-bold"> {right.value} </p>
                </div>
              </div>
            <Link className ="stretched-link" to = {href}>
      
            </Link>
            
            </Card.Body>
          </Card>
          )
        }
       