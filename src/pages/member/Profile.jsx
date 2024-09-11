import { useEffect, useState, useRef} from "react";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";
import { useTransition } from "../../hooks/useTransition";
import styles from "./profile.module.css"
import React from 'react';




export function Profile(){
  const hasTransitionedIn = useTransition()

  useLogger('Profile')

  const user = useMemberDashboard().memberDashboard.user

  return(
    <main className =  { `page bg-white d-flex flex-column my-1 overflow-hidden  rounded-top  flex-grow-1 mx-2 ${hasTransitionedIn && 'animate-page'}` }>
      <Header user = {user} />
      <Camera/>
    </main>
  )
}


function Header({user}){
  const API = process.env.REACT_APP_RESOURCE_SERVER_URL
  return(
    <header className= {styles["profile-header"]}>
      <div className= {styles["border-container"]}>
        <img className= {styles["opacity-50"]} src = { user.photoURL? `${API + '/' + user.photoURL}` : user.defaultPhoto} />
      </div>
    </header>
  )
}

function Camera(){
  const {memberDashboard, setMemberDashboard} = useMemberDashboard()
  const user = memberDashboard.user;

  function handleUserChange(dataURL){
    setMemberDashboard({...memberDashboard, user : {...user, defaultPhoto: dataURL}})
  }

  const [hasCameraPermission, setHasCameraPermission] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null);

  function handleCapture(){
    
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const pngData = canvasRef.current.toDataURL('image/png');
    handleUserChange(pngData)
  }

  useEffect(()=>{

    const videoElem = videoRef.current

    async function startCamera(){
       
      try{
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        videoElem.srcObject = streamRef.current
        await videoElem.play()
        setHasCameraPermission(true)
      } catch(err){
        console.log(err)
      }

    }

    startCamera()
   

    return () => {
      if (streamRef && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoElem) {
        videoElem.pause();
        videoElem.srcObject = null; 
      }
    };
  

  }, [])


  return(
    <div className= {styles.cameraContainer} >
      <div className="bg-white">
        <video  style={{}} className="d-block text-center" ref = {videoRef} ></video>
       { hasCameraPermission?  <button onClick={handleCapture} >Capture</button> : <p>Waiting for permission to use camera ...</p> }
      </div>
  
      <canvas ref={canvasRef} ></canvas>
    
    </div>

  )
}

