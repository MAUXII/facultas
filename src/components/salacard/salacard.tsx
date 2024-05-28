import Link from "next/link"
import Image from 'next/image'
import { useState } from "react";
import { db } from '../../app/firebase'; // Certifique-se de que o caminho esteja correto
import { doc, deleteDoc, updateDoc } from "firebase/firestore";

type SalaCardProps = {
    title: string, 
    text: number,
    emoji:string
    link: string,
    key: string,
    home?: boolean,
    editedAt?: string,
}
import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
  } from "@/components/ui/context-menu"
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Button } from '@/components/ui/button';
  import { DialogClose } from '@radix-ui/react-dialog';
  import { MdDeleteForever } from "react-icons/md";
  import { RiEdit2Fill } from "react-icons/ri";
  import { TbListDetails } from "react-icons/tb";
  import EmoticonPicker from "../emojiPicker/emojiPicker";


  
export const SalaCard = (card: SalaCardProps) =>{
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newTitle, setNewTitle] = useState(card.title); // Estado para o novo título
    const newEmoji = useState(card.title); // Estado para o novo título
    const handleDelete = async () => {
        
        try {
            setIsSubmitting(true)
            console.log(card.link)
            const salaDocRef = doc(db, 'salas', card.link);
            await deleteDoc(salaDocRef);
            console.log("Sala deletada com sucesso.");
            window.location.reload()
        } catch (error) {
            console.error("Erro ao deletar a sala: ", error);
        }
    };

    const handleEdit = async () => {
        const tagSala = document.getElementById("tagSala") as HTMLInputElement;
        try {
            console.log(newTitle)
            console.log(tagSala.value)
            const salaDocRef = doc(db, 'salas', card.link);
            await updateDoc(salaDocRef, {
                name: newTitle,
                tag: tagSala.value,
            });
            console.log("Sala editada com sucesso.");
            window.location.reload()

        } catch (error) {
            console.error("Erro ao editar a sala: ", error);
        }
    };

    return(
        <ContextMenu>
            <ContextMenuTrigger className="w-full overflow-clip relative h-[225px] min-w-full md:min-w-[350px]  [flex: 1 0 0;] flex-1 pb-10 sm:pb-20 flex justify-center bg-cover flex-col p-5 gap-2 bg-transparent ring-1 rounded-lg ring-white/20 hover:bg-[#0E0E0E] transition-colors">
            <Link key={card.key} className="w-full  flex-1  flex justify-center bg-cover flex-col gap-2 bg-transparent transition-colors" href={`/rooms/${card.link}`}>
            <h3 className="font-semibold z-[100] text-xl w-full max-w-[200px]">{card.title}</h3>
            <div className="flex flex-col h-full justify-between">
            <p className="text-xs z-[100] text-[#B1B1B1]">{card.text} Alunos nessa sala</p>
            </div>
            <span className="text-[185px] absolute top-0 right-0 opacity-25">{card.emoji}</span>
            <Image className="absolute opacity-30 -bottom-20 -left-40" src="/ccchaos.svg" width={1000} height={1000} alt="Card Background"/>

        </Link>
            </ContextMenuTrigger>
        <ContextMenuContent className={`z-[250] p-0 dark:bg-black/50 `}>
            <div className="flex flex-col w-full">
                <div className="flex flex-col  items-center  ">
                    <button onClick={handleDelete}  className={`${card.home?"hidden":"flex"} border-b-[0.25px] border-white/10 backdrop-blur-md flex gap-2 bg-red-600/10 hover:bg-red-800/20 transition-colors items-centertion-colors  hover:text-red-600 px-6 py-4 w-full text-red-500 items-center`}>
                    <MdDeleteForever className="text-xl"/> <span className="font-medium text-sm">Deletar Sala</span>
                    </button>
                    <Link href={`/rooms/${card.link}`} className={`${card.home?"flex":"flex"} border-b-[0.25px] border-white/10 flex gap-2 backdrop-blur-md hover:text-white/80 hover:bg-neutral-900/20 bg-neutral-900/10 transition-colors  px-6 py-4 w-full items-center `}>
                    <TbListDetails className="text-xl"/> <span className="font-medium text-sm">Ver Detalhes</span>
                    </Link>
      <Dialog>
      <DialogTrigger asChild>
      <button className={`${card.home?"hidden":"flex"} backdrop-blur-md flex gap-2 bg-blue-600/10 hover:bg-blue-800/20 transition-colors  hover:text-blue-600 px-6 py-4 w-full text-blue-500 items-center`}>
                    <RiEdit2Fill className="text-xl"/> <span className="font-medium text-sm">Editar Sala</span>
                    </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[525px] z-[260] items-center  flex flex-col py-10 max-w-[440px] rounded-lg">
      <form>
        <DialogHeader className='items-start'>
          <DialogTitle>Editar Sala</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when youre done.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-row w-full flex-1 gap-2 py-4">
          <div className="flex flex-col gap-4 w-full">
            <Label htmlFor="nameSala" className="">
              Nome
            </Label>
            
            <Input
              id="nameSala"
              className=""
              placeholder={card.title}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="flex  flex-col gap-4 w-full max-w-12">
            <Label htmlFor="tagSala" className="text-center select-none opacity-0">
              TAG
            </Label>
            
            <EmoticonPicker valor={card.emoji}/>

          </div>
          
        </div>
        
        <DialogFooter>
       <DialogClose>
       <Button onClick={handleEdit} className="hover:bg-white/80">{isSubmitting ? 'Enviando' : 'Editar Sala'}</Button>
        </DialogClose>
        </DialogFooter>
        </form>
      </DialogContent>
      
    </Dialog>
                    
                </div>

            </div>
        </ContextMenuContent>
        
        
        </ContextMenu>
    )
}