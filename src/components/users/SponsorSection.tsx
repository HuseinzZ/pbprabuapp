import React from "react";
import Image from "next/image";

export default function SponsorSection() {
    return (
        <section className="flex flex-col items-center justify-center px-4 md:px-0 w-full py-16 bg-white dark:bg-gray-900">
            <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 text-center">
                Didukung oleh sponsor kami
            </h3>
            <div className="max-w-2xl flex flex-wrap justify-center gap-6 w-full mt-10 px-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 w-48 h-24 sm:w-64 sm:h-32 flex items-center justify-center rounded-md hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50 transition duration-200">
                    <img src="/sponsor1.png"
                        alt="Sponsor 1" className="h-full w-full object-contain opacity-80 hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 w-48 h-24 sm:w-64 sm:h-32 flex items-center justify-center rounded-md hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50 transition duration-200">
                    <img src="/sponsor2.png"
                        alt="Sponsor 2" className="h-full w-full object-contain opacity-80 hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </section>
    );
}
