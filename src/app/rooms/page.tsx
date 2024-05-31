'use client'

import { TbDatabaseImport } from "react-icons/tb";
import { TbTableImport } from "react-icons/tb";

import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import firebase from 'firebase/compat/app'; // Importe o Firebase compatível com v9
import { useAuthState } from 'react-firebase-hooks/auth'; // Importe o hook useAuthState do react-firebase-hooks/auth
import { auth } from '../firebase'; // Importe a instância 'auth' do arquivo firebase.ts
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
import EmojiPicker from "@emoji-mart/react";
import EmoticonPicker from "@/components/emojiPicker/emojiPicker";
import { db } from "../firebase";
import { Timestamp, addDoc, collection, getDocs } from "firebase/firestore";
import { format } from "date-fns";

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
  const [csvData, setCsvData] = useState<any[]>([]);
  const [text, setText] = useState(""); 
  const [user, loading, error] = useAuthState(auth);
  const [salas, setSalas] = useState<SalaData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Novo estado para o termo de busca

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    setIsSubmitting(true);
    console.log('foiii')
    event.preventDefault();
    const nameSala = document.getElementById("nameSala") as HTMLInputElement;
    const tagSala = document.getElementById("tagSala") as HTMLInputElement;

    if (nameSala && tagSala && csvData) {
      const sala = {
        name: nameSala.value,
        tag: tagSala.value,
        alunos: csvData,
        authorId: user?.uid,
        authorName: user?.displayName,
        createdAt: new Date(),
        editedAt: new Date(),
      };
      console.log(sala);
      console.table(csvData)

      try {
        const docRef = await addDoc(collection(db, "salas"), sala);
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
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
        console.error('Error fetching salas: ', error);
      }
    };

    fetchData();
  }, [user]);

  const filteredSalas = salas.filter(
    sala =>
      sala.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex w-full min-h-screen items-center justify-center ">
      {user && !loading ? (
        <section className="w-full flex h-full min-h-screen items-start justify-center pt-[85px] pb-6 md:pl-[352px] px-8">
          <div className="w-full relative flex flex-col gap-12 justify-center max-w-[900px]">
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
                <h2 className='text-2xl font-medium'>Todas salas</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className='w-10 h-10 ring-white/20 ring-1 hover:bg-white/15 transition-colors hover:ring-white/30 hover:text-white/80 bg-white/10 text-white/70 rounded-lg text-xs flex items-center justify-center gap-2 '>
                      <a>+</a>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px] items-center flex flex-col py-10 max-w-[440px] rounded-lg">
                    <form onSubmit={handleSubmit}>
                      <DialogHeader className='items-start'>
                        <DialogTitle>Adicionar Sala</DialogTitle>
                        <DialogDescription>
                          Make changes to your profile here. Click save when youre done.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-row w-full flex-1 gap-2 py-4">
                        <div className="flex flex-col gap-4 w-full">
                          <Label htmlFor="nameSala" className="">
                            Nome
                          </Label>
                          <Input id="nameSala" placeholder='Sala 1' className="" />
                        </div>
                        <div className="flex flex-col gap-4 w-full max-w-12">
                          <Label htmlFor="tagSala" className="text-center select-none opacity-0">
                            TAG
                          </Label>
                          <EmoticonPicker />
                        </div>
                      </div>
                      <DialogHeader className="items-start">
                        <DialogTitle>Importar Alunos</DialogTitle>
                        <DialogDescription>
                          Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-8 py-4">
                        <div className="flex flex-col gap-4">
                          <FileInput setCsvData={setCsvData} />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose>
                          <Button type="submit" onClick={() => window.location.reload()} className="hover:bg-white/80">
                            {isSubmitting ? 'Enviando' : 'Criar Sala'}
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <form>
                <Input
                  className='w-full px-5 py-4 rounded-lg bg-transparent ring-1 ring-white/20 placeholder:text-white/20'
                  placeholder={`Buscar Sala`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
              <div className='salas flex flex-wrap self-stretch flex-grow items-center content-center gap-5'>
                {filteredSalas && filteredSalas.length > 0 ? (
                  filteredSalas
                    .sort((a, b) => b.editedAt.toDate().getTime() - a.editedAt.toDate().getTime())
                    .map((sala) => (
                      <SalaCard
                        key={sala.id}
                        title={sala.name}
                        text={sala.alunos.length}
                        link={sala.id}
                        emoji={sala.tag}
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
        <div className="w-full min-h-screen items-center justify-center flex md:pl-[352px] px-8">
          <Image className='w-[50px] animate-ping' src="/logo.svg" height={600} width={600} alt='no more papers' />
        </div>
      )}
    </main>
  );
}
