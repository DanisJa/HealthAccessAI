import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent" | "primary-light";
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const getColorClass = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-primary-light bg-opacity-10 text-primary";
      case "secondary":
        return "bg-secondary bg-opacity-10 text-secondary";
      case "accent":
        return "bg-accent bg-opacity-10 text-accent";
      case "primary-light":
        return "bg-primary-light bg-opacity-10 text-primary-light";
      default:
        return "bg-primary-light bg-opacity-10 text-primary";
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${getColorClass(color)} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-neutral-dark font-medium">{title}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
