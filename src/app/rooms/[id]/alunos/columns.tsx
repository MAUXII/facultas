import { Checkbox } from "@/components/ui/checkbox"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
  import { Presence } from "./data-table"

export type AlunoData = {
    id: string
    nome: string
    RA: string
    presenca: Presence[];
  }
   
  export const columns: ColumnDef<AlunoData, any>[] = [
    {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
    enableSorting: false,
    enableHiding: false,
      },

    {
      accessorKey: "Nome",
      header: ({ column }) => {
        return (
          <a className="flex w-fit gap-2 items-center cursor-pointer hover:text-white transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </a>
        )
      },
    },
    {
      accessorKey: "RA",
      header: "RA",
    },
    {
        accessorKey: "presenca",
        header: "Status",
        cell: ({ row }) => {
            const presenca = row.original.presenca;
            let statusText = "Pendente"; // valor padrão
            // Verificar cada objeto de presença no array
            presenca.forEach(presencaItem => {
                if (presencaItem.status === 0) {
                    statusText = "Faltou";
                } else if (presencaItem.status === 1) {
                    statusText = "Presente";
                } else if(presencaItem.status == 2){
                    statusText = "Pendente"
                }
            });
          return <span>{statusText}</span>;
        },
      },
      

      
    ]
  