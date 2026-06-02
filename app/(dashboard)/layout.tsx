import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white print:block">
      <div className="print:hidden h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">{children}</main>
    </div>
  );
}
