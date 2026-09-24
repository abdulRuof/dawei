import React from "react";
import Link from "next/link";
import "./style.css";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

const Breadcrumb = ({ items = [] }: BreadcrumbProps) => {
  return (
    <div className="breadcrumb-bar">
      <nav className="container breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        {items.map((item, index) => (
          <span className="crumb-group" key={index}>
            <span className="sep" aria-hidden="true">
              /
            </span>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span className="current">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumb;