import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventOverview } from "@/types";
import { initials } from "@/utils";

type TopParticipantsProps = Readonly<{
  participants: EventOverview["topParticipants"];
  total: number;
  /** Total de stands: el 100% del recorrido. */
  totalSpots: number;
}>;

export function TopParticipants({
  participants,
  total,
  totalSpots,
}: TopParticipantsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitantes destacados</CardTitle>
        <CardAction className="text-muted-foreground text-sm tabular-nums">
          {total} en total
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {participants.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nadie escaneó todavía.
          </p>
        ) : (
          participants.map((participant, index) => (
            <div key={participant.id} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-center font-medium text-muted-foreground text-xs tabular-nums">
                {index + 1}
              </span>

              <Avatar size="sm">
                {participant.avatar && (
                  <AvatarImage
                    src={participant.avatar}
                    alt={participant.name}
                  />
                )}
                <AvatarFallback>{initials(participant.name)}</AvatarFallback>
              </Avatar>

              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate font-medium text-sm">
                  {participant.name}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {participant.scans} de {totalSpots} medallas
                </span>
              </div>

              <Badge variant="outline" className="tabular-nums">
                {totalSpots
                  ? Math.round((participant.scans * 100) / totalSpots)
                  : 0}
                %
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
