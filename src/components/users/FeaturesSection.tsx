"use client";
import React from "react";

const features = [
  {
    title: "Kompetisi Elit",
    description: "Turnamen reguler dengan sistem ranking poin profesional. Ukur kemampuan Anda melawan pemain terbaik.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M18.75 4.236c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 4.972m0 0a5.006 5.006 0 00-5.183-5.079C9.011 4.34 7.63 5.65 7.5 7.29a5.006 5.006 0 005.183 5.079z" />
      </svg>
    )
  },
  {
    title: "Komunitas Solid",
    description: "Bergabung dengan jaringan pemain yang saling mendukung. Persahabatan di luar lapangan sama pentingnya dengan persaingan di dalam lapangan.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    )
  },
  {
    title: "Statistik Transparan",
    description: "Pantau setiap pertandingan, rekam jejak kemenangan, dan lihat progres ranking Anda secara *real-time* di portal kami.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    )
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-[var(--sp-section)] bg-[var(--soft-cloud)] dark:bg-gray-900 border-b border-[var(--hairline-soft)] dark:border-gray-800">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-[var(--hairline-soft)] dark:border-gray-800 bg-white dark:bg-gray-950">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="p-10 md:p-12 xl:p-16 border-r border-b border-[var(--hairline-soft)] dark:border-gray-800 group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-500"
            >
              <div className="w-12 h-12 rounded-full border border-[var(--hairline)] dark:border-gray-700 flex items-center justify-center text-[var(--ink)] dark:text-white mb-8 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              <h3 className="font-campaign text-3xl md:text-4xl text-[var(--ink)] dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="font-ui text-sm md:text-base text-[var(--mute)] dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
