import { Navbar, Container, Button} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

export function NavBar({handleShow}){

  return(
    <Navbar className='py-2 mb-1 px-3'>
      <Container fluid className='justify-content-between px-0 py-0'>

        {/* OffCanvas Toggler */}
        <Button variant='none' className='offcanvas-toggler d-inline-block d-md-none me-2 px-0 '>
          <img
            src="/icons/menu.svg"
            width ="30px"
            height = "30px"
            alt="menu icon"
            onClick = { handleShow }
          />
        </Button>
       
        {/* GrowthSping Logo */}
        <LinkContainer to="/" className = ""  >
          <Navbar.Brand href="/" className=' py-0'>
            <img
              src="/img/logo.png"
              width="140px"
              height= "28px"
              className=""
              alt="Growthspring logo"
            />
          </Navbar.Brand>
        </LinkContainer>
      </Container>
    </Navbar>
  )
}