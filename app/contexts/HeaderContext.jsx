import { createContext, useContext, useState } from 'react';

const HeaderContext = createContext({
  rightSlot: null,
  setRightSlot: () => {}
});

export function HeaderProvider({ children }) {
  const [rightSlot, setRightSlot] = useState(null);

  return (
    <HeaderContext.Provider value={{ rightSlot, setRightSlot }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within HeaderProvider');
  }
  return context;
}

