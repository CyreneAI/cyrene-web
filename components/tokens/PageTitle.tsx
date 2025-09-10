'use client'

import React from 'react'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageTitleProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
}

const PageTitle: React.FC<PageTitleProps> = ({ 
  title, 
  breadcrumbs = [] 
}) => {
  return (
    <div className="mb-8 pt-2">
      <div>
        <h1 className="text-5xl font-bold text-white mb-3">{title}</h1>
        {breadcrumbs.length > 0 && (
          <div className="flex items-center">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mx-2 text-blue-500">
                    <path 
                      d="M9 5l6 7-6 7" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                )}
                {item.href ? (
                  <Link 
                    href={item.href} 
                    className={`${index === breadcrumbs.length - 1 ? 'text-white' : 'text-blue-500 hover:text-blue-400'}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={`${index === breadcrumbs.length - 1 ? 'text-white' : 'text-blue-500'}`}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      <div>
        {/* Additional content like filters or actions can go here */}
      </div>
    </div>
  )
}

export default PageTitle