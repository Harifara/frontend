import React, { useState } from "react";
import DashboardRH from "./DashboardRH";
import DashboardStock from "./DashboardStock";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Package } from "lucide-react";

type TabType = "rh" | "stock";

export default function DashboardGlobal() {
  const [tab, setTab] = useState<TabType>("rh");

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex-1">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard Global</h1>
        <p className="text-sm text-gray-500">
          Vue consolidée RH & Stock
        </p>
      </div>

      {/* TABS */}
      <Card className="mb-6 p-2 flex gap-2 rounded-2xl w-fit">
        <Button
          variant={tab === "rh" ? "default" : "outline"}
          className="flex items-center gap-2"
          onClick={() => setTab("rh")}
        >
          <Users className="h-4 w-4" />
          Ressources Humaines
        </Button>

        <Button
          variant={tab === "stock" ? "default" : "outline"}
          className="flex items-center gap-2"
          onClick={() => setTab("stock")}
        >
          <Package className="h-4 w-4" />
          Gestion de Stock
        </Button>
      </Card>

      {/* CONTENT */}
      <div>
        {tab === "rh" && <DashboardRH />}
        {tab === "stock" && <DashboardStock />}
      </div>
    </div>
  );
}
