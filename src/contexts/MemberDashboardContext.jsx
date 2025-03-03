import { createContext, useContext, useState } from 'react';


const MemberDashboardContext = createContext(null)

export function MemberDashboardProvider({ children }) {
  const [memberDashboard, setMemberDashboard] = useState(null)
  const value = { memberDashboard, setMemberDashboard }

  return (
    <MemberDashboardContext.Provider value = { value } >
      {children}
    </MemberDashboardContext.Provider>
  );
}

export function useMemberDashboard() {
  return useContext(MemberDashboardContext);
}



