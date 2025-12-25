import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityForm } from "@/components/SecurityForm";
import { createClient } from "@/utils/supabase/server";

const SettingsPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="p-4 w-[98%] mx-auto">
      <div className="mb-6 mt-5">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">
          Manage your account and store preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Store Profile</h3>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm font-medium text-gray-500">
                  Store Name
                </label>
                <div className="col-span-2 font-medium text-gray-900">
                  BW Tools
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm font-medium text-gray-500">
                  Admin Email
                </label>
                <div className="col-span-2 font-medium text-gray-900">
                  {user?.email}
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm font-medium text-gray-500">
                  Role
                </label>
                <div className="col-span-2 flex">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 max-w-2xl">
            <SecurityForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
