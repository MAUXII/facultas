'use client'

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '../../firebase';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { AlunoData, columns } from "./alunos/columns";
import { DataTable } from "./alunos/data-table";
import { Sidebar } from '@/components/sidebar/sidebar';
import { FaArrowLeftLong } from "react-icons/fa6";
import Link from 'next/link';
import { format } from 'date-fns';

interface Aluno extends AlunoData {
    RA: string;
}

export interface SalaData {
  alunos: Aluno[];
  authorId: string;
  authorName: string;
  name: string;
  link: string;
  tag: string;
  id: string;
  editedAt: Timestamp;
  createdAt: Timestamp;
}

function timestampToDate(timestamp: { seconds: any; nanoseconds: any; } | Date) {
    if (timestamp instanceof Date) {
      return timestamp; // Se já for uma data, retorna a data sem alterações
    } else {
      const seconds = timestamp.seconds;
      const nanoseconds = timestamp.nanoseconds;
      return new Date(seconds * 1000 + nanoseconds / 1000000); // Convertendo nanossegundos para milissegundos
    }
  }

function processAlunos(alunos: Aluno[], selectedDate: Date | null) {
    return alunos.map((aluno) => {
      // Mapeia presenca para selecionar apenas status e createdAt
      const formattedPresenca = aluno.presenca
        .filter(({ createdAt }) => {
          const date = typeof createdAt === 'object' ? timestampToDate(createdAt) : new Date(createdAt);
          return !selectedDate || date.toDateString() === selectedDate.toDateString();
        })
        .map(({ status, createdAt, editedAt }) => ({
          status,
          createdAt: typeof createdAt === 'object' ? timestampToDate(createdAt) : new Date(createdAt),
          editedAt,
        }));
  
      // Retorna Nome, RA e a presenca formatada
      return {
        ...aluno,
        presenca: formattedPresenca,
      };
    });
  }

export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const [sala, setSala] = useState<SalaData | null>(null);
  const [user, loading, error] = useAuthState(auth);
  const [acesso, setAcesso] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSala = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, 'salas', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as SalaData;
          setSala(data);
          // Verificar se o usuário tem acesso
          if (user && data && user.uid === data.authorId) {
            setAcesso(true);
          } else {
            setAcesso(false);
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching document: ', error);
      }
    };

    fetchSala();
  }, [id, user]);

  if (loading) {
    return (
      <div className='w-full min-h-screen flex items-center justify-center md:pl-[352px]'>                
        <Image className='w-[50px] animate-ping' src="/logo.svg" height={600} width={600} alt='no more papers' />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className='w-full min-h-screen flex items-center justify-center px-8 md:pl-[352px]'>
        <div className='text-center flex flex-col'>
          <h1 className='text-4xl font-bold'>Sala não encontrada</h1>
          <p className='mt-2'>A sala que você está procurando não existe ou foi removida.</p>
          <Link href="/rooms/" className="mt-4 text-blue-500 hover:underline">Voltar para as salas</Link>
        </div>
      </div>
    );
  }

  if (!sala) {
    return (
      <div className='w-full min-h-screen flex items-center justify-center md:pl-[352px]'>                
        <Image className='w-[50px] animate-ping' src="/logo.svg" height={600} width={600} alt='no more papers' />
      </div>
    );
  }

  if (!acesso) {
    return <div className='w-full min-h-screen flex items-center justify-center px-8 md:pl-[352px]'>
    <div className='text-center flex flex-col'>
      <h1 className='text-4xl font-bold'>Você não tem acesso à sala</h1>
      <p className='mt-2'>A sala que você está procurando não existe ou foi removida.</p>
      <Link href="/rooms/" className="mt-4 text-red-500 hover:underline">Voltar para as salas</Link>
    </div>
  </div>
  }

  {console.log("Alunos:", sala.alunos)}
  const alunosProcessados = processAlunos(sala.alunos, selectedDate);
 

  return (
    <div>
      <main className="flex w-full min-h-screen items-center justify-center ">
        {user && !loading ? ( // Se o usuário estiver autenticado e o carregamento não estiver em andamento
          <section className="w-full flex pt-24 py-10 md:py-10 md:pt-10 items-center justify-center  md:pl-[352px] px-8">
            <div className=" relative z-20 flex flex-col gap-6 justify-center w-[900px] max-w-[900px]">
              <div className='flex flex-col gap-6'>
                <Link className="text-sm items-center flex w-fit gap-2 group hover:text-white/80  transition-colors" href="/rooms/">
                  <FaArrowLeftLong className="mr-2" />
                  Voltar
                </Link>
                <div className='flex flex-col gap-1'>
                <h1 className='text-4xl font-bold'>{sala.name}</h1>
                <p className='text-sm text-white/50'>Criado por {sala.authorName} e editado pela última vez em {format(sala.editedAt.toDate(), "dd/MM/yyyy")}</p>
                </div>
              </div>
              <DataTable columns={columns} data={alunosProcessados} setSelectedDate={setSelectedDate}  />
            </div>
            <span className='absolute select-none overflow-hidden h-screen right-0 -top-0 [font-size:_clamp(100px,100vw,480px)] opacity-[2.5%]'>{sala.tag}</span>
          </section>
        ) : (
          <div className='w-full min-h-screen flex items-center justify-center md:pl-[352px]'>                
            <Image className='w-[50px] animate-ping' src="/logo.svg" height={600} width={600} alt='no more papers' />
          </div>
        )}
      </main>
    </div>
  );
}
