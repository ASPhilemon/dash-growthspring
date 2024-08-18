import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useMemberDashboard } from './contexts/MemberDashboardContext';


//Components
import { ScrollToTop } from './components/ScrollToTop';
import { NavBar } from './components/NavBar';
import { SideBar } from './components/SideBar';



//Member pages
import Home from './pages/member/Home';
import DepositsPayments from './pages/member/DepositsPayments';
import YourPoints from './pages/member/YourPoints';
import YourLoans from './pages/member/YourLoans';
import YourCredits from './pages/member/YourCredits';
import Club from './pages/member/Club';
import LoadingMemberDashboard from './pages/member/LoadingMemberDashboard';


function App() {
  const { memberDashboard } = useMemberDashboard()

  const [showSideBar, setShowSideBar] = useState(false);
  const handleClose = () => setShowSideBar(false);
  const handleShow = () => setShowSideBar(true);

  return (
    <BrowserRouter>
      <ScrollToTop/>
      <Container fluid className = 'px-0'>
        <Row className = "gx-0">
          { memberDashboard && <SideBar
            showSideBar = {showSideBar}
            handleClose = {handleClose}
          /> }
          <Col className='d-flex whole-page flex-column' md = {memberDashboard &&{offset:4}} lg = {memberDashboard && {offset:3}} >
            {memberDashboard && <NavBar handleShow = {handleShow}/>}
            <div className = 'page-container  flex-grow-1 d-flex flex-column'>
              <Routes >

                {/* Member Dashboard Routes */}
                <Route
                  path = "/"
                  element = { memberDashboard ? <Home /> : <Navigate to = '/load-member-dashboard' /> } 
                />
                <Route
                  path="/deposits-payments"
                  element = { memberDashboard ? <DepositsPayments /> : <Navigate to = '/load-member-dashboard' /> }  
                />
                <Route
                  path = "/your-points"
                  element = { memberDashboard ? <YourPoints /> : <Navigate to = '/load-member-dashboard' /> }  
                />
                <Route
                  path = "/your-loans"
                  element =  {memberDashboard ? <YourLoans /> : <Navigate to = '/load-member-dashboard' />}  
                />
                <Route
                  path = "/your-credits"
                  element =  { memberDashboard ? <YourCredits /> : <Navigate to = '/load-member-dashboard' /> }  
                />
                
                <Route
                  path = "/club"
                  element = { memberDashboard ? <Club /> : <Navigate to = '/load-member-dashboard' /> } 
                />
                <Route
                  path = "/load-member-dashboard"
                  element = { memberDashboard ? <Navigate to = '/' /> : <LoadingMemberDashboard/> } 
                />
                
                {/*Not Found*/}
                <Route
                  path = "*"
                  element = { <Navigate to = '/' /> } 
                />
              </Routes>
            </div>
          </Col>
        </Row>
      </Container>
    </BrowserRouter>
    
  );
}

export default App;
