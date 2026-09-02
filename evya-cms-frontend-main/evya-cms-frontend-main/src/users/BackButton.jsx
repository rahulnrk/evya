import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export default function BackButton({to}) {
  return (
    <div className="mb-6">
      <Button
        onClick={() => window.history.back()}
        variant="outline"
        className="flex items-center gap-2 hover:bg-muted transition-all"
      >
        <ArrowLeftIcon className="h-4 w-4" />
       Back
      </Button>
    </div>
  );
}
