import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 rounded-lg bg-primary-light p-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Coming Soon</h3>
          <p className="text-center text-muted-foreground">
            This feature is under development and will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
