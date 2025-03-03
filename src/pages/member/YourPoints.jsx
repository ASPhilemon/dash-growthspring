import { useState, useEffect, Fragment} from "react";
import {Tabs, Tab, Toast, ListGroup, Row, Col, Dropdown, Button, Modal, Form, Spinner} from "react-bootstrap";
import Table from "../../components/Table";
import TitleValueCard from "../../components/TitleValueCard";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";
import { useSubmitForm } from "../../hooks/useSubmitForm";


export default function Points(){

  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)
  let [activeKey, setActiveKey] = useState('1-points')
  let [classBeforeAnimation, setClassBeforeAnimation] = useState('p-left')
  let [sharePointsDialog, setSharePointsDialog] = useState(null)
  const {setMemberDashboard, memberDashboard} = useMemberDashboard()

  const RESOURCE_SERVER =  process.env.REACT_APP_RESOURCE_SERVER_URL

  const url = RESOURCE_SERVER + "/transfer-points"

  const {handleSubmit, error, data, isLoading } = useSubmitForm({url, beforeSubmit, onSuccess})

  function beforeSubmit(){
    setSharePointsDialog(null)
  }

  function onSuccess(data, form){
    const newPoints =  memberDashboard.summary.points.points - form.points
    memberDashboard.summary.points.points = newPoints
    memberDashboard.summary.pointsEarned.points = newPoints

    setMemberDashboard(memberDashboard)
  }
  

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <main className=  { `page poition-relative d-flex flex-column  flex-grow-1 px-2 ${hasTransitionedIn && 'animate-page'}` }>
      <Button
        className="btn-share-points"
        onClick={()=>setSharePointsDialog("form")}
        disabled = { isLoading }
      >
        Share 
        {isLoading && <Spinner className="ms-1" size="sm" /> }
      </Button>
      {error && <ErrorToast/> }
      {data && <SuccessToast/> }
      <SharePointsModal
        sharePointsDialog = {sharePointsDialog}
        setSharePointsDialog = {setSharePointsDialog}
        handleSubmit = {handleSubmit}
      />
      <Tabs
      defaultActiveKey = "1-points"
      className = "mb-1 tabs-links-container px-2 py-1"
      variant = "pills"
      transition = {true}
      onSelect = {(key) => {
        if (activeKey < key) setClassBeforeAnimation('p-right')
        else setClassBeforeAnimation('p-left')
        setActiveKey(key)
      }}
      >
        <Tab eventKey = "1-points"
          title = "Points Spent"
          className = { classBeforeAnimation }  >
          <PointsSpent isactive = {activeKey === '1-points'} />
        </Tab>
        <Tab eventKey = "2-points"
          title = "Points Earned"
          className = { classBeforeAnimation }  >
          <PointsEarned isactive = {activeKey === '2-points'} />
        </Tab>
      </Tabs>
      
    </main>
  
  )
}

/*
====================================================
Points Spent
====================================================
*/

function PointsSpent({isactive}){
  useLogger('Points', isactive)
  const isDesktop = useIsDesktop()
  
  const { memberDashboard } = useMemberDashboard()
  const summary = memberDashboard.summary.points
  let  points = memberDashboard.points
  points = points.map((point)=>{
    point.values = point.values.map((value)=>{
      value[1] = value[1].toLocaleString()
      return value
    })
    return point
  })


  let currentYear = points[0].year
  let [displayYear, setDisplayYear] = useState(currentYear)

  return(
    isDesktop ? <PointsDesktop {... {summary, points, displayYear, setDisplayYear}} /> : <PointsMobile {... {summary, points, displayYear, setDisplayYear}} />
  )
  
}

//Points Spent Desktop
function PointsDesktop({summary, points, displayYear, setDisplayYear}){

  let yearPoints = points.filter((points) => points.year == displayYear)[0]
  let baseClass = "d-flex justify-content-between "

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <Row className="gx-0 column-gap-2">
      <Col className="col-4 d-flex flex-column">
        <TitleValueCard
          title = {"Your Points"}
          value = {`${summary.points.toLocaleString()}`}
        />
        <ListGroup variant = "flush" className = 'mt-2'> 
          {
            points.map((yearPoints) =>
              <ListGroup.Item
                action
                className = { yearPoints.year == displayYear ? baseClass + 'display-item' : baseClass }
                onClick = {()=> setDisplayYear(yearPoints.year) }
                key={yearPoints.year}
              >
                <span> { yearPoints.year } </span>
                <span> {yearPoints.total.toLocaleString()  } points </span>
              </ListGroup.Item> )
          }
        </ListGroup>
      </Col>
      <Col className = "bg-white px-2">
        <YearPointDetailDesktop key = {displayYear} { ...{ yearPoints, isMounted}} />
      </Col>
    </Row>
  )
}

//Year Point Spent Detail Desktop
function YearPointDetailDesktop({yearPoints, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {` year-detail fade ${(hasTransitionedIn || !isMounted )&& 'show'}` } >
      <header className = "d-flex px-1 fw-bold border-bottom py-2">
        <span className="me-5"> { yearPoints.year } </span>
        <span> UGX { yearPoints.total.toLocaleString() } </span>
      </header>
      <Table head = { ['Date', 'Points', 'Reason'] } body = {yearPoints.values} />
    </div>
  )
}

