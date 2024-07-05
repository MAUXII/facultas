'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../app/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

interface SalaData {
  alunos: any;
  tag: string;
  authorId: string;
  name: string;
  link: string;
  id: string;
  editedAt: Timestamp;
  createdAt: Timestamp;
}

interface SalaContextProps {
  salas: SalaData[];
  fetchSalas: () => void;
}

const SalaContext = createContext<SalaContextProps | undefined>(undefined);

export const useSala = () => {
  const context = useContext(SalaContext);
  if (!context) {
    throw new Error('useSala must be used within a SalaProvider');
  }
  return context;
};

export const SalaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salas, setSalas] = useState<SalaData[]>([]);
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  const fetchSalas = async () => {
    if (!user) return;


    try {
      const salasCollection = collection(db, 'salas');
      const snapshot = await getDocs(salasCollection);
      const data = snapshot.docs
        .map((doc) => ({
          ...(doc.data() as SalaData),
          id: doc.id,
        }))
        .filter((sala) => sala.authorId === user.uid);
      setSalas(data);
    } catch (error) {
      toast({
        title: "Erro ao buscar salas:",
        description: `${error}`,
                variant: "destructive", 
      });
    }
  };

  useEffect(() => {
    fetchSalas();
  }, [user]);

  return (
    <SalaContext.Provider value={{ salas, fetchSalas }}>
      {children}
    </SalaContext.Provider>
  );
};
