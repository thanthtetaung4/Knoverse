import {Separator} from '@/components/ui/separator';

export default function AdminPage() {
  return (
    <div>
    <div className="mb-8">
      <h1 className="text-4xl font-sans font-bold">Admin Dashboard</h1>
      <p className="mt-2">Welcome to the admin panel.</p>
      <Separator className="my-4" />
    </div>
    <div>
      <h3 className="text-2xl font-semibold mt-6">User Management</h3>
      <p className="mt-2">Here you can manage users.</p>
    </div>
    </div> 
  );
}