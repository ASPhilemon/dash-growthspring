import { useState, useEffect} from "react";

export function useIsDesktop(){
  const [screenSize, setScreenSize] = useState(window.innerWidth)
  let isDesktop = screenSize >= 992
  
  useEffect(()=>{
    window.addEventListener('resize', ()=>{
      setScreenSize(window.innerWidth)
      return ()=>{
        window.removeEventListener('resize')
      }
    })
  })

  return isDesktop;
}
