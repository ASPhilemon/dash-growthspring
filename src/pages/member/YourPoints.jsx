import { useState, useEffect} from "react";
import {Tabs, Tab, ListGroup, Row, Col, Dropdown } from "react-bootstrap";
import Table from "../../components/Table";
import TitleValueCard from "../../components/TitleValueCard";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";


export default function Points(){

  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)
  let [activeKey, setActiveKey] = useState('1-points')
  let [classBeforeAnimation, setClassBeforeAnimation] = useState('p-left')

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <main className=  { `page d-flex flex-column  flex-grow-1 px-2 ${hasTransitionedIn && 'animate-page'}` }>
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
          <PointsTab isactive = {activeKey === '1-points'} />
        </Tab>
      </Tabs>
    </main>
  
    
  )
}

/*
====================================================
Points Tab
====================================================
*/

function PointsTab({isactive}){
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

//Points Desktop
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

//Year Point Detail Desktop
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

//Points Mobile
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
                  <>
                    <Dropdown.Item eventKey = { yearPoints.year }>
                      <div className = "d-flex justify-content-between px-2 py-2 w-100">
                        <span> {yearPoints.year} </span>
                        <span> {yearPoints.total.toLocaleString()} </span>
                      </div>
                    </Dropdown.Item>
                    <hr className="my-0 py-0" />
                  </>
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

//Year Point Detail Mobile
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