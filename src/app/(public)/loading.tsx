import React from "react";
import Loader from "@/components/shared/Loader";

export default function PublicLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full">
      <Loader />
    </div>
  );
}
