"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { SalaData } from "../page";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { useParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { differenceInDays } from 'date-fns';
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import { IoCheckmarkSharp } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import Draggable from 'react-draggable'; 
import { toast } from "@/components/ui/use-toast";

export interface Presence {
    status: number;
    createdAt: Date;
    editedAt: Date;
}

type AlunoData = {
    id: string
    nome: string
    RA: string
    presenca: Presence[];
}

interface Aluno extends AlunoData {}
interface SalaDados extends SalaData {}



interface DataTableProps {
  columns:  ColumnDef<AlunoData, any>[];
  data: AlunoData[];
  setSelectedDate: (date: Date | null) => void;
}

const eventLogger = (e: MouseEvent, data: Object) => {

  };
  
  export function DataTable({ columns, data, setSelectedDate }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'Nome', desc: false }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [selectedDate, setDate] = useState<Date | null>(null);
    const { id } = useParams();
    const [acesso, setAcesso] = useState(false);
    const [user, loading, error] = useAuthState(auth);
    const [notFound, setNotFound] = useState(false);
    const [salaCreatedAt, setSalaCreatedAt] = useState<Date | null>(null);
    const [isSelected, setIsSelected] = useState(false);
    const [isDraggableVisible, setIsDraggableVisible] = useState(false);
    const [alunosData, setAlunosData] = useState<AlunoData[]>(data);
    const [combinedData, setCombinedData] = useState<AlunoData[]>([]);



    
    useEffect(() => {
      const updateCombinedData = () => {
        if (selectedDate) {
          const filteredData = alunosData.map(aluno => {
            const filteredPresenca = aluno.presenca.filter(presenca => {
              const createdAtDate = timestampToDate(presenca.createdAt);
              return createdAtDate.toDateString() === selectedDate.toDateString();
            });
            return { ...aluno, presenca: filteredPresenca };
          });
          setCombinedData(filteredData);
        } else {
          setCombinedData(alunosData);
        }
      };
  
      updateCombinedData();
    }, [selectedDate, alunosData]);
  

  useEffect(() => {
    const fetchSala = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, 'salas', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as SalaData;
          setSala(data);

          if (user && data && user.uid === data.authorId) {
            setAcesso(true);
          } else {
            setAcesso(false);
          }

          setSalaCreatedAt(data.createdAt.toDate());
        } else {
          setNotFound(true);
        }
      } catch (error) {
      }
    };

    fetchSala();
  }, [id, user]);
  
  function timestampToDate(timestamp: { seconds: any; nanoseconds: any; } | Date) {
    if (timestamp instanceof Date) {
        return timestamp;
    } else {
        const seconds = timestamp.seconds;
        const nanoseconds = timestamp.nanoseconds;
        return new Date(seconds * 1000 + nanoseconds / 1000000);
    }
}
  
const updateAttendanceStatus = async (statusValue: number, selectedDate: Date | null, id: string | undefined, table: any) => {
  const now = new Date();
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  let updatedAlunos: Aluno[] = [];

  for (const row of selectedRows) {
      const aluno = row.original as Aluno | undefined;
      if (!aluno) continue;

      const alunoRA = aluno.RA;
      const salaDocRef = doc(db, 'salas', id as string);
      const salaDocSnap = await getDoc(salaDocRef);

      if (salaDocSnap.exists()) {
          const salaData = salaDocSnap.data() as SalaData;
          const alunoIndex = salaData.alunos.findIndex(aluno => aluno.RA === alunoRA);

          if (alunoIndex !== -1) {
              let alunoPresenca = salaData.alunos[alunoIndex].presenca || [];

              const existingPresencaIndex = alunoPresenca.findIndex(presenca => {
                  const presencaDate = presenca.createdAt instanceof Date
                      ? presenca.createdAt
                      : timestampToDate(presenca.createdAt);
                  return presencaDate.toDateString() === selectedDate?.toDateString();
              });

              if (existingPresencaIndex !== -1) {
                  alunoPresenca[existingPresencaIndex].status = statusValue;
                  alunoPresenca[existingPresencaIndex].editedAt = now;
              } else {
                  alunoPresenca.push({
                      status: statusValue,
                      createdAt: selectedDate ?? now,
                      editedAt: now
                  });
              }

              salaData.alunos[alunoIndex].presenca = alunoPresenca;
              updatedAlunos.push(salaData.alunos[alunoIndex]);

              try {
                  await updateDoc(salaDocRef, { alunos: salaData.alunos });
                  await updateDoc(doc(db, 'salas', id as string), { editedAt: now });
              } catch (error) {
                  toast({
                      title: `Erro ao atualizar os status`,
                      description: `Ocorreu algum erro ao atualizar os status dos RA's selecionados`,
                      variant: `destructive`,
                  });
              }
          } else {
              toast({
                  title: `Erro ao atualizar os status`,
                  description: `Ocorreu algum erro ao atualizar os status dos RA's selecionados`,
                  variant: `destructive`,
              });
          }
      } else {
          toast({
              title: `Erro ao atualizar os status`,
              description: `Ocorreu algum erro ao atualizar os status dos RA's selecionados`,
              variant: `destructive`,
          });
      }
  }

  toast({
      title: `Status atualizados com sucesso`,
      description: `Os status dos RA's selecionados foram atualizados com sucesso`,
  });
  
  setAlunosData(prevData => {
    return prevData.map(aluno => {
      const updatedAluno = updatedAlunos.find(updated => updated.RA === aluno.RA);
      return updatedAluno ? updatedAluno : aluno;
    });
  });

  return updatedAlunos;
};

