import React from "react";

export default function SponsorSection() {
    return (
        <section className="flex flex-col items-center justify-center px-4 md:px-0 w-full py-16 bg-white dark:bg-gray-900">
            <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 text-center">
                Didukung oleh mitra terpercaya kami
            </h3>
            <div className="max-w-4xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full mt-10 px-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 h-20 grid place-content-center rounded-md hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50 transition duration-200">
                    <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/clickup.svg"
                        alt="ClickUp" className="max-h-8 dark:invert opacity-70 hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 h-20 grid place-content-center rounded-md hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50 transition duration-200">
                    <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/airtable.svg"
                        alt="Airtable" className="max-h-8 dark:invert opacity-70 hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 h-20 grid place-content-center rounded-md hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50 transition duration-200">
                    <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/miro.svg"
                        alt="Miro" className="max-h-8 dark:invert opacity-70 hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 h-20 grid place-content-center rounded-md hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50 transition duration-200">
                    <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/slack.svg"
                        alt="Slack" className="max-h-8 dark:invert opacity-70 hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 h-20 grid place-content-center rounded-md hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50 transition duration-200">
                    <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/huawei.svg"
                        alt="Huawei" className="max-h-8 dark:invert opacity-70 hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 h-20 grid place-content-center rounded-md hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50 transition duration-200">
                    <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/asana.svg"
                        alt="Asana" className="max-h-8 dark:invert opacity-70 hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </section>
    );
}
