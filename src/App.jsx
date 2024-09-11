import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useMemberDashboard } from './contexts/MemberDashboardContext';


//Components
import { ScrollToTop } from './components/ScrollToTop';
import { NavBar } from './components/NavBar';
import { SideBar } from './components/SideBar';
import { LoadingDashboard } from './components/LoadingDasboard';


//Pages
import Home from './pages/member/Home';
import DepositsPayments from './pages/member/DepositsPayments';
import YourPoints from './pages/member/YourPoints';
import YourLoans from './pages/member/YourLoans';
import YourCredits from './pages/member/YourCredits';
import Club from './pages/member/Club';
import { Profile } from './pages/member/Profile';

function App() {
  const { memberDashboard } = useMemberDashboard()

  const [showSideBar, setShowSideBar] = useState(false);
  const handleClose = () => setShowSideBar(false);
  const handleShow = () => setShowSideBar(true);

  return (
    memberDashboard ?
    <BrowserRouter>
      <ScrollToTop/>
      <Container fluid className = 'px-0'>
        <Row className = "gx-0">
          { <SideBar
            showSideBar = {showSideBar}
            handleClose = {handleClose}
          /> }
          <Col className='d-flex whole-page flex-column' md = {{offset:4}} lg = { {offset:3}} >
            { <NavBar handleShow = {handleShow}/>}
            <div className = 'page-container  flex-grow-1 d-flex flex-column'>
              <Routes >
                <Route
                  path = "/"
                  element = { <Home />  } 
                />
                <Route
                  path="/deposits-payments"
                  element = { <DepositsPayments /> }  
                />
                <Route
                  path = "/your-points"
                  element = { <YourPoints /> }  
                />
                <Route
                  path = "/your-loans"
                  element =  {<YourLoans /> }  
                />
                <Route
                  path = "/your-credits"
                  element =  { <YourCredits /> }  
                />
                <Route
                  path = "/profile"
                  // element = { <Navigate to = '/' /> } 
                  element = {<Profile/>}
                />
                <Route
                  path = "/club"
                  element = { <Club /> } 
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
    </BrowserRouter> :
    <LoadingDashboard/>
  );
}

export default App;
