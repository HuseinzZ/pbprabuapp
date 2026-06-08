import Link from "next/link";
import React from "react";

interface BreadcrumbProps {
  pageTitle: string;
  paths?: { name: string; href?: string }[];
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, paths }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3
        className="text-lg font-semibold text-gray-800 dark:text-white/90"
      >
        {pageTitle}
      </h3>
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400"
              href="/admin"
            >
              Home
            </Link>
          </li>
          
          {paths && paths.map((path, index) => (
            <React.Fragment key={index}>
              <li className="flex items-center">
                <svg
                  className="mx-1.5 stroke-current text-gray-400 dark:text-gray-500"
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </li>
              {path.href ? (
                <li>
                  <Link href={path.href} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400">
                    {path.name}
                  </Link>
                </li>
              ) : (
                <li className="text-sm text-gray-800 dark:text-white/90">
                  {path.name}
                </li>
              )}
            </React.Fragment>
          ))}
          
          <li className="flex items-center">
            <svg
              className="mx-1.5 stroke-current text-gray-400 dark:text-gray-500"
              width="17"
              height="16"
              viewBox="0 0 17 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                stroke=""
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </li>
          <li className="text-sm text-gray-800 dark:text-white/90">
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
