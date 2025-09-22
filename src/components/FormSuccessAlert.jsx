import { Spinner, Alert } from "react-bootstrap"


export function FormSuccessAlert({msg, setData}){
  return(
    <div className = {`form-error-backdrop px-3`} >
      <Alert
        variant="success"
        onClose = {() => setData(null)}
        dismissible
        className = {`form-error-content shadow-lg px-3`}
      >
        <Alert.Heading className="mb-3 fw-bold"> {msg} </Alert.Heading>
      </Alert>
    </div>

  )
}