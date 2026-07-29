import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Search } from "lucide-react";

export function EventsExplorerFilters() {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <InputGroup>
        <InputGroupInput
          type="search"
          placeholder="Buscar por nombre o ubicación..."
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>

      {/* <ButtonGroup>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Archive</Button>
      </ButtonGroup> */}
    </div>
  )
}
