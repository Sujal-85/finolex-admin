import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderProps {
    title: string;
    description?: string;
}

export function Placeholder({ title, description }: PlaceholderProps) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center p-6">
            <Card className="w-full max-w-md text-center">
                <CardContent className="pt-6">
                    <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-muted p-4">
                            <Construction className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                    <h2 className="mb-2 text-2xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground">
                        {description || "This page is currently under construction."}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
