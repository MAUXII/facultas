import Link from "next/link";
import { usePathname} from "next/navigation";


type RoomLinkProps = {
    title: string;
    link: string;
};

export const RoomLink = ({ title, link }: RoomLinkProps) => {
    const pathname = usePathname();
    const isActive = pathname === `/rooms/${link}`;
    
    return (
        <Link 
            className={`w-full  overflow-clip transition-colors rounded-md flex gap-4 items-center group ${isActive ? 'underline text-white/80' : ''}`} 
            href={(`/rooms/${link}`)}
        >
            <span className="font-medium text-xs transition-colors group-hover:text-white/80 whitespace-nowrap">
                {title}
            </span>
        </Link>
    );
};
