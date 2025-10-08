"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (pathname === href ? "active" : "");
  return (
    <aside className="oc-sidebar">
      <div className="oc-brand">Owner Console</div>
      <nav className="oc-nav">
        <Link href="/users" className={`oc-navlink ${isActive('/users')}`}>Users</Link>
        <Link href="/services" className={`oc-navlink ${isActive('/services')}`}>Services</Link>
        <Link href="/ads" className={`oc-navlink ${isActive('/ads')}`}>Ads Manager</Link>
        <Link href="/settings" className={`oc-navlink ${isActive('/settings')}`}>Settings</Link>
      </nav>
    </aside>
  );
}
