import { useEffect } from "react";

export function useLogger(page, isactive = true){

  useEffect(()=> {

    isactive && fetch('https://api.growthspringers.com/log', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page })
    })
    
  }, [page, isactive])
}


