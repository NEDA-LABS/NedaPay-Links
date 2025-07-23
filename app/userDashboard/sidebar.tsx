import React, { createContext, useContext, useState, ReactNode } from 'react';

type SidebarState = 'expanded' | 'collapsed';

interface SidebarContextType {
  state: SidebarState;
  setState: (state: SidebarState) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
  initialState?: SidebarState;
}

export function SidebarProvider({ children, initialState = 'expanded' }: SidebarProviderProps) {
  const [state, setState] = useState<SidebarState>(initialState);
  
  const toggle = () => {
    setState(prev => prev === 'expanded' ? 'collapsed' : 'expanded');
  };
  
  return (
    <SidebarContext.Provider value={{ state, setState, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className = '' }: SidebarProps) {
  const { state } = useSidebar();
  
  return (
    <div 
      className={`fixed md:relative z-50 h-screen transition-all duration-300 ease-in-out ${
        state === 'collapsed' ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SidebarContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`h-full flex flex-col overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}

export function SidebarGroup({ children }: { children: ReactNode }) {
  return <div className="mt-6">{children}</div>;
}

export function SidebarGroupLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-white/60 text-xs font-medium tracking-wide px-4 mb-2 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarGroupContent({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function SidebarMenu({ children }: { children: ReactNode }) {
  return <ul className="space-y-1">{children}</ul>;
}

export function SidebarMenuItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ 
  children, 
  asChild = false,
  className = ''
}: { 
  children: ReactNode; 
  asChild?: boolean;
  className?: string;
}) {
  if (asChild) {
    return <>{children}</>;
  }
  
  return (
    <button className={`w-full text-left ${className}`}>
      {children}
    </button>
  );
}