"use client";


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 bg-gray-50">
    
      <main>{children}</main>
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} LSD Lead Finder. All rights reserved.</p>
      </footer>
    </div>
  );
}
