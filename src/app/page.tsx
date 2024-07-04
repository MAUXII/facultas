'use client'

import { TbDatabaseImport } from "react-icons/tb";
import { TbTableImport } from "react-icons/tb";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import firebase from 'firebase/compat/app'; // Importe o Firebase compatível com v9
import { useAuthState } from 'react-firebase-hooks/auth'; // Importe o hook useAuthState do react-firebase-hooks/auth
import { auth } from './firebase'; // Importe a instância 'auth' do arquivo firebase.ts
import Image from 'next/image';
import { SalaCard } from '@/components/salacard/salacard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@radix-ui/react-dialog';
import { FileInput } from "@/components/btn-dragandropfile/dd-btn";
import { Sidebar } from "@/components/sidebar/sidebar";
import Link from "next/link";
import { MdArrowOutward } from "react-icons/md";
import { db } from "./firebase";
import { Timestamp, addDoc, collection, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { useSala } from "./SalasContext";


interface SalaData {
  alunos: string[];
  authorId: string;
  authorName: string;
  name: string;
  link: string;
  tag: string;
  id: string;
  editedAt: Timestamp;
  createdAt: Timestamp;
}

export default function Home() {
  const router = useRouter();
  const currentDate = new Date();
  console.log(currentDate)
  const [user, loading, error] = useAuthState(auth);
  const { salas, fetchSalas } = useSala();

  useEffect(() => {
    fetchSalas();
  }, []);

  return (
    <main className="flex w-full min-h-screen items-center justify-center ">
      {user && !loading ? ( // Se o usuário estiver autenticado e o carregamento não estiver em andamento
        <section className="w-full flex h-full min-h-screen  items-start justify-center pt-24 py-10 md:py-10 md:pt-10 pb-6 md:pl-[352px] px-8">
          
          <div className="w-full relative flex flex-col gap-12 justify-center max-w-[900px]">
          
            <div className='flex flex-col gap-1'>
              <h2 className='text-3xl text-white/30 flex flex-wrap gap-x-2 font-medium'>Bem vindo de volta, <a className='capitalize font-semibold text-white'>{user ? ` ${user.displayName || 'Usuário'}` : ''}</a></h2>
              <p className='text-[#B1B1B1] text-sm'>Descubra quantas possibilidades pode existir com o PRTrack</p>
            </div>
            <div className='relative hidden overflow-clip bg-custom-gradient flex w-full h-[280px] justify-between flex-wrap ring-1 ring-white/20 rounded-xl p-10'>
              <div className='flex flex-col justify-between'>
                <div className='flex flex-col gap-2'>
                  <h3 className='text-xl font-medium'>Diga Adeus às Listas Fisicas</h3>
                  <p className='text-[#B1B1B1] max-w-[400px] md:max-w-full md:pr-[360px] lg:pr-[420px] text-sm'>O PRTrack surgiu como uma necessidade apresentada pelo Professor Aoki mediantes às listas síficas de presença que atrasavam a gestão e bom funcionamento</p>
                </div>
                <a className='text-sm cursor-pointer'>Já entendi, fechar</a>
              </div>
              <div className='hidden absolute flex-1 right-0 top-0 w-full max-w-[250px] h-full md:flex bg-[#202020]'>
                <Image className='ml-[-100px] w-[300px]' src="/nomore.svg" height={600} width={600} alt='no more papers' />
              </div>
            </div>
            <div className='flex w-full flex-col gap-9'>
              <div className='flex w-full items-center justify-between'>
                <h2 className='text-2xl font-medium'>Salas recentes</h2>
                
               <Link className="text-sm items-center flex gap-2 group  transition-colors" href = "rooms" >
               {salas && salas.length > 0 ? ("Ver todas") : ("Criar sala")}
                
                <MdArrowOutward className="opacity-0 -ml-2 -translate-x-4 group-hover:opacity-100 transition-all group-hover:ml-2 group-hover:translate-x-0" />
               </Link>
    
              </div>
              <div className='salas flex flex-wrap self-stretch flex-grow items-center content-center gap-5'>
                {salas && salas.length > 0 ? (
  salas
    .sort((a, b) => b.editedAt.toDate().getTime() - a.editedAt.toDate().getTime()) // Convertendo timestamp para Date com toDate() antes de subtrair
    .slice(0, 3) // Limita aos três primeiros elementos
    .map((sala) => (
      <SalaCard
        key={sala.id}
        title={sala.name}
        text={sala.alunos.length}// Adiciona 'alunos' ao texto
        link={sala.id}
        emoji={sala.tag}
        home={true}
        fetchSalas={fetchSalas}
      />
    ))
) : (
  <div className="flex gap-2 justify-start self-start items-center">
                  <p className="w-full text-white/60">Nenhuma sala encontrada</p>
            
                  
                  
                  </div>
)}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="min-h-screen flex w-full z-[999] dark:bg-black items-center justify-center">                
          <Image className='w-[50px] animate-ping' src="/logo.svg" height={600} width={600} alt='no more papers' />
        </div> // Adicione uma mensagem de carregamento enquanto o estado de autenticação estiver sendo verificado
      )}
    </main>
  );
}
