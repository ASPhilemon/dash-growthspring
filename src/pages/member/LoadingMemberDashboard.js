import { useEffect, useState} from "react";
import { Row, Button, Alert } from "react-bootstrap";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";


export default function LoadingMemberDashboard(){

  const { setMemberDashboard }  = useMemberDashboard()
  const [isPending, setIsPending] = useState(true)

 
  const navigate = useNavigate()
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    updateMemberData(setIsPending, setMemberDashboard, navigate, setFetchError)
  }, [navigate, setMemberDashboard])

  return(
    <main className="loading-page">
      <Row>
        { !fetchError &&
        <div className="loading-container">
          <div className="logo-loading mb-5 text-center w-100">GrowthSpring</div>
          <div className ="loading-bar-container rounded-pill">
            <div className = {`loading-bar rounded-pill " + ${!isPending && " loading-animation"}`}></div>
          </div>
        </div>
        }

        {fetchError && 
          <div className = 'my-auto col-12 mx-auto text-center px-4' >
            <Alert variant="danger" className=" mx-auto mb-5" >
              {fetchError}
            </Alert>
            <Button onClick = {()=> {
              setFetchError(null)
              updateMemberData(setIsPending, setMemberDashboard, navigate, setFetchError)
              }}
              className="px-3"
            >
              Retry
            </Button>
          </div>
        }
      </Row>
    </main>
  )
}


async function fetchMemberDashboard(setIsPending){

  const RESOURCE_API = process.env.REACT_APP_RESOURCE_SERVER_URL


  const memberDashboard = await axios.get(RESOURCE_API + '/homepage-data-opt', {
    responseType: 'json',
    withCredentials: true,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
  })
  setIsPending(false)
  await new Promise(resolve => setTimeout(resolve, 800));
  return memberDashboard.data
}

async function updateMemberData(setIsPending, setMemberDashboard, navigate, setFetchError){

  const AUTH_API = process.env.REACT_APP_AUTH_SERVER_URL

  try{
    const memberData = await fetchMemberDashboard(setIsPending)
    setMemberDashboard(memberData)
    navigate('/')
  } catch(err){
    console.log(err)
    if (err.code === 'ECONNABORTED'){
      setFetchError("Error: Request timeout out")
    } else {
      window.location.href =  AUTH_API + '/signin'
    }
  }
  
}