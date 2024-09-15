import { useEffect, useState, useRef} from "react";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";
import { useLogger } from "../../hooks/useLogger";
import { useTransition } from "../../hooks/useTransition";
import styles from "./profile.module.css"
import React from 'react';
import { Modal,  Offcanvas, Toast, ToastContainer, Button, Spinner, Form } from "react-bootstrap";
import { CameraFill, Images, Trash3Fill, PencilFill } from "react-bootstrap-icons";

export function Account(){
  useLogger('Profile')
  const hasTransitionedIn = useTransition()
  const [activeUI, setActiveUI] = useState([])
  const allUI =  ["account", "loading", "source-picker", "profile-photo"]
  const [accountUpdateFeedback, setAccountUpdateFeedback] = useState("")

  const { memberDashboard, setMemberDashboard } = useMemberDashboard()
  const user = memberDashboard.user

  const API = process.env.REACT_APP_RESOURCE_SERVER_URL

  function handleChangeActiveUI(UI){
    console.log("active ui", UI)
    if (!UI.every(item => allUI.includes(item))) throw new Error("Invalid UI")
    setActiveUI(UI)
  }

  function handleChangeUser(props){
    setMemberDashboard({...memberDashboard, user: {...user, ...props} })
  }

  return(
    <main className =  { `page bg-white my-1 overflow-hidden  rounded-top  flex-grow-1 mx-2 ${hasTransitionedIn && 'animate-page'}` }>
      <Header activeUI = {activeUI} handleChangeActiveUI = { handleChangeActiveUI } user = {user} />

      <AccountInfo
        user = {user}
        handleChangeUser = {handleChangeUser}
        setAccountUpdateFeedback = { setAccountUpdateFeedback }
      />
      <ImageSourcePicker
        activeUI = {activeUI}
        handleChangeActiveUI = {handleChangeActiveUI}
        show = {activeUI.includes("source-picker")}
        hasPhoto={user.photoURL}
        handleChangeUser = {handleChangeUser}
        setAccountUpdateFeedback = {setAccountUpdateFeedback}
      />

      <AccountUpdateFeedback setAccountUpdateFeedback = { setAccountUpdateFeedback } feedback = { accountUpdateFeedback }  />
      { user.photoURL &&
        <ProfilePhotoFull
          show = {activeUI.includes("profile-photo")}
          imgSrc = { user.photoURL.startsWith("data")? user.photoURL: API + "/" + user.photoURL}
          handleChangeActiveUI = {handleChangeActiveUI}
          activeUI = {activeUI}
        />
      }

    </main>
  )
}

function Header({user, activeUI, handleChangeActiveUI}){
  const API = process.env.REACT_APP_RESOURCE_SERVER_URL
  let imgSrc = user.defaultPhoto
  if (user.photoURL){
    imgSrc = user.photoURL.startsWith("data")? user.photoURL: API + '/' + user.photoURL
  }
  return(
    <header className= {styles["profile-header"]}>
      <div className= {styles["border-container"]}>
        {
          activeUI.includes("loading") && 
          <div className={styles["border-animator"]}>
          </div>
        }
        { !user.photoURL &&
          <button
            disabled = {activeUI.includes("loading")}
            className = {styles["add-photo-btn"] + " shadow-lg"}
            onClick={()=>handleChangeActiveUI([...activeUI, "source-picker"])}
          >
            <CameraFill size={20}/> <br/> ADD PHOTO
          </button>
        }
        { user.photoURL &&
          <button
            disabled = {activeUI.includes("loading")}
            className = {styles["full-photo-btn"] + " shadow-lg"}
            onClick={()=>handleChangeActiveUI(["profile-photo"])}
          >
          </button>
        }
        <img className= {activeUI.includes("loading")? "opacity-50": undefined}  src =  {imgSrc} />
      </div>
    </header>
  )
}

