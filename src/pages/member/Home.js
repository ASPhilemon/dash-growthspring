import { useEffect, useState} from "react";
import { Row, Col} from "react-bootstrap";
import {toShortMoney} from "../../util/util";
import HomeCard from "../../components/HomeCard";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";



export default function Home(){

  useLogger('Home')
  const home = useMemberDashboard().memberDashboard.home
  let [hasTransitionedIn, sethasTransitionedIn] = useState(false)

  useEffect(()=> {
    sethasTransitionedIn(true)
  }, [])

  return(
    <main className =  { `page d-flex flex-column my-1  flex-grow-1 px-2 ${hasTransitionedIn && 'animate-page'}` }>
     <Row className="row-cols-1 row-cols-lg-2 g-2">
      {/* Your Worth */}
      <Col>
        <HomeCard
          main = {{ title: 'Your Worth', value: toShortMoney(home.yourWorth) }}
          left = {{ title: 'Risk', value: home.risk }}
          right = {{ title: 'Savings This Year', value: toShortMoney(home.thisYearSavings) }}
          href = '/deposits-payments'
          bg = 'bg-your-worth'
        />
      </Col>

      {/* Points */}
      <Col>
        <HomeCard
          main = {{title: 'Your Points', value: toShortMoney(home.pointsWorth) }}
          left = {{title: 'No. of Points', value: home.points }}
          right = {{title: 'Value of One Point', value: Math.floor(home.pointWorth) }}
          href = '/your-points'
          
        />
      </Col>

      {/* Debt */}
      <Col>
        <HomeCard
          main = {{title: 'Your Debt', value: toShortMoney(home.yourDebt) }}
          left = {{title: 'Best Rate', value: home.bestRate }}
          right = {{title: 'Max Limit For You', value: toShortMoney(home.maxLoanLimit) }}
          href = '/your-loans'
          
        />
      </Col>

      {/* Club Worth */}
      <Col>
        <HomeCard
          main = {{title: 'Club Worth', value: toShortMoney(home.clubWorth) }}
          left = {{title: 'Members', value: home.members }}
          right = {{title: 'Deposits This Year', value: toShortMoney(home.thisYearDeposits) }}
          href = '/club'
        />
      </Col>
     </Row>
    </main>
  )
}

