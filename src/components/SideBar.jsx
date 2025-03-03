import { Nav, Offcanvas} from 'react-bootstrap';
import { LinkContainer} from 'react-router-bootstrap';
import { useMemberDashboard } from '../contexts/MemberDashboardContext';
import { Link } from 'react-router-dom';

export function SideBar({showSideBar, handleClose}) {
 
  const { memberDashboard } = useMemberDashboard()
  const isAdmin = memberDashboard.user.isAdmin
  const AUTH_SERVER_URL = import.meta.env.VITE_APP_AUTH_SERVER_URL

  return (
    <Offcanvas 
      show = { showSideBar }
      onHide = { handleClose }
      responsive = "md"
      className = "px-0 py-0 col-md-4 col-lg-3 position-fixed shadow"
    >
      <Offcanvas.Body className = "flex-column px-0 py-0">
        <Profile handleClose={handleClose} />
        <PageLinks handleClose = {handleClose} />
        <div>
          <a target="_blank" href="https://discounts.growthspringers.com" className="btn btn-sm ms-3 mt-2 px-2 fw-bold btn-warning ">
            Discounts
            <i className=" ms-2 text-dark fw-bold bi bi-arrow-up-right"></i>
          </a>
        </div>
    
        {isAdmin && 
          <div className="d-flex align-items-center  mt-2  mb-5">
            
            <a className='mt-3 text-primary-bs fw-bold ms-4 me-3 h6' href="https://admin.growthspringers.com">
              Admin Dashboard 
            </a>
            <i className="bi bi-arrow-up-right"></i>
          </div>
        }
      
      
        <div className='d-flex my-4 px-3 fw-bold ms-2'>
          <a href = {`${AUTH_SERVER_URL}/signout`} className = "btn fw-bold text-white bg-dark px-5 py-2"> Sign Out </a>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

function Profile({handleClose}){
  const { memberDashboard } = useMemberDashboard()
  const user = memberDashboard.user
  const names = user.fullName.split(' ')
  const displayName = user.displayName? user.displayName.split(" ")[0]: names[names.length - 1]

  const API = import.meta.env.VITE_APP_RESOURCE_SERVER_URL
  let imgSrc = user.defaultPhoto
  if (user.photoURL){
    imgSrc = user.photoURL.startsWith("data")? user.photoURL: API + '/' + user.photoURL
  }
  
  return(
    
    <section className="profile position-relative d-flex ">
      <div className="d-flex align-items-end col-12 overflow-x-hidden px-3">
      <Link to={"/account"} onClick={handleClose} >
        <img
          src = { imgSrc}
          width='80px'
          height='80px'
          className='rounded-circle me-2'
          alt=""
        />
      </Link>
      <Link onClick={handleClose} className='display-6 px-1 text-gold overflow-x-hidden d-inline-block text-truncate' to={"/account"} >
        <p className='d-inline-block' >{displayName}</p>
      </Link>
      </div>
    </section>
  )
}

function PageLinks({handleClose}){

  let pages = [
    {
      linkText: 'Home',
      linkUrl: '/'
    }, 
    {
      linkText: 'Account',
      linkUrl: '/account'
    }, 
    {
      linkText: 'Deposits & Payments',
      linkUrl: '/deposits-payments'
    },
    {
      linkText: 'Your Points',
      linkUrl: '/your-points'
    },
    {
      linkText: 'Your Loans',
      linkUrl: '/your-loans'
    },
    {
      linkText: 'Your Credits',
      linkUrl: '/your-credits'
    },
    {
      linkText: 'The Club',
      linkUrl: '/club'
    }
  ]
  

  return(
    <Nav className="flex-column mt-4">
      {
        pages.map((page)=>{
          return (
            <LinkContainer key={page.linkUrl} to = {page.linkUrl} activeClassName = "current-page" >
              <Nav.Link onClick = {()=> handleClose()} eventKey = {page.linkUrl} > {page.linkText} </Nav.Link>
            </LinkContainer>
          )
        } )
      }
   
    </Nav>
  )
}