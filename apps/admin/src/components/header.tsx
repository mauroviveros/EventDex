import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type HeaderProps = Readonly<{ title: string; children?: React.ReactNode; }>;
/** Header común de las páginas del dashboard: trigger del sidebar + título. */
export function Header({ title, children }: HeaderProps) {
    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2" />
            <h1 className="font-semibold text-base">{title}</h1>
            {children && <div className="ml-auto">{children}</div>}
        </header>
    )
}