//Points Spent Mobile
function PointsMobile({summary, points, displayYear, setDisplayYear}){
  let yearPoints = points.filter((points) => points.year == displayYear)[0]

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <div className="d-flex flex-column flex-grow-1">
      <TitleValueCard
          title = {"Your Points"}
          value = {`${summary.points.toLocaleString()}`}
      />
      <div className="bg-white pt-2 px-2 my-1 flex-grow-1">
        <p className = "mb-3 px-1">Select year to show points spent</p>

        <Dropdown
          as = 'div'
          className = "mb-2"
          size = 'lg'
          onSelect = {(eventKey) => setDisplayYear(eventKey)}
        >
          <Dropdown.Toggle variant = "primary" className = 'd-flex w-100 align-items-center border-bottom  fw-bold'>
            <div className="d-flex justify-content-between px-2 py-2 w-100">
              <span> { displayYear } </span>
              <span> {yearPoints.total.toLocaleString()} points </span>
            </div>
          </Dropdown.Toggle>
          <hr />
          <Dropdown.Menu className="w-100 px-1 px-md-2 pt-0 pb-2 shadow bg-body-tertiary">
            {
              points.map((yearPoints)=>{
                return (
                  <Fragment key = {yearPoints.year} >
                    <Dropdown.Item eventKey = { yearPoints.year }>
                      <div className = "d-flex justify-content-between px-2 py-2 w-100">
                        <span> {yearPoints.year} </span>
                        <span> {yearPoints.total.toLocaleString()} </span>
                      </div>
                    </Dropdown.Item>
                    <hr className="my-0 py-0" />
                  </Fragment>
                )
              })
            }
            
          </Dropdown.Menu>
        </Dropdown>
        <div className = "bg-white px-2">
          <YearPointDetailMobile key = { yearPoints.year } { ... { yearPoints, isMounted} } />
        </div>
      </div>
      
    </div>
  )
}

//Year Point Spent Detail Mobile
function YearPointDetailMobile({yearPoints, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {`year-detail fade ${( hasTransitionedIn || !isMounted) && 'show'}` } >
      <Table head = { ['Date', 'Points', 'Reason'] } body = { yearPoints.values} />
    </div>
  )
}


/*
====================================================
Points Earned
====================================================
*/

function PointsEarned({isactive}){
  useLogger('Points-Earned', isactive)
  const isDesktop = useIsDesktop()
  
  const { memberDashboard } = useMemberDashboard()
  const summary = memberDashboard.summary.pointsEarned
  let  points = memberDashboard.pointsEarned
  points = points.map((point)=>{
    point.values = point.values.map((value)=>{
      value[1] = value[1].toLocaleString()
      return value
    })
    return point
  })


  let currentYear = points[0].year
  let [displayYear, setDisplayYear] = useState(currentYear)

  return(
    isDesktop ? <PointsEarnedDesktop {... {summary, points, displayYear, setDisplayYear}} /> : <PointsEarnedMobile {... {summary, points, displayYear, setDisplayYear}} />
  )
  
}

//Points Earned Desktop
function PointsEarnedDesktop({summary, points, displayYear, setDisplayYear}){

  let yearPoints = points.filter((points) => points.year == displayYear)[0]
  let baseClass = "d-flex justify-content-between "

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <Row className="gx-0 column-gap-2">
      <Col className="col-4 d-flex flex-column">
        <TitleValueCard
          title = {"Your Points"}
          value = {`${summary.points.toLocaleString()}`}
        />
        <ListGroup variant = "flush" className = 'mt-2'> 
          {
            points.map((yearPoints) =>
              <ListGroup.Item
                action
                className = { yearPoints.year == displayYear ? baseClass + 'display-item' : baseClass }
                onClick = {()=> setDisplayYear(yearPoints.year) }
                key={yearPoints.year}
              >
                <span> { yearPoints.year } </span>
                <span> {yearPoints.total.toLocaleString()  } points </span>
              </ListGroup.Item> )
          }
        </ListGroup>
      </Col>
      <Col className = "bg-white px-2">
        <YearPointEarnedDetailDesktop key = {displayYear} { ...{ yearPoints, isMounted}} />
      </Col>
    </Row>
  )
}

//Year Point Earned Detail Desktop
function YearPointEarnedDetailDesktop({yearPoints, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {` year-detail fade ${(hasTransitionedIn || !isMounted )&& 'show'}` } >
      <header className = "d-flex px-1 fw-bold border-bottom py-2">
        <span className="me-5"> { yearPoints.year } </span>
        <span> UGX { yearPoints.total.toLocaleString() } </span>
      </header>
      <Table head = { ['Date', 'Points', 'Reason'] } body = {yearPoints.values} />
    </div>
  )
}

