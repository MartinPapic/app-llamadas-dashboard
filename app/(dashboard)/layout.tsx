import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 print:bg-white print:block">
      <div className="print:hidden z-50 sticky top-0 md:relative md:z-auto">
        <Sidebar />
      </div>
      <main className="flex-1 p-4 md:p-8 overflow-auto print:p-0 print:overflow-visible">{children}</main>
    </div>
  );
}
