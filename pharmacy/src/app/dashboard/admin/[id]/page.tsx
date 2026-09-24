// import DashboardClient from "./DashboardClient";
import "@/app/dashboard/dashboard.css";
import '@/app/globals.css'

import DashboardClient from "./DashboardClient";

export default function AdminDashboardPage() {
  return <DashboardClient />;
}
// import type { Medicine } from "./_components/types";

// interface PageProps {
//   params: Promise<{
//     id: string;
//   }>;
// }

// export default async function Page({
//   params,
// }: PageProps) {
//   const { id } = await params;

//   const medicines: Medicine[] = [];

//   return (
// <>
// <main>
//   <DashboardClient/>
// </main>
// </>
    
//   );
// }


// import Sidebar from "@/app/dashboard/manager/[id]/_components/Sidebar";
// import Overview from "@/app/dashboard/manager/[id]/_components/Overview";
// import MedicinesManagement from "@/app/dashboard/manager/[id]/_components/MedicinesManagement";
// import type { Medicine, FocusType,SectionId } from "@/app/dashboard/manager/[id]/_components/types";

// interface PageProps {
//   params: Promise<{ id: string }>;
// }

// export default async function Drugs({ params }: PageProps) {
//   const { id } = await params;

//   const medicines: Medicine[] = [];

//   const activeFocus: FocusType = "none";

//   const onSaveMedicine = (updatedMed: Medicine) => {
//     console.log("Save:", updatedMed);
//   };

//   const onDeleteMedicine = (id: number) => {
//     console.log("Delete:", id);
//   };

//   const onAddMedicine = (
//     newMed: Omit<Medicine, "id" | "sold">
//   ) => {
//     console.log("Add:", newMed);
//   };

//   const showToast = (message: string) => {
//     console.log(message);
//   };


// export default async function dashboard({ params }: PageProps) {
//   const { id } = await params;

//   return (
//     <main>
//         <Sidebar/>
//         <Overview/>
//         {/* <MedicinesManagement/> */}
//         {/* <MedicinesManagement
//         medicines={medicines}
//         onSaveMedicine={onSaveMedicine}
//         onDeleteMedicine={onDeleteMedicine}
//         onAddMedicine={onAddMedicine}
//         activeFocus={activeFocus}
//         showToast={showToast}
//       /> */}
//        <DashboardClient
//       medicines={medicines}
//     />
        
        
     
//       <p>drugs ID: {id}</p>
//     </main>
//   );
// }