//Points Earned Mobile
function PointsEarnedMobile({summary, points, displayYear, setDisplayYear}){
  let yearPoints = points.filter((points) => points.year == displayYear)[0]

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <div className="d-flex flex-column flex-grow-1">
      <TitleValueCard
          title = {"Your Points"}
          value = {`${summary.points.toLocaleString()}`}
      />
      <div className="bg-white pt-2 px-2 my-1 flex-grow-1">
        <p className = "mb-3 px-1">Select year to show points spent</p>

        <Dropdown
          as = 'div'
          className = "mb-2"
          size = 'lg'
          onSelect = {(eventKey) => setDisplayYear(eventKey)}
        >
          <Dropdown.Toggle variant = "primary" className = 'd-flex w-100 align-items-center border-bottom  fw-bold'>
            <div className="d-flex justify-content-between px-2 py-2 w-100">
              <span> { displayYear } </span>
              <span> {yearPoints.total.toLocaleString()} points </span>
            </div>
          </Dropdown.Toggle>
          <hr />
          <Dropdown.Menu className="w-100 px-1 px-md-2 pt-0 pb-2 shadow bg-body-tertiary">
            {
              points.map((yearPoints)=>{
                return (
                  <Fragment key = {yearPoints.year} >
                    <Dropdown.Item eventKey = { yearPoints.year }>
                      <div className = "d-flex justify-content-between px-2 py-2 w-100">
                        <span> {yearPoints.year} </span>
                        <span> {yearPoints.total.toLocaleString()} </span>
                      </div>
                    </Dropdown.Item>
                    <hr className="my-0 py-0" />
                  </Fragment>
                )
              })
            }
            
          </Dropdown.Menu>
        </Dropdown>
        <div className = "bg-white px-2">
          <YearPointEarnedDetailMobile key = { yearPoints.year } { ... { yearPoints, isMounted} } />
        </div>
      </div>
      
    </div>
  )
}

//Year Point Earned Detail Mobile
function YearPointEarnedDetailMobile({yearPoints, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {`year-detail fade ${( hasTransitionedIn || !isMounted) && 'show'}` } >
      <Table head = { ['Date', 'Points', 'Reason'] } body = { yearPoints.values} />
    </div>
  )
}


/*
====================================================
Share Points
====================================================
*/

function SharePointsModal({sharePointsDialog, handleSubmit, setSharePointsDialog}){
  const show = sharePointsDialog == "form"

  return(
  <Modal backdrop="static" show={show} fullscreen={"sm-down"} onHide={() => setSharePointsDialog(null)}>
    <Modal.Header closeButton>
      <Modal.Title>Share points</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <SharePointsForm  handleSubmit={handleSubmit}/>
    </Modal.Body>
  </Modal>
  )
}

function SharePointsForm({handleSubmit }){
  const {memberDashboard} = useMemberDashboard()
  const beneficiaries = memberDashboard.members
  const [reason, setReason] = useState("")




  return(
    <Form onSubmit = {handleSubmit} className="px-2" method="POST" >
      <fieldset className="share-points-form" >
        <Form.Group className="mb-3" controlId="beneficiary">
          <Form.Label>Beneficiary</Form.Label>
          <Form.Select name="beneficiary" required style={{width: "100%"}} className="">
            <option disabled ></option>
              {
                beneficiaries.map(
                  (beneficiary)=> <option key={beneficiary} value = {beneficiary} > { beneficiary } </option>
                )
              }
        </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3" controlId="number-of-points">
          <Form.Label>Number of points</Form.Label>
          <Form.Control name = "points" required min={1} type="number" />
        </Form.Group>
        <Form.Group  className="mb-3" controlId="reason">
          <Form.Label>Reason</Form.Label>
          <Form.Select onChange={(e)=>setReason(e.target.value)} name = "reason" value={reason} required style={{width: "100%"}} className="">
            <option value = {"Secondary Loan Compesation"} > { "Secondary Loan Compesation" } </option>
            <option value = {"Secondary Loan Interest"} > { "Secondary Loan Interest" } </option>
            <option disabled = {reason=="custom"} value="custom" > { "Enter Your Own" } </option>        
        </Form.Select>
        </Form.Group>
        {
          reason == "custom" &&
          <Form.Group className="mb-3" controlId="custom-reason">
            <Form.Label>Custom reason</Form.Label>
            <Form.Control name="reason" require type="text" />
          </Form.Group>
        }

      </fieldset>

      <div className="d-flex my-4" >
        <Button className="ms-auto px-3" type="submit" > Share </Button>
      </div>
    </Form>
  )

}

function ErrorToast(){
  const [show, setShow] = useState(true)
  return(
    <div className="d-flex justify-content-center px-2" >
      <Toast className="status-toast bg-danger col-md-8" onClose={() => setShow(false)} show={show} delay={3000} autohide>
        <Toast.Body>Failed to share points</Toast.Body>
      </Toast>
    </div>

  )
}

function SuccessToast(){
  const [show, setShow] = useState(true)
  return(
    <div className="d-flex justify-content-center px-2" >
      <Toast className="status-toast bg-success col-md-8" onClose={() => setShow(false)} show={show} delay={3000} autohide>
        <Toast.Body>Points shared successfully</Toast.Body>
      </Toast>
    </div>

  )
}
