import { useState, useEffect } from "react";
import {Tabs, Tab, ListGroup, Row, Col, Dropdown } from "react-bootstrap";
import Table from "../../components/Table";
import TitleValueCard from "../../components/TitleValueCard";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";



export default function Loans(){
 
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)
  let [activeKey, setActiveKey] = useState('1-loans')
  let [classBeforeAnimation, setClassBeforeAnimation] = useState('p-left')

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <main className=  { `page d-flex flex-column  flex-grow-1 px-2 ${hasTransitionedIn && 'animate-page'}` }>
      <Tabs
      defaultActiveKey = "1-ongoing-loans"
      className = "mb-1 tabs-links-container px-2 py-1"
      variant = "pills"
      transition = {true}
      onSelect = {(key) => {
        if (activeKey < key) setClassBeforeAnimation('p-right')
        else setClassBeforeAnimation('p-left')
        setActiveKey(key)
      }}
      >
        <Tab eventKey = "1-ongoing-loans"
          title = "Ongoing Loans"
          className = { classBeforeAnimation }  >
          <OngoingLoansTab isactive = {activeKey === '1-ongoing-loans'} />
        </Tab>
        <Tab eventKey = "2-ended-loans"
          title = "Ended Loans"
          className = { classBeforeAnimation }  >
          <EndedLoansTab isactive = {activeKey === '2-ended-loans'} />
        </Tab>
      </Tabs>
    </main>
  
    
  )
}

/*
====================================================
Ongoing Loans Tab
====================================================
*/

function OngoingLoansTab({isactive}){
  useLogger('Loans', isactive)
  const isDesktop = useIsDesktop()
  
  const { memberDashboard } = useMemberDashboard()
  const summary = memberDashboard.summary.loans
  let  loans = memberDashboard.loans
  loans = loans.filter((loan)=>loan.loan_status === "Ongoing")
  loans = loans.map((loan)=>{
    loan.loanAmount = loan.loanAmount.toLocaleString()
    loan.amountLeft = loan.amountLeft.toLocaleString()
    loan.pointsSpent = loan.pointsSpent.toLocaleString()
    loan.paymentHistory = loan.paymentHistory.map((payment)=>{
      payment[1] = payment[1].toLocaleString()
      return payment
    })
    return loan
  })

  let latestLoanId = null

  if(loans.length > 0) {
    latestLoanId = loans[0].loanId
  }

  let [displayLoanId, setDisplayLoanId] = useState(latestLoanId)

  return(
   
    loans.length > 0? isDesktop ? <OngoingLoansDesktop {... {summary, loans, displayLoanId, setDisplayLoanId}} /> : <OngoingLoansMobile {... {summary, loans, displayLoanId, setDisplayLoanId}} /> : <NoLoans text = "You have 0 ongoing loans" summary = {summary}/>
  )
  
}

//Ongoing Loans Desktop
function OngoingLoansDesktop({summary, loans, displayLoanId, setDisplayLoanId}){


  let displayLoan = loans.filter((loan) => loan.loanId == displayLoanId)[0]
  let baseClass = "d-flex justify-content-between "

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <Row className = "gx-0 column-gap-2">
      <Col className = "col-4 d-flex flex-column">
        <TitleValueCard
          title = {"Current Debt"}
          value = {`UGX ${summary.currentDebt.toLocaleString()}`}
        />
        <ListGroup variant = "flush" className = 'mt-2'> 
          {
            loans.map((loan) =>
              <ListGroup.Item
                action
                className = { loan.loanId == displayLoanId ? baseClass + 'display-item' : baseClass }
                onClick = {()=> setDisplayLoanId(loan.loanId) }
              >
                <span> { loan.issueDate } </span>
                <span> UGX { loan.loanAmount.toLocaleString() } </span>
              </ListGroup.Item> )
          }
        </ListGroup>
      </Col>
      <Col className = "bg-white px-2">
        <OngoingLoanDetailDesktop key = {displayLoanId} {... { displayLoan, isMounted }} />
      </Col>
    </Row>
  )
}

//Ongoing Loans Detail Desktop
function OngoingLoanDetailDesktop({displayLoan, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  let loanSummary = [
    ['Amount Left', displayLoan.amountLeft],
    ['Agreed Loan Duration', displayLoan.agreedLoanDuration],
    ['Interest Accrued', displayLoan.interest_accrued],
    ['Points Accrued', displayLoan.points_accrued],
    ['Status', displayLoan.loan_status]
  ]

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {` year-detail fade ${(hasTransitionedIn || !isMounted) && 'show'}` } >
      <header className = "d-flex px-1 fw-bold border-bottom py-2">
        <span className="me-5"> { displayLoan.issueDate } </span>
        <span> UGX { displayLoan.loanAmount.toLocaleString() } </span>
      </header>
      <Table body = {loanSummary} />
      <hr className="mt-0" />
      <h5>Payment History</h5>
      <Table head = {['Date', 'Amount (UGX)']} body = {displayLoan.paymentHistory} />
    </div>
  )
}

