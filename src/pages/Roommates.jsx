import { useEffect } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';

export default function Roommates() {
  useEffect(() => {
    document.title = 'Roommates | Aurban';
  }, []);

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <SectionHeader title="Roommates" subtitle="Coming soon" />
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-gray-500">
          We are preparing a roommate finder experience. Check back soon.
        </div>
      </div>
    </div>
  );
}

