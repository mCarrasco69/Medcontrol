import type { ReactNode } from 'react';

import PerfilActivoProvider from './PerfilActivoProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <PerfilActivoProvider>
      {children}
    </PerfilActivoProvider>
  );
}