//Ongong Loans Mobile
function OngoingLoansMobile({summary, loans, displayLoanId, setDisplayLoanId}){
  let displayLoan = loans.filter((loan) => loan.loanId == displayLoanId)[0]

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <div className="d-flex flex-column flex-grow-1">
     <TitleValueCard
        title = {"Current Debt"}
        value = {`UGX ${summary.currentDebt.toLocaleString()}`}
      />
      <div className="bg-white pt-2 px-2 my-1 flex-grow-1">
        <p className = "mb-3 px-1">Select loan to display</p>

        <Dropdown
          as = 'div'
          className = "mb-2"
          size = 'lg'
          onSelect = {(eventKey) => setDisplayLoanId(eventKey)}
        >
          <Dropdown.Toggle variant = "primary" className = 'd-flex w-100 align-items-center border-bottom  fw-bold'>
            <div className="d-flex justify-content-between px-2 py-2 w-100">
              <span> {displayLoan.issueDate} </span>
              <span> UGX {displayLoan.loanAmount.toLocaleString()} </span>
            </div>
          </Dropdown.Toggle>
          <hr />
          <Dropdown.Menu className="w-100 px-1 px-md-2 pt-0 pb-2 shadow bg-body-tertiary">
            {
              loans.map((loan)=>{
                return (
                  <>
                    <Dropdown.Item eventKey = { loan.loanId }>
                      <div className = "d-flex justify-content-between px-2 py-2 w-100">
                        <span> {loan.issueDate} </span>
                        <span> UGX {loan.loanAmount.toLocaleString()} </span>
                      </div>
                    </Dropdown.Item>
                    <hr className = "my-0 py-0" />
                  </>
                )
              })
            }
            
          </Dropdown.Menu>
        </Dropdown>
        <div className = "bg-white px-2">
          <OngoingLoanDetailMobile key = { displayLoanId } { ... {displayLoan, isMounted} } />
        </div>
      </div>
    </div>
  )
}

//Ongoing Loan Detail Mobile
function OngoingLoanDetailMobile({displayLoan, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  let loanSummary = [
    ['Amount Left', displayLoan.amountLeft],
    ['Agreed Loan Duration', displayLoan.agreedLoanDuration],
    ['Interest Accrued', `UGX ${Math.floor(displayLoan.interest_accrued).toLocaleString()}`],
    ['Points Accrued', displayLoan.points_accrued],
    ['Status', displayLoan.loan_status]
  ]

  return(
    <div  className = {`year-detail fade ${ (hasTransitionedIn || !isMounted) && 'show'}` } >
      <Table body = {loanSummary} />
      <hr className="mt-0" />
      <h5>Payment History</h5>
      <Table head = {['Date', 'Amount(UGX)']} body = {displayLoan.paymentHistory} />
    </div>
  )
}

function NoLoans({summary, text}){
  return(
    <div className="d-flex flex-column flex-grow-1">
      <TitleValueCard
        title = {"Current Debt"}
        value = {`UGX ${summary.currentDebt.toLocaleString()}`}
      />
      <div className="flex-grow-1 bg-white p-3 my-1">
        <p>{text}</p>
      </div>
    </div>
  )
}



//Ended Loans Tab
/*
====================================================
Ongoing Loans Tab
====================================================
*/

function EndedLoansTab({isactive}){
  useLogger('Loans', isactive)
  const isDesktop = useIsDesktop()
  
  const { memberDashboard } = useMemberDashboard()
  const summary = memberDashboard.summary.loans
  let  loans = memberDashboard.loans
  loans = loans.filter((loan)=>loan.loan_status === "Ended")
  loans = loans.map((loan)=>{
    loan.loanAmount = loan.loanAmount.toLocaleString()
    loan.amountLeft = loan.amountLeft.toLocaleString()
    loan.pointsSpent = loan.pointsSpent.toLocaleString()
    loan.paymentHistory = loan.paymentHistory.map((payment)=>{
      payment[1] = payment[1].toLocaleString()
      return payment
    })
    return loan
  })

  let latestLoanId = null

  if(loans.length > 0) {
    latestLoanId = loans[0].loanId
  }

  let [displayLoanId, setDisplayLoanId] = useState(latestLoanId)

  return(
   
    loans.length > 0? isDesktop ? <EndedLoansDesktop {... {summary, loans, displayLoanId, setDisplayLoanId}} /> : <EndedLoansMobile {... {summary, loans, displayLoanId, setDisplayLoanId}} /> : <NoLoans text = "You have 0 ended loans" summary = {summary}/>
  )
  
}

//Ended Loans Desktop
function EndedLoansDesktop({summary, loans, displayLoanId, setDisplayLoanId}){


  let displayLoan = loans.filter((loan) => loan.loanId == displayLoanId)[0]
  let baseClass = "d-flex justify-content-between "

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <Row className = "gx-0 column-gap-2">
      <Col className = "col-4 d-flex flex-column">
        <TitleValueCard
          title = {"Current Debt"}
          value = {`UGX ${summary.currentDebt.toLocaleString()}`}
        />
        <ListGroup variant = "flush" className = 'mt-2'> 
          {
            loans.map((loan) =>
              <ListGroup.Item
                action
                className = { loan.loanId == displayLoanId ? baseClass + 'display-item' : baseClass }
                onClick = {()=> setDisplayLoanId(loan.loanId) }
              >
                <span> { loan.issueDate } </span>
                <span> UGX { loan.loanAmount.toLocaleString() } </span>
              </ListGroup.Item> )
          }
        </ListGroup>
      </Col>
      <Col className = "bg-white px-2">
        <EndedLoanDetailDesktop key = {displayLoanId} {... { displayLoan, isMounted }} />
      </Col>
    </Row>
  )
}

