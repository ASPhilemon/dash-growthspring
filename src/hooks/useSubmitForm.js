import { useState } from "react"

export function useSubmitForm({url, method = "POST", beforeSubmit, onSuccess = ()=>{}}){
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

    async function handleSubmit(e){
      e.preventDefault()
      beforeSubmit()
      setIsLoading(true)
      setError(null)
      const form = e.target
      let formData = new FormData(form)
      formData = Object.fromEntries(formData.entries()) 
      console.log("form Data", formData )

      try {
        const res = await fetch(url, {
          method: method,
          body: JSON.stringify(formData)
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

  return {isLoading, data, error, setIsLoading, setData, setError, handleSubmit}

}