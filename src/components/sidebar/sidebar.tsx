'use client'

import Image from "next/image"
import Link from "next/link";
import { MdArrowOutward, MdLogout } from "react-icons/md";
import { RiHomeLine } from "react-icons/ri";
import { SidebarLink } from "./sidebarlink";
import { MdOutlineMeetingRoom } from "react-icons/md";
import { MdHistory } from "react-icons/md";
import { useAuthState } from 'react-firebase-hooks/auth'; // Importe o hook useAuthState do react-firebase-hooks/auth
import { auth, db, signOut } from '../../app/firebase'; // Importe a instância 'auth' do arquivo firebase.ts
import { usePathname } from "next/navigation";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

  import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
  

import { RoomLink } from "./roomlink";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { RiMenu4Fill } from "react-icons/ri";
import { Timestamp, collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton"
import { useSala } from '../../app/SalasContext';
import { toast } from "../ui/use-toast";

interface SalaData {
    authorId: string;
    name: string;
    link: string;
    id: string;
    editedAt: Timestamp;
    createdAt: Timestamp;
  }

export const Sidebar=()=>{
  const { fetchSalas, salas } = useSala();
    const [isOpen, setIsOpen] = useState(true);
    const [user, loading, error] = useAuthState(auth);
    const pathname = usePathname()
    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({
              title: "Usuário deslogado.",
              description: "Você saiu da sua conta, volte sempre.",
            });
      
            
        } catch (error) {
          toast({
            title: "Erro ao deslogar.",
            description: "Ocorreu um erro ao tentar sair da sua conta. Tente novamente mais tarde.",
                    variant: "destructive", 
          });
        }
    };

  useEffect(() => {
    fetchSalas();
  }, []);

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

      const isAuthPath = pathname === '/auth/login' || pathname === '/auth/cadastro';

      const truncateText = (text: string, maxLength: number) => {
        if (text.length > maxLength) {
          return text.substring(0, maxLength) + '...';
        }
        return text;
      };
      
    return(
        <div className={`${isAuthPath ? 'hidden' : ''}`}>
        <aside className="min-h-screen md:block hidden h-full w-full max-w-[320px] min-w-[320px] fixed top-0 bottom-0 dark:bg-black left-0 border-r border-white/10 px-5 py-6 ">
            <div className="flex h-full flex-col justify-between">
                <div className="flex flex-col gap-6">
                <header className="flex flex-col">
                    <div className="flex items-center gap-5">
                        <div className="min-w-[45px] rounded-md h-[45px] flex items-center justify-center bg-[#0B0B0B] ring-1 ring-white/20">
                            <Image src="/logo.svg" alt="Logo PRTrack" width={29} height={30}/>
                        </div>
                        <div className="flex w-full justify-between items-center">
                            <div className="flex flex-col">
                                <p className="text-sm font-semibold">{user ? ` ${user.displayName || 'Usuário'}` : <Skeleton className="h-4 mb-2 w-[100px]" />}</p>
                                <p className="text-[11px] text-white/40">
      {user ? ` ${truncateText(user.email || 'Usuário', 24)}` : <Skeleton className="h-4 w-[150px]" />}
    </p>
                            </div>
                            <button onClick={handleLogout}  className="flex rounded-lg items-center p-[10px] hover:bg-white/5 hover:ring-1 hover:ring-white/20 transition-colors justify-center">
                            <MdLogout className="text-lg text-white flex-1" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col gap-3">
                    <SidebarLink title="Home" icon={<RiHomeLine/>} url="/" />
                    <SidebarLink title="Salas" icon={<MdOutlineMeetingRoom/>} url="/rooms" />
                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                     <AccordionTrigger className="w-full [&[data-state=open]]:hover:ring-white/0 [&[data-state=open]]:rounded-bl-none [&[data-state=open]]:bg-white/5 h-[60px] hover:ring-white/10 hover:ring-1 hover:bg-white/5 transition-colors rounded-md px-3 py-2 flex gap-4 items-center group ${link.isActive? 'bg-white/5 ring-white/10 active:bg-white/5">
                     <div className="transition-colors flex gap-4 group-hover:text-white/80">
                     <MdHistory className="text-xl transition-colors"/>
           
                    <span className="font-medium text-sm transition-colors group-hover:text-white/80">
                        Recentes
                    </span>
                </div>
                        </AccordionTrigger>
                    <AccordionContent className="px-6 pt-4 pb-4  h-fit relative flex flex-col justify-between gap-3 ">
                    <div className="w-[2px] h-full absolute left-0 top-0 bg-white/5"></div>                     
                    {salas && salas.length > 0 ? (
                    salas
                     .sort((a, b) => b.editedAt.toDate().getTime() - a.editedAt.toDate().getTime()) // Convertendo timestamp para Date com toDate() antes de subtrair
                     .slice(0, 5) // Limita aos três primeiros elementos
                     .map((sala) => (
                       <RoomLink
                         key={sala.id}
                         title={sala.name}
                         link={sala.id}
                       />
                     ))
                     
                     ) : (
  <p className="w-full text-start text-white/60">Nenhuma sala ainda</p>
)}
                    </AccordionContent>
                    </AccordionItem>
                    </Accordion>
                </div>

                </div>
                <div className="h-fit w-full relative">
                <button onClick={handleClose} className={`absolute z-[99] ring-1 ring-white/20 top-0 right-0 translate-x-2 text-xs -translate-y-3 bg-black rounded-full h-6 w-6 flex items-center justify-center hover:text-white/80  text-white rounded ${isOpen? "flex" : "hidden"}`}>
                x
                </button>
                <footer className={`flex bg-custom-gradient  flex-col overflow-clip relative py-5 h-[180px] ring-1 ring-white/20 px-4 pr-[100px] gap-5 rounded-lg ${isOpen? 'flex' : 'hidden'}`}>
                
                    <div className="flex flex-col gap-0">
                    <h3 className="text-sm font-semibold">Caso queira ajudar!</h3>
                    <p className="text-[#C1C1C1] text-xs">Todo suporte é de grande ajuda, me pagaria um cafézin? ☕</p>
                    </div>
                    <Link className="text-xs items-center flex gap-2 group hover:text-white/80  transition-colors" href = "https://www.patreon.com/maumaudev/membership" >
                Ajudar
                <MdArrowOutward className="transition-all" />
               </Link>
               <Image className="absolute w-[200px] top-0 right-[-20px] select-none" src="/ondulate.svg" alt="" width={200} height={200}/>
                </footer>
                <button onClick={handleOpen} className={`relative group z-[99] ring-1 ring-white/20  text-xs bg-black rounded-full h-10 w-10 flex items-center justify-center   text-white rounded ${isOpen? "hidden" : "flex"}`}>
                ☕
                <p className="absolute opacity-0 group-hover:opacity-100 transition-all top-0 right-0 translate-x-2 -translate-y-2">?</p>
                </button>
                </div>
            </div>
        </aside>
    
        <Sheet key="left">
          <SheetTrigger asChild className="absolute flex md:hidden left-8 top-20 -translate-y-12">
            <button className="flex items-center justify-center"><RiMenu4Fill className="text-3xl" /></button>
          </SheetTrigger>
          <SheetContent className="z-[300] ring-white/20 border-white/20 w-full sm:max-w-[320px]" side="left">
          <div className="flex h-full pt-8 flex-col justify-between ">
                <div className="flex flex-col gap-6">
                <header className="flex flex-col">
                    <div className="flex items-center gap-5">
                        <div className="min-w-[45px] rounded-md h-[45px] flex items-center justify-center bg-[#0B0B0B] ring-1 ring-white/20">
                            <Image src="/logo.svg" alt="Logo PRTrack" width={29} height={30}/>
                        </div>
                        <div className="flex w-full justify-between items-center">
                            <div className="flex flex-col">
                                <p className="text-sm font-semibold">{user ? ` ${user.displayName || 'Usuário'}` : ''}</p>
                                <p className="text-[11px] text-white/40">{user ? ` ${user.email || 'Usuário'}` : ''}</p>
                            </div>
                            <button onClick={handleLogout}  className="flex rounded-lg items-center p-[10px] hover:bg-white/5 hover:ring-1 hover:ring-white/20 transition-colors justify-center">
                            <MdLogout className="text-lg text-white flex-1" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col gap-3">
                    <SidebarLink title="Home" icon={<RiHomeLine/>} url="/" />
                    <SidebarLink title="Salas" icon={<MdOutlineMeetingRoom/>} url="/rooms" />
                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                     <AccordionTrigger className="w-full [&[data-state=open]]:hover:ring-white/0 [&[data-state=open]]:rounded-bl-none [&[data-state=open]]:bg-white/5 h-[60px] hover:ring-white/10 hover:ring-1 hover:bg-white/5 transition-colors rounded-md px-3 py-2 flex gap-4 items-center group ${link.isActive? 'bg-white/5 ring-white/10 active:bg-white/5">
                     <div className="transition-colors flex gap-4 group-hover:text-white/80">
                     <MdHistory className="text-xl transition-colors"/>
           
                    <span className="font-medium text-sm transition-colors group-hover:text-white/80">
                        Recentes
                    </span>
                </div>
                        </AccordionTrigger>
                    <AccordionContent className="px-6 pt-4 pb-4 h-fit relative flex flex-col gap-3 ">
                    <div className="w-[2px] h-full absolute left-0 top-0 bg-white/5"></div>                 
                        {salas && salas.length > 0 ? (
                    salas
                     .sort((a, b) => b.editedAt.toDate().getTime() - a.editedAt.toDate().getTime()) // Convertendo timestamp para Date com toDate() antes de subtrair
                     .slice(0, 5) // Limita aos três primeiros elementos
                     .map((sala) => (
                       <RoomLink
                         key={sala.id}
                         title={sala.name}
                         link={sala.id}
                       />
                     ))
                     
                     ) : (
  <p className="w-full text-start text-white/60">Nenhuma sala ainda</p>
)}
                    </AccordionContent>
                    </AccordionItem>
                    </Accordion>
                </div>

                </div>
                <div className="h-fit w-full relative">
                <button onClick={handleClose} className={`absolute z-[99] ring-1 ring-white/20 top-0 right-0 translate-x-2 text-xs -translate-y-3 bg-black rounded-full h-6 w-6 flex items-center justify-center hover:text-white/80  text-white rounded ${isOpen? "flex" : "hidden"}`}>
                x
                </button>
                <footer className={`flex bg-custom-gradient flex-col overflow-clip relative py-5 h-[180px] ring-1 ring-white/20 px-4 pr-[100px] gap-5 rounded-lg ${isOpen? 'flex' : 'hidden'}`}>
                
                    <div className="flex flex-col gap-0">
                    <h3 className="text-sm font-semibold">Caso queira ajudar!</h3>
                    <p className="text-[#C1C1C1] text-xs">Todo suporte é de grande ajuda, me pagaria um cafézin? ☕</p>
                    </div>
                    <Link className="text-xs items-center flex gap-2 group hover:text-white/80  transition-colors" href = "https://www.patreon.com/maumaudev/membership" >
                Ajudar
                <MdArrowOutward className="transition-all" />
               </Link>
               <Image className="absolute w-[200px] top-0 right-[-20px] select-none" src="/ondulate.svg" alt="" width={200} height={200}/>
                </footer>
                <button onClick={handleOpen} className={`relative group z-[99] ring-1 ring-white/20  text-xs bg-black rounded-full h-10 w-10 flex items-center justify-center   text-white rounded ${isOpen? "hidden" : "flex"}`}>
                ☕
                <p className="absolute opacity-0 group-hover:opacity-100 transition-all top-0 right-0 translate-x-2 -translate-y-2">?</p>
                </button>
                </div>
            </div>
          </SheetContent>
        </Sheet>
        <div/> 
            </div>
    )
}