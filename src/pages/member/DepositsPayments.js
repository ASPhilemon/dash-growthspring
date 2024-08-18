import { useState, useEffect } from "react";
import {Tabs, Tab, ListGroup, Row, Col, Dropdown } from "react-bootstrap";
import Table from "../../components/Table";
import TitleValueCard from "../../components/TitleValueCard";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";


export default function DepositsPayments(){

  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)
  let [activeKey, setActiveKey] = useState('1-deposits')
  let [classBeforeAnimation, setClassBeforeAnimation] = useState('p-left')

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <main className=  { `page d-flex flex-column  flex-grow-1 px-2 ${hasTransitionedIn && 'animate-page'}` }>
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
          title = "Deposits"
          className = { classBeforeAnimation }  >
          <Deposits isactive = {activeKey === "1-deposits"} />
        </Tab>
        <Tab
          eventKey = "2-payments"
          title = "Payments"
          className = { classBeforeAnimation }>
          <Payments isactive = {activeKey === "2-payments"}/>
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
  useLogger('Deposits', isactive)
  const isDesktop = useIsDesktop()

  const { memberDashboard } = useMemberDashboard()
  let summary = memberDashboard.summary.memberDeposits
  let deposits = memberDashboard.memberDeposits
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

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  let yearDeposits = deposits.filter((deposits) => deposits.year == displayYear)[0]
  let baseClass = "d-flex justify-content-between "

  return(
    <Row className="gx-0 column-gap-2">
      <Col className="col-4 d-flex flex-column">
        <TitleValueCard
          title = {"Your Worth"}
          value = {`UGX ${summary.yourWorth.toLocaleString()}`}
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
        <YearDepositDetailDesktop
          key = {displayYear}
          {...{ yearDeposits, isMounted }} 
        />
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
    <div className = { `year-detail fade ${ (hasTransitionedIn || !isMounted)  && 'show'}` } >
      <header className = "d-flex px-1 fw-bold border-bottom py-2">
        <span className="me-5"> { yearDeposits.year } </span>
        <span> UGX { yearDeposits.total.toLocaleString() } </span>
      </header>
      { yearDeposits.values.length > 0 &&
      <p className="mb-0 mt-2 fw-bold">
        Average Monthly Deposit &mdash; UGX 
        <span> { yearDeposits.avgMonthyDeposit.toLocaleString() } </span>
        </p>
      }
      <Table head = { ['Date', 'Amount (UGX)', 'Source'] } body = {yearDeposits.values} />
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
          title = {"Your Worth"}
          value = {`UGX  ${summary.yourWorth.toLocaleString()}`}
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
          <YearDepositDetailMobile
            key = { yearDeposits.year }
            {...{yearDeposits, isMounted}}
          />
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
      { yearDeposits.values.length > 0 &&
        <p className="mb-0 mt-2 fw-bold">
          Average Monthly Deposit &mdash; UGX 
          <span> { yearDeposits.avgMonthyDeposit.toLocaleString() } </span>
        </p>
      }
      <Table head = { ['Date', 'Amount (UGX)', 'Source'] } body = { yearDeposits.values} />
    </div>
  )
}


/*
========================================================
Payments Tab
========================================================
*/

function Payments({isactive}){
  useLogger('Payments', isactive)
  const isDesktop = useIsDesktop()
  
  const { memberDashboard } = useMemberDashboard()
  const summary = memberDashboard.summary.payments
  let  payments = memberDashboard.payments
  payments = payments.map((payment)=>{
    payment.values = payment.values.map((value)=>{
      value[1] = value[1].toLocaleString()
      return value
    })
    return payment
  })

  let currentYear = payments[0].year
  let [displayYear, setDisplayYear] = useState(currentYear)

  return(
    isDesktop ? <PaymentsDesktop {... {summary, payments, displayYear, setDisplayYear}} /> : <PaymentsMobile {... {summary, payments, displayYear, setDisplayYear}} />
  )
  
}

//Payments Desktop
function PaymentsDesktop({summary, payments, displayYear, setDisplayYear}){
  let avgYearlyReturn = summary.avgYearlyReturn
  let yearPayments = payments.filter((payments) => payments.year == displayYear)[0]
  let baseClass = "d-flex justify-content-between "

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <Row className="gx-0 column-gap-2">
      <Col className="col-4 d-flex flex-column">
        <TitleValueCard
          title = {"Average Yearly Return"}
          value = {`${avgYearlyReturn}`}
        />
        <ListGroup variant = "flush" className = 'mt-2'> 
          {
            payments.map((yearPayments) =>
              <ListGroup.Item
                action
                className = { yearPayments.year == displayYear ? baseClass + 'display-item' : baseClass }
                onClick = {()=> setDisplayYear(yearPayments.year) }
              >
                <span> { yearPayments.year } </span>
                <span> UGX { yearPayments.total.toLocaleString() } </span>
              </ListGroup.Item> )
          }
        </ListGroup>
      </Col>
      <Col className = "bg-white px-2">
        <YearPaymentDetailDesktop key = {displayYear} {...{yearPayments, isMounted}} />
      </Col>
    </Row>
  )
}

//Year Payment Detail Desktop
function YearPaymentDetailDesktop({yearPayments, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {` year-detail fade ${(hasTransitionedIn || !isMounted) && 'show'}` } >
      <header className = "d-flex px-1 fw-bold border-bottom py-2">
        <span className="me-5"> { yearPayments.year } </span>
        <span> UGX { yearPayments.total.toLocaleString() } </span>
      </header>
      { yearPayments.values.length > 0 &&
      <p className="mb-0 mt-2 fw-bold">
        Return on Investment &mdash; 
        <span> { yearPayments.roi } </span>
        </p>
      }
      <Table head = { ['Date', 'Amount (UGX)', 'Source', 'Destination'] } body = {yearPayments.values} />
    </div>
  )
}

//Payments Mobile
function PaymentsMobile({summary, payments, displayYear, setDisplayYear}){
  let yearPayments = payments.filter((payments) => payments.year == displayYear)[0]
  let avgYearlyReturn = summary.avgYearlyReturn

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <div className="d-flex flex-column flex-grow-1">
      <TitleValueCard
          title = {"Average Yearly Return"}
          value = {`${avgYearlyReturn}`}
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
              <span> UGX {yearPayments.total.toLocaleString()} </span>
            </div>
          </Dropdown.Toggle>
          <hr />
          <Dropdown.Menu className="w-100 px-1 px-md-2 pt-0 pb-2 shadow bg-body-tertiary">
            {
              payments.map((yearPayments)=>{
                return (
                  <>
                    <Dropdown.Item eventKey = { yearPayments.year }>
                      <div className = "d-flex justify-content-between px-2 py-2 w-100">
                        <span> {yearPayments.year} </span>
                        <span> UGX {yearPayments.total.toLocaleString()} </span>
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
          <YearPaymentDetailMobile key = { yearPayments.year } { ... { yearPayments, isMounted} } />
        </div>
      </div>
      
    </div>
  )
}

//Year Payment Detail Mobile
function YearPaymentDetailMobile({yearPayments, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {`year-detail fade ${ (hasTransitionedIn || !isMounted) && 'show'}` } >
      { yearPayments.values.length > 0 &&
        <p className="mb-0 mt-2 fw-bold">
          Return on Investment &mdash; 
          <span> { yearPayments.roi } </span>
        </p>
      }
      <Table head = { ['Date', 'Amount (UGX)', 'Source', 'Destination'] } body = { yearPayments.values} />
    </div>
  )
}