const filteredData = alunosData.map(aluno => {
  const filteredPresenca = aluno.presenca.filter(presenca => {

    const createdAtDate = presenca.createdAt instanceof Date
      ? presenca.createdAt
      : timestampToDate(presenca.createdAt); 

    return createdAtDate.toDateString() === selectedDate?.toDateString();
  });

  return { ...aluno, presenca: filteredPresenca };
});


const updateTableData = () => {
  const filteredData = alunosData.map(aluno => {
    const filteredPresenca = aluno.presenca.filter(presenca => {
      
      const createdAtDate = timestampToDate(presenca.createdAt);
      return createdAtDate.toDateString() === selectedDate?.toDateString();
    });
    return { ...aluno, presenca: filteredPresenca };
  });
  setCombinedData(filteredData);
};

useEffect(() => {
  if (selectedDate) {
    updateTableData();
  } else {
    setAlunosData(data); // Reset to initial data if no date is selected
  }
}, [selectedDate, data]);

const handleUpdateAttendanceStatus = async (statusValue: number) => {
  const idString = Array.isArray(id) ? id[0] : id;
  const updatedAlunos = await updateAttendanceStatus(statusValue, selectedDate, idString, table);

  // Atualize os dados combinados após a atualização dos status de presença
  setCombinedData(prevData => {
    const updatedData = prevData.map(aluno => {
      const updatedAluno = updatedAlunos.find(updated => updated.RA === aluno.RA);
      return updatedAluno ? updatedAluno : aluno;
    });
    return updatedData;
  });
};

  const table = useReactTable({
    data: combinedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
        sorting: [{ id: 'Nome', desc: true }]
      }
  });

  const onDateChange = (date: Date | undefined) => {
    setSelectedDate(date || null);
    setDate(date || null);
  };
  
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const totalRows = table.getFilteredRowModel().rows.length;

  useEffect(() => {
    if (selectedRows.length >= 1) {
      setIsSelected(true);
    } else {
      setIsSelected(false);
    }
  }, [selectedRows.length]);

  const toggleDraggableVisibility = () => {
    setIsDraggableVisible(prev => !prev);
  };

  
  return (
    <div className="relative pb-[76px]">
      <div className="flex relative items-center justify-between gap-2 py-4">
        <Input
          placeholder="Filtre por nome."
          value={(table.getColumn("Nome")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("Nome")?.setFilterValue(event.target.value)
          }
          className="w-full"
        />
        <Popover>
            <PopoverTrigger>
            <Button className="flex h-12 w-fit" variant={"outline"}>
          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : 
          <div className="flex items-center gap-2">
            <CalendarIcon className=" h-4 w-4 opacity-50" />
            <p className="text-sm opacity-50 lg:flex hidden font-normal">Escolha uma data</p>
          </div>}
        </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="dark:bg-black/60 backdrop-blur-xl mt-1 dark:ring-white/10 ">
            
          
            <div className="right-0 p-2  rounded-lg top-0  z-20">
              <Calendar
                className="flex"
                mode="single"
                selected={selectedDate || undefined}
                onSelect={onDateChange}
                disabled={(date) => {
                  if (date > new Date() || (salaCreatedAt && date < new Date(salaCreatedAt.setHours(0, 0, 0, 0)))) {
                    return true;
                  }
                  return false;
                }}
                initialFocus
              />
            </div>
          
      
            </PopoverContent>
        </Popover>
        

        
      </div>
      
      <div className="flex items-center">
        <div className="min-h-[608px] rounded-lg overflow-clip w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead className="" key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    className="h-[56px]"
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="h-[56px]" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Sem Resultados
                  </TableCell>    
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="flex flex-col absolute w-full bottom-0 right-0 gap-4">
        <div className="flex w-full mt-3 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <MdKeyboardDoubleArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <MdKeyboardDoubleArrowRight className="h-4 w-4" />
            </Button>
            <div className="flex w-[100px] text-xs items-center justify-center font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
          </div>
          
          <div className={`${isSelected ? 'flex' : 'hidden'} flex gap-2`}>
            <Button variant="outline"
              className={`h-8 w-fit py-0 dark:bg-green-950/5 hover:dark:bg-green-950/10 dark:text-green-500 hover:dark:text-green-400 gap-2 lg:flex text-xs`} onClick={() => handleUpdateAttendanceStatus(1)}><IoCheckmarkSharp /></Button>
            <Button variant="outline"
              className={`h-8 w-fit py-0 dark:bg-red-950/5 hover:dark:bg-red-950/10 dark:text-red-500 hover:dark:text-red-400 gap-2 lg:flex text-xs`} onClick={() => handleUpdateAttendanceStatus(0)}><IoClose /></Button>
          </div>
        </div>
        
        <div className="text-xs text-white/50">
          {selectedRows.length} de {totalRows} aluno(s) selecionadas.
        </div>
      </div>
    </div>
  );
}

function setSala(data: SalaData) {
  throw new Error("Function not implemented.");
}
