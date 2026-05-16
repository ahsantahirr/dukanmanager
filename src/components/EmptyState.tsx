import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  image: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ image, title, description, action }: EmptyStateProps) {
  return (
    <Card className="overflow-hidden border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl" />
          <img
            src={image}
            alt=""
            className="relative h-40 w-40 rounded-2xl object-cover shadow-lg ring-4 ring-background"
          />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function EmptyStateButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button onClick={onClick} size="lg" className="shadow-md">
      {children}
    </Button>
  );
}
