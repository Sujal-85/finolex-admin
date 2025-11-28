import { Loader2 } from "lucide-react";

export const Loader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-inner ring-1 ring-primary/20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="text-lg font-medium text-muted-foreground animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
};
