import React from "react";
import { useAuth } from "@/context/AuthContext";
import RoleProfileEditor from "@/components/RoleProfileEditor";

export default function ProfileEditor({ initialData, onProfileUpdated }) {
  const { user } = useAuth();
  const activeRole = user?.role || "user";

  return (
    <RoleProfileEditor
      role={activeRole}
      initialData={initialData || user}
      onSaveSuccess={(updatedData) => {
        if (onProfileUpdated) {
          onProfileUpdated(updatedData);
        }
      }}
    />
  );
}
