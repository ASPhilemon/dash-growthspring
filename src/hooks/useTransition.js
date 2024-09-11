import { useState, useEffect } from "react";

export function useTransition(){
  const [hasTransitionedIn, setHasTransitionedIn] = useState(false)
  useEffect(()=>{
    setHasTransitionedIn(true)
  }, [])

  return hasTransitionedIn
}