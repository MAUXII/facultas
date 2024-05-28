import React, { useState } from 'react';
import Picker from '@emoji-mart/react';
import i18n from '@emoji-mart/data/i18n/pt.json';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data';

type EmojiProps ={
    valor?: string,
    naMudança?: (event: React.ChangeEvent<HTMLInputElement>) => void,
}

const EmoticonPicker: React.FC<EmojiProps> = ({ valor, naMudança }) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const handleEmojiSelect = (emoji: any) => {
    setSelectedEmoji(emoji.native);
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-lg shadow-md">
      <Popover>
        <PopoverTrigger asChild>
          <input
            id='tagSala'
            type="button"
            className="flex h-12 w-full rounded-md border border-neutral-200 hover:dark:bg-white/5 cursor-pointer items-center justify-center text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-white/30"
            value={valor ? (selectedEmoji || `${valor}`) : (selectedEmoji || "💢")}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto z-[300] rounded-lg flex-1 h-fit p-4 pb-[-16px] overflow-y-auto">
          <div
            className='h-full overflow-y-auto'
            style={{
              '--background-rgb': '10, 10, 10',
              '--border-radius': '24px',
              '--category-icon-size': '24px',
              '--color-border-over': 'rgba(255, 255, 255, 0.1)',
              '--color-border': 'rgba(255, 255, 255, 0.05)',
              '--font-family': "'Poppins', sans-serif",
              '--font-size': '20px',
              '--rgb-accent': '118, 118, 118',
              '--rgb-background': '10, 10, 10',
              '--rgb-color': '255, 255, 255',
              '--rgb-input': '36, 36, 36',
              '--shadow': '5px 5px 15px -8px',
              backgroundColor: '#0A0A0A',
            } as React.CSSProperties}
          >
            <Picker
              data={data}
              i18n={i18n}
              onEmojiSelect={handleEmojiSelect}
              theme="dark"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EmoticonPicker;
