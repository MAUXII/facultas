'use client'

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export const AuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
        console.log("nao tem usuario logado idiota")
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  return <div>{children}</div>;
};
