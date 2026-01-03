import { ComponentType } from "react";
import { Card } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
  iconWrapperClassName?: string;
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
}: StatsCardProps) {
  return (
    <Card className="p-4 flex items-left">
      <div className={iconWrapperClassName ?? "mr-4"}>
        <Icon className={iconClassName ?? "text-4xl text-orange-600"} />
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-1">{title}</h3>
        <p className="text-3xl">{value}</p>
      </div>
    </Card>
  );
}
