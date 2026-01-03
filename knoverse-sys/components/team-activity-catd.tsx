import { Card } from "./ui/card";

type TeamActivityCardProps = {
  team: {
    name: string;
    activity: number;
  };
};

export default function TeamActivityCard({ team }: TeamActivityCardProps) {
  return (
    <div>
      <Card className="p-2 mb-2 hover:bg-gray-50 hover:text-gray-800 transition-all duration-300">
        <p className="font-medium hover">{team.name}</p>
        <p className="text-sm text-gray-600">Activity: {team.activity}</p>
      </Card>
    </div>
  );
}
