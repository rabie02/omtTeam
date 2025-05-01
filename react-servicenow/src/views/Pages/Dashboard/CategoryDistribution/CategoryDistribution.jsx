import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';

const dataPie = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
];

const COLORS = ['#0098C2', '#8DC9DD', '#FFD580', '#FF9F80'];

export default function CategoryDistribution() {
  return (
    <div className="col-span-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transition-all hover:shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0098C2]">Category Distribution</h2>
        <span className="text-sm px-3 py-1 rounded-full bg-[#8DC9DD] text-white font-medium">
          % Share
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={dataPie}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            label
          >
            {dataPie.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#f9fafb', borderColor: '#8DC9DD' }}
            labelStyle={{ color: '#0098C2' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
