"use client";

import { useState } from "react";
import Image from "next/image";
import { IoIosMenu } from "react-icons/io";
import { IoChevronBackSharp } from "react-icons/io5";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { UserDB } from "@/db/schema";
import SettingsPageCard from "./setting-card";

interface FieldData {
  discription: string;
  fieldContent: string | null;
}

function TextField(field: FieldData) {
  return (
    <div>
      <p className="text-xs mb-1 text-muted-foreground">{field.discription}</p>
      <p className="border py-3 px-3 w-64 mb-2 rounded-lg bg-gray-50 dark:bg-card text-muted-foreground">
        {field.fieldContent}
      </p>
    </div>
  );
}

function capitalizeFirst(value?: string | null): string | null {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ProfileTab({ user }: { user: UserDB | null }) {
  const [trigger, setTrigger] = useState<boolean>(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState<boolean>(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout failed", err);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div>
      <div
        className={`border rounded-3xl ${
          trigger ? "w-80 p-4" : "w-15 px-2 py-4"
        } h-full flex flex-col items-center`}
      >
        <IoChevronBackSharp
          size={20}
          className={`absolute left-12 cursor-pointer ${
            trigger ? "block" : "hidden"
          }`}
          onClick={() => {
            setTrigger((prev) => !prev);
          }}
        />
        <Image
          src="/profile.jpg"
          alt="Profile"
          width={trigger ? 80 : 40}
          height={trigger ? 80 : 40}
          className={`rounded-full ${trigger ? "mt-10" : ""}`}
          // onClick={() => {setTrigger((prev) => !prev)}}
        />
        <IoIosMenu
          size={40}
          className={`${trigger ? "hidden" : "block"} cursor-pointer`}
          onClick={() => {
            setTrigger((prev) => !prev);
          }}
        />
        {/* <RxCross2 size={40} className={`${trigger ? "hidden" : "block"} mt-2`} onClick={triggerHandle} /> */}
        {trigger && (
          <div className="flex flex-col gap-3">
            {/* <button className="border py-1 px-3 rounded-lg mt-3">Edit Profile</button> */}
            <div className="flex flex-col mt-6">
              <TextField
                discription="Username"
                fieldContent={capitalizeFirst(user?.fullName)}
              />
              <TextField
                discription="Role"
                fieldContent={capitalizeFirst(user?.role)}
              />
            </div>
            <Separator className="my-2" />
            <button
              onClick={() => {
                setShowPasswordUpdate(true);
              }}
              className="cursor-pointer border py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Update Password
            </button>
            <button
              onClick={handleLogout}
              className="cursor-pointer border border-red-200 dark:border-red-900 py-2.5 px-4 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors font-medium"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
      {showPasswordUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg relative p-6 min-w-[320px]">
            <button
              onClick={() => setShowPasswordUpdate(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 text-xl"
            >
              ✕
            </button>
            <div className="flex flex-col gap-4 items-center pt-2">
              <h2 className="text-lg font-semibold">Update Password</h2>
              <SettingsPageCard compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
