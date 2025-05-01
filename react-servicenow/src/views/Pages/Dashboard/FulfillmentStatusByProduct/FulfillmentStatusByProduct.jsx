import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';

const dataLine = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 500 },
  { name: 'Apr', value: 700 },
];

export default function FulfillmentStatusByProduct() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((_, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#0098C2]">Line Chart {i + 1}</h2>
            <span className="px-2 py-0.5 text-sm rounded-full bg-[#8DC9DD] text-white">
              Monthly
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dataLine}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#F9FAFB', borderColor: '#8DC9DD' }}
                labelStyle={{ color: '#0098C2' }}
              />
              <Line type="monotone" dataKey="value" stroke="#0098C2" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