//Ended Loans Detail Desktop
function EndedLoanDetailDesktop({displayLoan, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  let loanSummary = [
    ['Amount Left', displayLoan.amountLeft],
    ['Agreed Loan Duration', displayLoan.agreedLoanDuration],
    ['Interest Paid', displayLoan.interest_accrued],
    ['Points Spent', displayLoan.points_accrued],
    ['Status', displayLoan.loan_status]
  ]

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <div  className = {` year-detail fade ${(hasTransitionedIn || !isMounted) && 'show'}` } >
      <header className = "d-flex px-1 fw-bold border-bottom py-2">
        <span className="me-5"> { displayLoan.issueDate } </span>
        <span> UGX { displayLoan.loanAmount.toLocaleString() } </span>
      </header>
      <Table body = {loanSummary} />
      <hr className="mt-0" />
      <h5>Payment History</h5>
      <Table head = {['Date', 'Amount (UGX)']} body = {displayLoan.paymentHistory} />
    </div>
  )
}

//Ended Loans Mobile
function EndedLoansMobile({summary, loans, displayLoanId, setDisplayLoanId}){
  let displayLoan = loans.filter((loan) => loan.loanId == displayLoanId)[0]

  let [isMounted, setIsMounted] = useState(false)
  useEffect(()=> {
    setIsMounted(true)
  }, [])

  return(
    <div className="d-flex flex-column flex-grow-1">
     <TitleValueCard
        title = {"Current Debt"}
        value = {`UGX ${summary.currentDebt.toLocaleString()}`}
      />
      <div className="bg-white pt-2 px-2 my-1 flex-grow-1">
        <p className = "mb-3 px-1">Select loan to display</p>

        <Dropdown
          as = 'div'
          className = "mb-2"
          size = 'lg'
          onSelect = {(eventKey) => setDisplayLoanId(eventKey)}
        >
          <Dropdown.Toggle variant = "primary" className = 'd-flex w-100 align-items-center border-bottom  fw-bold'>
            <div className="d-flex justify-content-between px-2 py-2 w-100">
              <span> {displayLoan.issueDate} </span>
              <span> UGX {displayLoan.loanAmount.toLocaleString()} </span>
            </div>
          </Dropdown.Toggle>
          <hr />
          <Dropdown.Menu className="w-100 px-1 px-md-2 pt-0 pb-2 shadow bg-body-tertiary">
            {
              loans.map((loan)=>{
                return (
                  <>
                    <Dropdown.Item eventKey = { loan.loanId }>
                      <div className = "d-flex justify-content-between px-2 py-2 w-100">
                        <span> {loan.issueDate} </span>
                        <span> UGX {loan.loanAmount.toLocaleString()} </span>
                      </div>
                    </Dropdown.Item>
                    <hr className = "my-0 py-0" />
                  </>
                )
              })
            }
            
          </Dropdown.Menu>
        </Dropdown>
        <div className = "bg-white px-2">
          <EndedLoanDetailMobile key = { displayLoanId } { ... {displayLoan, isMounted} } />
        </div>
      </div>
    </div>
  )
}

//Loan Detail Mobile
function EndedLoanDetailMobile({displayLoan, isMounted}){
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  let loanSummary = [
    ['Amount Left', `UGX ${Math.floor(displayLoan.amountLeft).toLocaleString()}`],
    ['Agreed Loan Duration', displayLoan.agreedLoanDuration],
    ['Interest Paid', `UGX ${Math.floor(displayLoan.interest_accrued).toLocaleString()}`],
    ['Points Spent', displayLoan.points_accrued],
    ['Status', displayLoan.loan_status]
  ]

  return(
    <div  className = {`year-detail fade ${ (hasTransitionedIn || !isMounted) && 'show'}` } >
      <Table body = {loanSummary} />
      <hr className="mt-0" />
      <h5>Payment History</h5>
      <Table head = {['Date', 'Amount(UGX)']} body = {displayLoan.paymentHistory} />
    </div>
  )
}