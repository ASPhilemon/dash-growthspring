import { useState, useEffect} from "react";
import {Tabs, Tab, ListGroup, Row, Col, Dropdown } from "react-bootstrap";
import Table from "../../components/Table";
import TitleValueCard from "../../components/TitleValueCard";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";




export default function Club(){
 
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)
  let [activeKey, setActiveKey] = useState('1-deposits')
  let [classBeforeAnimation, setClassBeforeAnimation] = useState('p-left')

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <main className=  { `page d-flex flex-column   flex-grow-1 px-2 ${hasTransitionedIn && 'animate-page'}` }>
      <Tabs
      defaultActiveKey = "1-deposits"
      className = "mb-1 tabs-links-container px-2 py-1"
      variant = "pills"
      transition = {true}
      onSelect = {(key) =>{
        if (activeKey < key) setClassBeforeAnimation('p-right')
        else setClassBeforeAnimation('p-left')
        setActiveKey(key)
      }}
      >
        <Tab eventKey = "1-deposits"
          title = "Club Deposits"
          className = { classBeforeAnimation }  >
          <Deposits isactive = {activeKey === '1-deposits'}/>
        </Tab>
        <Tab
          eventKey = "2-earnings"
          title = "Club Earnings"
          className = { classBeforeAnimation }>
          <Earnings isactive = {activeKey === '2-earnings'}/>
        </Tab>
      </Tabs>
    </main>
  )
}


/*
========================================================
Deposits Tab
========================================================
*/

function Deposits({isactive}){
  useLogger('Club Deposits', isactive)
  const isDesktop = useIsDesktop()

  const { memberDashboard } = useMemberDashboard()
  let summary = memberDashboard.summary.clubDeposits
  let deposits = memberDashboard.clubDeposits
  deposits = deposits.map((deposit)=>{
    deposit.values = deposit.values.map((value)=>{
      value[1] = value[1].toLocaleString()
      return value
    })
    return deposit
  })

  let currentYear = deposits[0].year
  let [displayYear, setDisplayYear] = useState(currentYear)

  return(
    isDesktop ? <DepositsDesktop {... {summary, deposits, displayYear, setDisplayYear}} /> : <DepositsMobile {... {summary, deposits, displayYear, setDisplayYear}} />
  )
}

//Deposits Desktop
function DepositsDesktop({summary, deposits, displayYear, setDisplayYear}){

  let yearDeposits = deposits.filter((deposits) => deposits.year == displayYear)[0]
  let baseClass = "d-flex justify-content-between "

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <Row className="gx-0 column-gap-2">
      <Col className="col-4 d-flex flex-column">
        <TitleValueCard
          title = {"Club Worth"}
          value = {`UGX ${summary.clubWorth.toLocaleString()}`}
        />
        <ListGroup variant = "flush" className = 'mt-2'> 
          {
            deposits.map((yearDeposits) =>
              <ListGroup.Item
                action
                className = { yearDeposits.year == displayYear ? baseClass + 'display-item' : baseClass }
                onClick = {()=> setDisplayYear(yearDeposits.year) }
              >
                <span> { yearDeposits.year } </span>
                <span> UGX { yearDeposits.total.toLocaleString() } </span>
              </ListGroup.Item> )
          }
        </ListGroup>
      </Col>
      <Col className = "bg-white px-2">
        <YearDepositDetailDesktop key = {displayYear} yearDeposits = {yearDeposits} isMounted = {isMounted} />
      </Col>
    </Row>
  )
}

//Year Deposit Detail Desktop
function YearDepositDetailDesktop({yearDeposits, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {` year-detail fade ${(hasTransitionedIn || !isMounted) && 'show'}` } >
      <header className = "d-flex px-1 fw-bold border-bottom py-2">
        <span className="me-5"> { yearDeposits.year } </span>
        <span> UGX { yearDeposits.total.toLocaleString() } </span>
      </header>
      <Table head = { ['Month', 'Deposits (UGX)'] } body = {yearDeposits.values} />
    </div>
  )
}

//Deposits Mobile
function DepositsMobile({summary, deposits, displayYear, setDisplayYear}){
  let yearDeposits = deposits.filter((deposits) => deposits.year == displayYear)[0]

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <div className="d-flex flex-column flex-grow-1">
      <TitleValueCard
          title = {"Club Worth"}
          value = {`UGX  ${summary.clubWorth.toLocaleString()}`}
      />
      <div className="bg-white pt-2 px-2 my-1 flex-grow-1">
        <p className = "mb-3 px-1">Select year to display</p>

        <Dropdown
          as = 'div'
          className="mb-2"
          size = 'lg'
          onSelect = {(eventKey) => setDisplayYear(eventKey)}
        >
          <Dropdown.Toggle variant = "primary" className = 'd-flex w-100 align-items-center border-bottom  fw-bold'>
            <div className="d-flex justify-content-between px-2 py-2 w-100">
              <span> {displayYear} </span>
              <span> UGX {yearDeposits.total.toLocaleString()} </span>
            </div>
          </Dropdown.Toggle>
          <hr />
          <Dropdown.Menu className="w-100 px-1 px-md-2 pt-0 pb-2 shadow bg-body-tertiary">
            {
              deposits.map((yearDeposits)=>{
                return (
                  <>
                    <Dropdown.Item eventKey = { yearDeposits.year }>
                      <div className = "d-flex justify-content-between px-2 py-2 w-100">
                        <span> {yearDeposits.year} </span>
                        <span> UGX {yearDeposits.total.toLocaleString()} </span>
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
          <YearDepositDetailMobile key = { yearDeposits.year } yearDeposits = { yearDeposits } isMounted = {isMounted} />
        </div>
      </div>
    </div>
  )
}

//Year Deposit Detail Mobile
function YearDepositDetailMobile({yearDeposits, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {`year-detail fade ${ (hasTransitionedIn || !isMounted) && 'show'}` } >
      <Table head = { ['Month', 'Deposits (UGX)'] } body = { yearDeposits.values} />
    </div>
  )
}


/*
========================================================
Earnings Tab
========================================================
*/

function Earnings({isactive}){
  useLogger('Club Earnings', isactive)
  const { memberDashboard } = useMemberDashboard()
  const summary = memberDashboard.summary.clubEarnings
  let  earnings = memberDashboard.clubEarnings
  earnings = earnings.map((earning)=>{
    earning[1] = earning[1].toLocaleString()
    return earning
  })

  return(
    <div className="d-flex flex-column flex-grow-1">
      <TitleValueCard
          title = {"Club Worth"}
          value = {`UGX  ${summary.clubWorth.toLocaleString()}`}
      />
      <div className="flex-grow-1 bg-white mt-1 px-2"> 
        <Table head = {['Year', 'Earnings (UGX)', 'ROI(%)']} body = {earnings} />
      </div>
    </div>
    
  )
}