function ImageSourcePicker({activeUI, setAccountUpdateFeedback, handleChangeActiveUI, show, handleChangeUser, hasPhoto}){

 
  async function handleDeletePhoto(){
    handleChangeActiveUI(["loading"])
    try {
      const API = process.env.REACT_APP_RESOURCE_SERVER_URL
      const response = await fetch(API + "/delete-photo", {
        method: "DELETE",
        credentials: "include",
      })
      if (response.ok) {
        handleChangeUser({photoURL: ""})
        setAccountUpdateFeedback({type: "success", msg: "Photo Update Successful"})
      } else {
        setAccountUpdateFeedback({type: "danger", msg: "Photo Update Unsuccessful"})
      }
    } catch(err){
      console.log(err)
      setAccountUpdateFeedback({type: "danger", msg: "Photo Update Unsuccessful"})
    }

    handleChangeActiveUI([])

  }
  async function cropImage(imageSrc) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;

      image.onload = () => {
        // Create a source canvas and draw the image onto it
        const sourceCanvas = document.createElement('canvas');
        const sourceContext = sourceCanvas.getContext('2d');
        sourceCanvas.width = image.width;
        sourceCanvas.height = image.height;
        sourceContext.drawImage(image, 0, 0);

        // Calculate the cropping dimensions
        const cropSize = Math.floor(Math.abs(image.height - image.width)/2)
        let leftCrop
        let rightCrop
        let topCrop
        let bottomCrop
        if (image.height >= image.width) {
          leftCrop = 0
          rightCrop = 0
          topCrop = cropSize
          bottomCrop = cropSize
        } else {
          leftCrop = cropSize
          rightCrop = cropSize
          topCrop = 0
          bottomCrop = 0
        }
        const srcX = leftCrop;
        const srcY = topCrop;
        const srcWidth = image.width - leftCrop - rightCrop;
        const srcHeight = image.height - topCrop - bottomCrop;

        // Create a destination canvas for the cropped image
        const croppedCanvas = document.createElement('canvas');
        const croppedContext = croppedCanvas.getContext('2d');
        croppedCanvas.width = srcWidth;
        croppedCanvas.height = srcHeight;

        // Perform the cropping by drawing a portion of the source canvas onto the destination canvas
        croppedContext.drawImage(sourceCanvas, srcX, srcY, srcWidth, srcHeight, 0, 0, srcWidth, srcHeight);

        // Convert cropped canvas to Data URL and resolve with the result
        
        resolve(croppedCanvas);
      };

      image.onerror = reject;
    });
  }
 
  async function readImage(file){
    const Reader = new FileReader()
    return new Promise((resolve, reject)=>{
      Reader.onload = async (e)=> {
        const imageSrc = e.target.result;
        const croppedCanvas = await cropImage(imageSrc)
        const base64Image = croppedCanvas.toDataURL('image/jpeg');
        const blobImage = await new Promise((resolve, reject)=>{
          croppedCanvas.toBlob((blob)=>{
            if (blob) resolve(blob); else reject(new Error("Blob conversion failed"))
          }, "image/jpeg")
        })
        resolve([base64Image, blobImage])
      }
      Reader.readAsDataURL(file)
    })
  }

  async function handleChangeImage(e){
    const imageFile = e.target.files[0]
    if (!imageFile) return;
    handleChangeActiveUI(["loading"])
    const [base64Image, blobImage] = await readImage(imageFile)
    const formData = new FormData();
    formData.append('image', blobImage, 'profile-image.jpg');
    try {
      const API = process.env.REACT_APP_RESOURCE_SERVER_URL
      const response = await fetch(API + "/upload-photo", {
        method: "POST",
        credentials: "include",
        body: formData
      })
      if (response.ok) {
        handleChangeUser({photoURL: base64Image})
        setAccountUpdateFeedback({type: "success", msg: "Photo Update Successful"})
      } else {
        setAccountUpdateFeedback({type: "danger", msg: "Photo Update Unsuccessful"})
      }
    } catch(err){
      console.log(err)
      setAccountUpdateFeedback({type: "danger", msg: "Photo Update Unsuccessful"})
    }

    handleChangeActiveUI([])
    
  }
  return(
    <Offcanvas
      onHide = {()=> handleChangeActiveUI(activeUI.filter((ui)=>ui!=="source-picker"))}
      className = {styles["image-source-picker"]}
      show = {show}
      placement="bottom"
    >
      <Offcanvas.Header className="px-5 pt-4 mb-3" closeButton>
        <Offcanvas.Title className="text-center flex-grow-1" >
          <h5 className="fw-bold">Profile Photo</h5>
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className= " px-4">
        <div className= { styles["source-picker-buttons"] + " d-flex align-items-center"}>
          <button disabled className="py-0 me-5">
            <CameraFill className="d-block mx-auto mb-3" size = {20} />
            Camera
          </button>
          <input
            onChange = {handleChangeImage}
            accept="image/*" id="photo-picker"
            type="file"
            style = {{display: "none"}}
            name="profile-photo"
          />
          <label style={{cursor: "pointer"}} htmlFor="photo-picker" >
            <Images className="d-block mx-auto mb-3" size = {20} />
            Gallery
          </label>

          <button
            disabled = {!hasPhoto}
            className="ms-auto"
            onClick = { handleDeletePhoto }
          >
            <Trash3Fill  className="d-block mx-auto mb-3" size = {20} />
            Remove
          </button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  )
}

