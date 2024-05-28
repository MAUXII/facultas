import { useCallback, useState } from 'react';
import { DropzoneState, useDropzone } from 'react-dropzone';
import { IoClose } from "react-icons/io5";
import { TbTableImport } from "react-icons/tb";
import { FaFile } from "react-icons/fa";
import Papa from 'papaparse';

interface InputProps {
  dropzone: DropzoneState;
}

interface HasFileProps {
  file: File;
  removeFile: () => void;
}

interface FileInputProps {
  setCsvData: (data: any[]) => void;
}

export const FileInput = ({ setCsvData }: FileInputProps) => {
  const [file, setFile] = useState<File | null>(null);

  const removeFile = useCallback(() => {
    setFile(null);
    setCsvData([]); // Limpa os dados CSV quando o arquivo é removido
  }, [setCsvData]);

  const onDrop = useCallback((files: File[]) => {
    const csvFile = files[0];
    setFile(csvFile);

    Papa.parse(csvFile, {
      header: true,
      dynamicTyping: true,
      encoding: "ISO-8859-1", // UTF-8 pra entender acento, mds odeio Brasil
      complete: (results) => {
        // Filtra as linhas para remover aquelas que possuem todas as células vazias ou null
        const filteredData = results.data.filter((row: any) => {
          return Object.values(row).some(value => value !== null && value !== "");
        });

        // Adiciona o campo "presenca" para cada linha do CSV
        const dataWithPresenca = filteredData.map((row: any) => ({
          ...row,
          presenca: [{
            editedAt: new Date(),
            createdAt: new Date(),
            status: 2
          }]
        }));

        setCsvData(dataWithPresenca); // Define os dados CSV no estado pai
        console.log('Parsed CSV Data:', dataWithPresenca);
      },
      error: (error) => {
        console.error('Error parsing CSV file:', error);
      },
    });
  }, [setCsvData]);

  const dropzone = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
  });

  return file ? <HasFile file={file} removeFile={removeFile} /> : <Input dropzone={dropzone} />;
};

const Input = ({ dropzone }: InputProps) => {
  const { getRootProps, getInputProps, isDragActive } = dropzone;
  const inputProps = getInputProps();

  return (
    <div
      {...getRootProps()}
      className={`flex h-[225px] w-full rounded-md border border-neutral-200 dark:hover:bg-[#0C0C0C] bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300
      ${isDragActive ? 'border-white border-dashed' : 'border-gray-600'}`}
    >
      <label htmlFor="dropzone-file" className="cursor-pointer w-full h-full">
        <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full h-full">
          <TbTableImport
            className={`w-10 h-10 mb-3 ${isDragActive ? 'text-white' : 'text-[#B1B1B1]'}`}
          />
          {isDragActive ? (
            <p className="font-bold text-lg text-white">Solte para adicionar</p>
          ) : (
            <>
              <p className="mb-2 text-base text-center text-white">
                <span className="font-bold">Clique para enviar</span> ou arraste até aqui
              </p>
              <p className="mb-2 text-sm text-center text-[#B1B1B1]">
                <span className="font-regular flex max-w-[275px] w-full"> Importe um arquivo .csv com a tabela de alunos no formato que desejar</span>
              </p>
              <p className="text-[#B1B1B1] text-sm">CSV</p>
            </>
          )}
        </div>
      </label>
      <input {...inputProps} className="hidden" />
    </div>
  );
};

const HasFile = ({ file, removeFile }: HasFileProps) => {
  return (
    <div className="flex flex-col h-[225px] items-center justify-center w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300">
      <div className="w-full max-w-[11rem] ring-1 ring-white/20 rounded-md shadow-md flex gap-3 items-center justify-center">
        <FaFile className="text-lg my-4 ml-4" />
        <span className="text-base font-medium text-white my-4">{file.name}</span>
        <button type="button" onClick={removeFile} className="place-self-start mt-1 p-1">
          <IoClose className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
