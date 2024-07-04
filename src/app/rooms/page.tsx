'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import firebase from 'firebase/compat/app';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import Image from 'next/image';
import { SalaCard } from '@/components/salacard/salacard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileInput } from "@/components/btn-dragandropfile/dd-btn";
import { Sidebar } from "@/components/sidebar/sidebar";
import Link from "next/link";
import { MdArrowOutward } from "react-icons/md";
import EmojiPicker from "@emoji-mart/react";
import EmoticonPicker from "@/components/emojiPicker/emojiPicker";
import { db } from "../firebase";
import { Timestamp, addDoc, collection, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSala } from '../SalasContext';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [filePresent, setFilePresent] = useState(false); 
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { salas, fetchSalas } = useSala();

  useEffect(() => {
    fetchSalas();
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const FormSchema = z.object({
    nameSala: z.string()
      .min(1, "Insira um nome para sua sala")
      .min(3, "O nome da sala deve ter pelo menos 5 caracteres")
      .max(30, "O nome da sala deve ter no máximo 50 caracteres"),
    tagSala: z.string(),
    csvData: z.any().refine(() => filePresent, {
      message: "Por favor, importe uma tabela CSV com os dados dos alunos",
    })
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      nameSala: "",
      tagSala: "💢",
      csvData: "",
    },
  });

  useEffect(() => {
    fetchSalas();
  }, []);


  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    const tagSala = document.getElementById("tagSala") as HTMLInputElement;
    const sala = {
      name: data.nameSala,
      tag: tagSala.value,
      alunos: csvData,
      authorId: user?.uid,
      authorName: user?.displayName,
      createdAt: new Date(),
      editedAt: new Date(),
    };

    console.log(sala);
    console.table(csvData);

    try {
      const docRef = await addDoc(collection(db, "salas"), sala);
      console.log("Document written with ID: ", docRef.id);
      toast({
        title: "Sala criada com sucesso!",
        description: "Sua sala foi criada e está disponível.",
      });
      await fetchSalas();
       // Atualizar a lista de salas após criar a nova sala
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        title: "Erro ao criar sala",
        description: "Ocorreu um erro ao tentar criar a sala. Tente novamente mais tarde.",
                variant: "destructive", 
      });
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }
  };

  useEffect(() => {
    if (!isDialogOpen) {
      // Resetar o formulário e o estado do arquivo CSV quando o diálogo for fechado
      form.reset();
      setCsvData([]);
      setFilePresent(false);
    }
  }, [isDialogOpen, form]);

  const filteredSalas = salas.filter(
    sala =>
      sala.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyPress = (e: { key: string; preventDefault: () => void; }) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <main className="flex w-full min-h-screen items-center justify-center">
      {user && !loading ? (
        <section className="w-full flex h-full min-h-screen items-start justify-center pt-24 py-10 md:py-10 md:pt-10 pb-6 md:pl-[352px] px-8">
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
              <div className='flex w-full items-center justify-between '>
                <h2 className='text-2xl font-medium'>Todas salas</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <button className='w-10 h-10 ring-white/20 ring-1 hover:bg-white/15 transition-colors hover:ring-white/30 hover:text-white/80 bg-white/10 text-white/70 rounded-lg text-xs flex items-center justify-center gap-2 '>
                      <a>+</a>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px] items-center flex flex-col py-10 max-w-[395px] rounded-lg">
                    <Form {...form}>
                      <DialogHeader className='items-start text-start'>
                        <DialogTitle>Adicionar Sala</DialogTitle>
                        <DialogDescription>
                          Dê um nome a sua sala, importe sua tabela alunos e crie sua sala!
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex pt-2 flex-col w-full">
                      <div className="flex flex-row w-full gap-2">
                        <FormField
                          control={form.control}
                          name="nameSala"
                          render={({ field }) => (
                            <FormItem className=" flex flex-col gap-2 w-full">
                              <FormLabel className="">Nome</FormLabel>
                              <FormControl>
                                <Input {...field} id="nameSala" placeholder='Sala 1' className="" />
                              </FormControl>
              
                            </FormItem>
                          )}
                        />
                        <div className="flex flex-col gap-4 w-full max-w-12">
                          <Label htmlFor="tagSala" className="text-center select-none opacity-0">
                            Tag
                          </Label>
                          <EmoticonPicker />
                        </div>
                        </div>
                        <FormMessage className="mt-2">{form.formState.errors.nameSala?.message}</FormMessage>
                      </div>
                      
                      <DialogHeader className="items-start pt-4 text-start w-full">
                        <DialogTitle>Importar Alunos</DialogTitle>
                        <DialogDescription>
                          Importe uma tabela CSV com os dados dos alunos para a sala.
                        </DialogDescription>
                      </DialogHeader>

                      <FormField
                        control={form.control}
                        name="csvData"
                        render={({ field }) => (
                          <FormItem className="flex flex-col w-full">
                            <FormControl>
                              <FileInput setCsvData={setCsvData} setFilePresent={setFilePresent} {...field} />
                            </FormControl>
                            <FormMessage>{form.formState.errors.csvData?.message as string}</FormMessage>
                          </FormItem>
                        )}
                      />
                    
                      <DialogFooter className="w-full flex">
                        <Button className="hover:bg-white/80 flex mt-4 self-end" type="submit" onClick={form.handleSubmit(onSubmit)}>
                          {isSubmitting ? 'Criando Sala' : 'Criar Sala'}
                        </Button>
                      </DialogFooter>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              <form>
                <Input
                  className='w-full px-5 py-4 rounded-lg bg-transparent ring-1 ring-white/20 placeholder:text-white/20'
                  placeholder={`Buscar Sala`}
                  value={searchTerm}
                  onKeyDown={handleKeyPress}
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
        <div className="w-full min-h-screen items-center justify-center flex md:pl-[352px] px-8">
          <Image className='w-[50px] animate-ping' src="/logo.svg" height={600} width={600} alt='no more papers' />
        </div>
      )}
    </main>
  );
}
