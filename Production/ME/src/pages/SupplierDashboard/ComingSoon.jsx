import React from 'react';
import { FiBriefcase, FiClock } from 'react-icons/fi';

export default function SupplierDashboardComingSoon() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-2 py-8">
      <section className="w-full max-w-2xl rounded-2xl border border-blue-100 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <FiBriefcase size={30} aria-hidden="true" />
        </div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          <FiClock aria-hidden="true" /> Coming Soon
        </p>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Supplier Dashboard</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-600 sm:text-base">
          Supplier management and fulfillment operations will be available in the dedicated Supplier Dashboard.
        </p>
      </section>
    </main>
  );
}
