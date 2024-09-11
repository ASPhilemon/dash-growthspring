import { useState, useEffect } from "react";
import {Tabs, Tab, ListGroup, Row, Col, Dropdown } from "react-bootstrap";
import Table from "../../components/Table";
import TitleValueCard from "../../components/TitleValueCard";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";


export default function YourCredits(){

  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)
  let [activeKey, setActiveKey] = useState('1-credits')
  let [classBeforeAnimation, setClassBeforeAnimation] = useState('p-left')

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <main className=  { `page d-flex flex-column  flex-grow-1 px-2 ${hasTransitionedIn && 'animate-page'}` }>
      <Tabs
      defaultActiveKey = "1-credits"
      className = "mb-1 tabs-links-container px-2 py-1"
      variant = "pills"
      transition = {true}
      onSelect = {(key) =>{
        if (activeKey < key) setClassBeforeAnimation('p-right')
        else setClassBeforeAnimation('p-left')
        setActiveKey(key)
      }}
      >
        <Tab eventKey = "1-credits"
          title = "Credits"
          className = { classBeforeAnimation }  >
          <Credits isactive = {activeKey === '1-credits'}  />
        </Tab>
        
      </Tabs>
      
    </main>
  )
}


/*
========================================================
Credits Tab
========================================================
*/

function Credits({isactive}){
  useLogger('Credits', isactive)
  const isDesktop = useIsDesktop()

  const { memberDashboard } = useMemberDashboard()
  let summary = memberDashboard.summary.credits
  let discounts = memberDashboard.discounts
  discounts = discounts.map((discount)=>{
    discount.values = discount.values.map((value)=> {
      value[1] = value[1].toLocaleString()
      return value
    })
    return discount
  })

  let currentYear = discounts[0].year
  let [displayYear, setDisplayYear] = useState(currentYear)

  return(
    isDesktop ? <CreditsDesktop {... {summary, discounts, displayYear, setDisplayYear}} /> : <CreditsMobile {... {summary, discounts, displayYear, setDisplayYear}} />
  )
  
}

//Credits Desktop
function CreditsDesktop({summary, discounts, displayYear, setDisplayYear}){

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  let yearDiscounts = discounts.filter((discounts) => discounts.year == displayYear)[0]
  let baseClass = "d-flex justify-content-between "

  return(
    <Row className="gx-0 column-gap-2">
      <Col className="col-4 d-flex flex-column">
        <TitleValueCard
          title = {"Credits & Discount"}
          value = {`${summary.yourCredits.toLocaleString()} Credits, ${summary.yourDiscount.toLocaleString()} Discount `}
        />
        <ListGroup variant = "flush" className = 'mt-2'> 
          {
            discounts.map((yearDiscounts) =>
              <ListGroup.Item
                action
                className = { yearDiscounts.year == displayYear ? baseClass + 'display-item' : baseClass }
                onClick = {()=> setDisplayYear(yearDiscounts.year) }
              >
                <span> { yearDiscounts.year } </span>
                <span> UGX { yearDiscounts.total.toLocaleString() } Saved </span>
              </ListGroup.Item> )
          }
        </ListGroup>
      </Col>
      <Col className = "bg-white px-2">
        <YearCreditsDetailDesktop
          key = {displayYear}
          {...{ yearDiscounts, isMounted }} 
        />
      </Col>
    </Row>
  )
}

//Year Credits Detail Desktop
function YearCreditsDetailDesktop({yearDiscounts, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)


  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div className = { `year-detail fade ${ (hasTransitionedIn || !isMounted)  && 'show'}` } >
      <header className = "d-flex px-1 fw-bold border-bottom py-2">
        <span className="me-5"> { yearDiscounts.year } </span>
        <span> UGX { yearDiscounts.total.toLocaleString() }  Saved </span>
      </header>
      <Table head = { ['Date', 'Savings (UGX)', 'Source'] } body = {yearDiscounts.values} />
    </div>
  )
}

//Credits Mobile
function CreditsMobile({summary, discounts, displayYear, setDisplayYear}){
  let yearDiscounts = discounts.filter((discounts) => discounts.year == displayYear)[0] 

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <div className="d-flex flex-column flex-grow-1">
      <TitleValueCard
        title = {"Credits & Discount"}
        value = {`${summary.yourCredits.toLocaleString()} Credits,  ${summary.yourDiscount.toLocaleString()} Discount `}
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
              <span> UGX {yearDiscounts.total.toLocaleString()} Saved </span>
            </div>
          </Dropdown.Toggle>
          <hr />
          <Dropdown.Menu className="w-100 px-1 px-md-2 pt-0 pb-2 shadow bg-body-tertiary">
            {
              discounts.map((yearDiscounts)=>{
                return (
                  <>
                    <Dropdown.Item eventKey = { yearDiscounts.year }>
                      <div className = "d-flex justify-content-between px-2 py-2 w-100">
                        <span> {yearDiscounts.year} </span>
                        <span> UGX {yearDiscounts.total.toLocaleString()} Saved</span>
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
          <YearCreditsDetailMobile
            key = { yearDiscounts.year }
            {...{yearDiscounts, isMounted}}
          />
        </div>
      </div>
      
    </div>
  )
}

//Year Credits Detail Mobile
function YearCreditsDetailMobile({yearDiscounts, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {`year-detail fade ${ (hasTransitionedIn || !isMounted) && 'show'}` } >
      <Table head = { ['Date', 'Savings (UGX)', 'Source'] } body = { yearDiscounts.values} />
    </div>
  )
}