function AccountUpdateFeedback({feedback, setAccountUpdateFeedback}){
  return(
    <ToastContainer className= {styles["photo-feeback-toast"]} position="middle-center" >
      <Toast onClose={() => setAccountUpdateFeedback("")} className="" show = { feedback } delay = {3000} bg = {feedback.type} autohide>
        <Toast.Body className="text-white py-2 text-center px-0" > {feedback.msg} </Toast.Body>
      </Toast>
    </ToastContainer>
  )
}

function ProfilePhotoFull({imgSrc, handleChangeActiveUI, activeUI, show}){
  const API = process.env.REACT_APP_RESOURCE_SERVER_URL
  
  return (

    <Modal
      show = {show}
      onHide = {()=> handleChangeActiveUI([])}
      fullscreen
      data-bs-theme = "dark"
      onClick = {()=> { if (activeUI.includes("source-picker")) handleChangeActiveUI(["profile-photo"])}}
    >
        <Modal.Header className="bg-dark justify-content-start align-items-center text-white border-bottom-0 px-4" closeButton>
          <Modal.Title className=" flex-grow-1" >
            <h5>Profile Photo</h5>
          </Modal.Title>
          <button
            onClick={()=> handleChangeActiveUI(["profile-photo", "source-picker"])}
            className = "ms-auto me-4 border-0 bg-dark">
            <PencilFill />
          </button>
        </Modal.Header>
      <Modal.Body  className="bg-dark d-flex justify-content-center align-items-center h-100">
        <img style={{maxWidth: "500px"}} className="w-100" src= {imgSrc} alt="Profile Photo" />
      </Modal.Body>
    </Modal>
  )
}

function AccountInfo({user, handleChangeUser, setAccountUpdateFeedback}){
  const [status, setStatus] = useState(null)
  const nameRef = useRef(null)
  const formRef = useRef(null)
  const submitRef = useRef(null)

  async function handleSubmit(e){
    e.preventDefault()
    setStatus("loading")
    const body = {
      displayName: e.target.displayName.value,
      phoneContact: e.target.phoneContact.value,
      alerts: e.target.alerts.checked
    }

    try {
      const API = process.env.REACT_APP_RESOURCE_SERVER_URL
      const response = await fetch( API + "/update-user", {
        headers : {
          "Content-Type": "application/json"
        },
        method: "POST",
        credentials: "include",
        body: JSON.stringify(body)
      })
      if (response.ok) {
        setStatus(null)
        handleChangeUser(body)
        setAccountUpdateFeedback({type: "success", "msg": "Account Update Successful"})
      } else{
        setStatus("editing")
        setAccountUpdateFeedback({type: "danger", "msg": "Account Update Unsuccessful"})
      }
    } catch(err){
      console.log(err)
      setStatus("editing")
      setAccountUpdateFeedback({type: "danger", "msg": "Account Update Unsuccessful"})
    }
  }

  useEffect(()=>{
    if (status === "editing") nameRef.current.focus()
  }, [status])
  return (
    <section className = { styles["account-form"] + " py-4 px-3 px-md-5 mt-5"}>
      <div className= { styles["account-form-buttons"] + " d-flex justify-content-between mb-3 col-md-10"}>
        <h4 className="fw-light">Account Info</h4>
        {
          !status &&
          <Button
            className = ""
            size = "sm"
            variant="primary"
            onClick={()=>setStatus("editing")}
          >
             Edit
          </Button>
        }
        { status  &&
          <div className= {"position-relative"}>
            <Button
              className="d-block"
              size = "sm"
              variant="primary"
              disabled = {status === "loading"}
              onClick = {()=>submitRef.current.click()}
            >
              {status === "loading"? "Saving " : "Save"}
              {status === "loading" && <Spinner className="ms-1" size="sm" /> }
            </Button>
            <Button
              className="position-absolute mt-2"
              size = "sm"
              variant="secondary"
              disabled = {status === "loading"}
              onClick={()=>setStatus(null)}
            >
              Cancel
            </Button>
          </div>
        }
      </div>
      <form ref={formRef} onSubmit = {handleSubmit} >
        <div className="mb-4">
          <h6 className="fw-bold mb-1">Name</h6>
          { !status &&
            <p className="fw-light py-1" >
              {user.displayName || user.fullName.split(" ")[0]}
            </p>
          }
          {
            status  &&
            <Form.Control
              required
              ref = {nameRef}
              disabled = {status ==="loading"}
              name="displayName"  type="text"
              defaultValue = {user.displayName || user.fullName.split(" ")[0]}
              className="px-0 mb-2 d-block"
          />
          }
        </div>
        <div className="mb-4">
          <h6 className="fw-bold mb-1">Phone Contact</h6>
          { !status &&
            <p className="fw-light mb-0 py-1" >
              {user.phoneContact || "Not Available"}
            </p>
          }
          {
            status &&
            <Form.Control
              disabled = {status ==="loading"}
              required
              name="phoneContact" type="tel"
              pattern="[0-9]{10}"
              defaultValue = {user.phoneContact || ""}
              className="px-0 mb-1"
          />
          }
        </div>
        <div className="mb-4">
          <h6 className="fw-bold">Email Address</h6>
          { !status &&
            <p className="fw-light mb-0 py-1" >
              {user.email}
            </p>
          }
          {
            status  &&
            <Form.Control
              readOnly
              disabled = {status ==="loading"}
              name="email" type="text"
              defaultValue = {user.email + "  [Read-Only]"}
              className="px-0 mb-1"
          />
          }
        </div>
        <div >
          <h6 className="fw-bold mb-2">Email Alerts</h6>
          { !status && 
            <p className="fw-light py-1" > {user.alerts? "On" : "Off"}
          </p>
          }

          { status &&
          <Form.Check
            type="switch"
            name="alerts"
            id="custom-switch"
            label="Toggle"
            defaultChecked = {user.alerts}
            disabled = {status ==="loading"}
          />

          }
        </div>
        <input hidden ref = {submitRef} type="submit" />
      </form>
    </section>
  )
}





















