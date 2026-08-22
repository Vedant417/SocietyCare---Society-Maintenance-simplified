import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useToast } from '../context/ToastContext';
import { Phone, Copy, ShieldAlert, HeartHandshake } from 'lucide-react';

const Emergency = () => {
  const { showToast } = useToast();

  const coreEmergencyNumbers = [
    { name: 'National Emergency Number', numbers: ['112'] },
    { name: 'Police', numbers: ['100', '112'] },
    { name: 'Fire Brigade', numbers: ['101', '112'] },
    { name: 'Ambulance', numbers: ['102', '108'] },
    { name: 'Disaster Management', numbers: ['108', '1070'] },
  ];

  const publicSafetyNumbers = [
    { name: 'Women Helpline', numbers: ['1091', '181'] },
    { name: 'Child Helpline', numbers: ['1098'] },
    { name: 'Senior Citizen Helpline', numbers: ['14567'] },
    { name: 'Cyber Crime Helpline', numbers: ['1930'] },
    { name: 'LPG Leak Helpline', numbers: ['1906'] },
  ];

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    showToast(`Copied ${num} to clipboard!`, 'success');
  };

  const renderContactRow = (contact, index) => {
    return (
      <tr key={index} className="hover:bg-brand-gray-light/10 transition-colors border-b border-brand-gray/20">
        <td className="px-6 py-4 text-sm font-extrabold text-brand-charcoal">
          {contact.name}
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {contact.numbers.map((num, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-brand-ivory/50 border border-brand-gray/40 rounded-xl px-3 py-1.5 shadow-sm">
                <a
                  href={`tel:${num}`}
                  className="flex items-center gap-1.5 text-brand-primary hover:text-brand-primary-light font-bold text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {num}
                </a>
                <button
                  onClick={() => handleCopy(num)}
                  className="p-1 text-gray-400 hover:text-brand-primary hover:bg-[#EEF2F7] rounded-lg transition-all cursor-pointer border-0 bg-transparent"
                  title={`Copy ${num}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-brand-charcoal">
            Emergency Contacts
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Quick access to important emergency and public safety numbers.
          </p>
        </div>

        {/* Core Emergency Numbers Section */}
        <div className="bg-brand-card border border-brand-gray/40 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-brand-gray-light/35 px-6 py-4 border-b border-brand-gray/30 flex items-center gap-2 select-none">
            <ShieldAlert className="w-5 h-5 text-brand-danger" />
            <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">
              Core Emergency Numbers
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray/25">
              <thead className="bg-[#FDFBF7]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Emergency</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {coreEmergencyNumbers.map(renderContactRow)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Public Safety & Social Support Section */}
        <div className="bg-brand-card border border-brand-gray/40 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-brand-gray-light/35 px-6 py-4 border-b border-brand-gray/30 flex items-center gap-2 select-none">
            <HeartHandshake className="w-5 h-5 text-brand-primary" />
            <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">
              Public Safety & Social Support
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray/25">
              <thead className="bg-[#FDFBF7]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Emergency</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {publicSafetyNumbers.map(renderContactRow)}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Emergency;
