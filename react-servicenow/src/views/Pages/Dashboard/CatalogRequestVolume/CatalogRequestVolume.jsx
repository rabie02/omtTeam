import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar
  } from 'recharts';
  
  const dataBar = [
    { name: 'A', uv: 400, pv: 2400 },
    { name: 'B', uv: 300, pv: 2210 },
    { name: 'C', uv: 200, pv: 2290 },
    { name: 'D', uv: 278, pv: 2000 },
  ];
  
  export default function CatalogRequestVolume() {
    return (
      <div className="col-span-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transition-all hover:shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0098C2]">Catalog Request Volume</h2>
          <span className="text-sm px-3 py-1 rounded-full bg-[#8DC9DD] text-white font-medium">
            Updated
          </span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dataBar}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{ backgroundColor: '#f9fafb', borderColor: '#8DC9DD' }}
              labelStyle={{ color: '#0098C2' }}
            />
            <Bar dataKey="uv" fill="#0098C2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  