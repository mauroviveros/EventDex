import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserMetadata } from "@/types";

const initials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type UserLabelProps = Readonly<{ metadata: UserMetadata }>;
export function UserLabel({ metadata }: UserLabelProps) {
  return (
    <>
      <Avatar>
        {metadata.avatar && <AvatarImage src={metadata.avatar} alt={metadata.name} />}
        <AvatarFallback>{initials(metadata.name)}</AvatarFallback>
      </Avatar>

      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{metadata.name}</span>
        <span className="truncate text-xs">{metadata.email}</span>
      </div>
    </>
  )
}
