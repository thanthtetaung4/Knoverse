import {Separator} from '@/components/ui/separator';
import React from 'react';
import { Card } from '@/components/ui/card';

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
    <Card className="mt-8 p-4 border rounded-lg">
      <h4 className="text-xl font-semibold">Recent User Activities</h4>
      <ul className="list-disc list-inside mt-2">
        <li>User JohnDoe created a new team.</li>
        <li>User JaneSmith uploaded a new file.</li>
        <li>User AdminUser updated system settings.</li>
      </ul>
    </Card>
    </div>
  );
}
