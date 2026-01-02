"use client";

import { Separator } from '@/components/ui/separator';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend} from 'recharts';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import { FaUsers, FaFileAlt, FaProjectDiagram } from 'react-icons/fa';

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
  { month: "July", desktop: 280, mobile: 150 },
  { month: "August", desktop: 300, mobile: 160 },
  { month: "September", desktop: 250, mobile: 170 },
  { month: "October", desktop: 320, mobile: 180 },
  { month: "November", desktop: 400, mobile: 190 },
  { month: "December", desktop: 450, mobile: 200 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#f8721a",
  },
  mobile: {
    label: "Mobile",
    color: "#f87172",
  },
} satisfies ChartConfig;

const teams = [
  { name: "Team Alpha", users: 120 },
  { name: "Team Beta", users: 95 },
  { name: "Team Gamma", users: 80 },
  { name: "Team Delta", users: 65 },
  { name: "Team Epsilon", users: 50 },
];

export default function AdminPage() {
  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-sans font-bold">Admin Dashboard</h1>
        <p className="mt-2">Welcome to the admin panel.</p>
        <Separator className="my-4" />
      </div>

      {/* Stats Cards Section */}
      <div>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-4 border rounded-lg flex items-left">
            <FaUsers className="text-4xl text-orange-600 mr-4" />
            <div>
              <h3 className="text-2xl font-semibold mb-2">Total Users</h3>
              <p className="text-3xl">1,234</p>
            </div>
          </Card>
          <Card className="p-4 border rounded-lg flex items-left">
            <FaProjectDiagram className="text-4xl text-teal-600 mr-4" />
            <div>
              <h3 className="text-2xl font-semibold mb-2">Active Teams</h3>
              <p className="text-3xl">56</p>
            </div>
          </Card>
          <Card className="p-4 border rounded-lg flex items-left">
            <FaFileAlt className="text-4xl text-blue-600 mr-4" />
            <div>
              <h3 className="text-2xl font-semibold mb-2">Files Uploaded</h3>
              <p className="text-3xl">7,890</p>
            </div>
          </Card>
        </div>
      </div>

      {/* User Activity Section */}
      <div className="mt-12">
        <h2 className="text-3xl font-sans font-bold mb-4">User Activity</h2>
      </div>
      <div className="mt-8 grid sm:grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Activity Chart */}
        <Card className="p-4 border rounded-lg">
          <ChartContainer config={chartConfig}>
            <BarChart width={600} height={300} data={chartData}>
              <XAxis dataKey="month" />
              <Tooltip />
              <Legend />
              <Bar dataKey="desktop" fill={chartConfig.desktop.color} />
              <Bar dataKey="mobile" fill={chartConfig.mobile.color} />
            </BarChart>
          </ChartContainer>
        </Card>

        {/* Teams With Most Activity */}
        <Card className="p-4 border rounded-lg">
          <h3 className="text-2xl font-semibold mb-4">Teams With Most Activity</h3>
          {teams.map((team, index) => (
            <Card key={index} className="p-2 mb-2 hover:bg-gray-50 transition-all duration-300">
              <p className="font-medium">{team.name}</p>
              <p className="text-sm text-gray-600">Active Users: {team.users}</p>
            </Card>
          ))}
        </Card>
      </div>
    </div>
  );
}
