import { Separator } from "@/components/ui/separator";

type HeaderCardProps = {
  title: string;
  description: string;
};

export default function HeaderCard({ title, description }: HeaderCardProps) {
  return (
    <>
      <h1 className="text-4xl font-sans font-bold">{title}</h1>
      <p className="mt-2">{description}</p>
      <Separator className="my-4" />
    </>
  );
}
