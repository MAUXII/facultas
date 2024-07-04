import Link from "next/link"
import Image from 'next/image'
import { useState } from "react";
import { db } from '../../app/firebase'; // Certifique-se de que o caminho esteja correto
import { doc, deleteDoc, updateDoc } from "firebase/firestore";

type SalaCardProps = {
    title: string, 
    text: number,
    emoji: string,
    link: string,
    key: string,
    home?: boolean,
    editedAt?: string,
    fetchSalas: () => void;
}

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@radix-ui/react-dialog';
import { MdDeleteForever } from "react-icons/md";
import { RiEdit2Fill } from "react-icons/ri";
import { TbListDetails } from "react-icons/tb";
import EmoticonPicker from "../emojiPicker/emojiPicker";
import { toast } from "../ui/use-toast";
import { useSala } from "@/app/SalasContext";

export const SalaCard = ({ title, text, emoji, link, key, home, editedAt, }: SalaCardProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTitle, setNewTitle] = useState(title);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { fetchSalas } = useSala();

    const handleDelete = async () => {
        try {
            setIsSubmitting(true);
            const salaDocRef = doc(db, 'salas', link);
            await deleteDoc(salaDocRef);
            toast({
                title: "Sala deletada com sucesso!",
                description: "Sua sala foi deletada e não está mais disponível.",
            });
            fetchSalas();
        } catch (error) {
            toast({
                title: "Erro ao deletar a sala",
                description: "Ocorreu um erro ao deletar sua sala",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const tagSala = document.getElementById("tagSala") as HTMLInputElement;
            const salaDocRef = doc(db, 'salas', link);
            await updateDoc(salaDocRef, {
                name: newTitle,
                tag: tagSala.value,
            });
            toast({
                title: "Sala editada com sucesso",
                description: "Sua sala foi editada e está disponível",
            });
            fetchSalas();
        } catch (error) {
            toast({
                title: "Erro ao editar a sala",
                description: "Ocorreu um erro ao editar sua sala",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setIsDialogOpen(false);
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger className="w-full overflow-clip relative h-[225px] min-w-full md:min-w-[350px] flex-1 pb-10 sm:pb-20 flex justify-center bg-cover flex-col p-5 gap-2 bg-transparent ring-1 rounded-lg ring-white/20 hover:bg-[#0E0E0E] transition-colors">
                <Link key={key} className="w-full flex-1 flex justify-center bg-cover flex-col gap-2 bg-transparent transition-colors" href={`/rooms/${link}`}>
                    <h3 className="font-semibold z-[100] text-xl w-full max-w-[200px]">{title}</h3>
                    <div className="flex flex-col h-full justify-between">
                        <p className="text-xs z-[100] text-[#B1B1B1]">{text} Alunos nessa sala</p>
                    </div>
                    <span className="text-[185px] absolute top-0 right-0 opacity-25">{emoji}</span>
                    <Image className="absolute select-none drag-none opacity-30 -bottom-20 -left-40" src="/ccchaos.svg" width={1000} height={1000} alt="Card Background" />
                </Link>
            </ContextMenuTrigger>
            <ContextMenuContent className="z-[250] p-0 dark:bg-black/50">
                <div className="flex flex-col w-full">
                    <div className="flex flex-col items-center">
                        <button onClick={handleDelete} className={`${home ? "hidden" : "flex"} border-b-[0.25px] border-white/10 backdrop-blur-md flex gap-2 bg-red-600/10 hover:bg-red-800/20 transition-colors items-center hover:text-red-600 px-6 py-4 w-full text-red-500`}>
                            <MdDeleteForever className="text-xl" /> <span className="font-medium text-sm">Deletar Sala</span>
                        </button>
                        <Link href={`/rooms/${link}`} className={`${home ? "flex" : "flex"} border-b-[0.25px] border-white/10 flex gap-2 backdrop-blur-md hover:text-white/80 hover:bg-neutral-900/20 bg-neutral-900/10 transition-colors px-6 py-4 w-full items-center`}>
                            <TbListDetails className="text-xl" /> <span className="font-medium text-sm">Ver Detalhes</span>
                        </Link>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <button className={`${home ? "hidden" : "flex"} backdrop-blur-md flex gap-2 bg-blue-600/10 hover:bg-blue-800/20 transition-colors hover:text-blue-600 px-6 py-4 w-full text-blue-500 items-center`}>
                                    <RiEdit2Fill className="text-xl" /> <span className="font-medium text-sm">Editar Sala</span>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[525px] z-[260] items-center flex flex-col py-10 max-w-[440px] rounded-lg">
                                <form className="w-full">
                                    <DialogHeader className='items-start'>
                                        <DialogTitle>Editar Sala</DialogTitle>
                                        <DialogDescription>
                                            Edite o nome ou a tag da sala.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-row w-full flex-1 gap-2 py-4">
                                        <div className="flex flex-col gap-4 w-full">
                                            <Label htmlFor="nameSala">Nome</Label>
                                            <Input
                                                id="nameSala"
                                                placeholder={title}
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-4 w-full max-w-12">
                                            <Label htmlFor="tagSala" className="text-center select-none opacity-0">TAG</Label>
                                            <EmoticonPicker valor={emoji} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose>
                                            <Button onClick={handleEdit} className="hover:bg-white/80">{isSubmitting ? 'Editando' : 'Editar Sala'}</Button>
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
};
