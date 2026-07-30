import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserMetadata } from "@/types";
import { initials } from "@/utils";

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
