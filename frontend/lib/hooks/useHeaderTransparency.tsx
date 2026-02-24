'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface HeaderTransparencyContextType {
  transparent: boolean
  setTransparent: (value: boolean) => void
}

const HeaderTransparencyContext = createContext<HeaderTransparencyContextType>({
  transparent: false,
  setTransparent: () => {}
})

export function HeaderTransparencyProvider({ children }: { children: ReactNode }) {
  const [transparent, setTransparent] = useState(false)
  return (
    <HeaderTransparencyContext.Provider value={{ transparent, setTransparent }}>
      {children}
    </HeaderTransparencyContext.Provider>
  )
}

export function useHeaderTransparency() {
  return useContext(HeaderTransparencyContext)
}
