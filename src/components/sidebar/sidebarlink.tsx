import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type LinkProps = {
    icon: ReactNode;
    title: string;
    url: string;
};

export const SidebarLink = ({ icon, title, url }: LinkProps) => {
    const pathname = usePathname();
    const isActive = pathname === url;

    return (
        <Link 
            className={`w-full h-[60px] hover:ring-white/10 hover:ring-1 hover:bg-white/5 transition-colors rounded-md px-3 py-2 flex gap-4 items-center group ${isActive ? 'bg-white/5' : ''}`} 
            href={url}
        >
            <span className="text-xl transition-colors group-hover:text-white/80">
                {icon}
            </span>
            <span className="font-medium text-sm transition-colors group-hover:text-white/80">
                {title}
            </span>
        </Link>
    );
};
