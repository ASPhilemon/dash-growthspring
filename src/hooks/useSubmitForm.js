import { useState } from "react"

export function useSubmitForm({url, method = "POST", beforeSubmit, onSuccess = ()=>{}}){
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

    async function handleSubmit(e){
      e.preventDefault()
      beforeSubmit()
      
      const form = e.target
      let formData = new FormData(form)
      formData = Object.fromEntries(formData.entries()) 

      const isConfirmed = window.confirm(`You are sending ${formData.points} points to ${formData.beneficiary} `);
      if (!isConfirmed) {
        return
      }

      console.log("form Data", formData )

      async function submit(){
        setIsLoading(true)
        setError(null)
        setData(null)
        try {
          const res = await fetch(url, {
            method: method,
            body: JSON.stringify(formData),
            credentials: "include"
          })
          const data = await res.json()
          if (res.ok){
            onSuccess(data, formData )
            setData(data)
          } else {
            setData(null)
            setError(new Error(data.message))
          }
        } catch(err){
          setError(err)
          setData(null)
        }
        setIsLoading(false)
      }

      submit()
    }

  return {isLoading, data, error, setIsLoading, setData, setError, handleSubmit}

}