// function ImageResizer({handleChangeActiveUI, show}){

//   return(
//     <Modal
//       show={show}
//       onHide={()=>handleChangeActiveUI(["account"])}
//       fullscreen
//     >
//       <Modal.Body  className="bg-dark">
//         <div className={styles["image-resize-container"] }>
//           <div className= {styles["resize-box"]} >

//           </div>
//           <img className="w-100" src="https://plus.unsplash.com/premium_photo-1689977968861-9c91dbb16049?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZSUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D" />
//         </div>
//       </Modal.Body>
//     </Modal>
//   )
// }
// function Camera(){
//   const {memberDashboard, setMemberDashboard} = useMemberDashboard()
//   const user = memberDashboard.user;

//   function handleUserChange(dataURL){
//     setMemberDashboard({...memberDashboard, user : {...user, defaultPhoto: dataURL}})
//   }

//   const [hasCameraPermission, setHasCameraPermission] = useState(false)
//   const [cameraActive, setCameraActive] = useState(true)

//   const videoRef = useRef(null)
//   const canvasRef = useRef(null)
//   const streamRef = useRef(null);

//   function handleCapture(){
    
//     canvasRef.current.width = videoRef.current.videoWidth;
//     canvasRef.current.height = videoRef.current.videoHeight;
//     const ctx = canvasRef.current.getContext('2d');
//     ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
//     const pngData = canvasRef.current.toDataURL('image/png');
//     setCameraActive(false)
//     handleUserChange(pngData)
//   }

//   async function startCamera(){
//     const videoElem = videoRef.current
//     try{
//       streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
//       videoElem.srcObject = streamRef.current
//       await videoElem.play()
//       setHasCameraPermission(true)
//     } catch(err){
//       console.log(err)
//     }

//   }

//   function handleRetryCamera(){
//     setCameraActive(true);
//     startCamera()
//   }

//   useEffect(()=>{
    
//     startCamera()
   
//     return () => {
//       if (streamRef && streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//         streamRef.current = null;
//       }
//       if (videoRef.current) {
//         videoRef.pause();
//         videoRef.srcObject = null; 
//       }
//     };
  

//   }, [])


//   return(
//     <div className= {styles.cameraContainer} >
//       <div>
//         <div className="d-flex text-white justify-content-between px-4 py-2">
//           <p className=" fw-bold mb-0" >Take Photo</p>
//           <CloseButton variant="white" />
//         </div>
//         { cameraActive &&
//           <video className="d-block text-center" ref = {videoRef} ></video>
//         }
//         <CameraControl handleRetryCamera={handleRetryCamera} setCameraActive = {setCameraActive} cameraActive={cameraActive} handleCapture={handleCapture} />
    
//       </div>
  
//       { <canvas className= {cameraActive? "d-none w-100": undefined} ref={canvasRef} ></canvas> }
    
//     </div>

//   )
// }


// function CameraControl({cameraActive, handleRetryCamera, handleCapture}){
//   return (
//     <div className = {styles["camera-control"] + " shadow-lg py-3"} >
//       { cameraActive && <div className="d-flex justify-content-center position-relative align-items-center">
//         <button className= { styles["btn-capture"] + " rounded-circle" } onClick={handleCapture} ></button>
//         <button className= { styles["btn-repeat"] + " "} > <ArrowRepeat  size={25} /> </button>
//       </div> }
//       {!cameraActive && <div className="d-flex py-2 justify-content-around">
//         <button onClick={handleRetryCamera } className= {styles["camera-preview-btn"]}>Retry</button>
//         <button className= {styles["camera-preview-btn"]}>OK</button>
//       </div> }
//     </div>
//   )
// }