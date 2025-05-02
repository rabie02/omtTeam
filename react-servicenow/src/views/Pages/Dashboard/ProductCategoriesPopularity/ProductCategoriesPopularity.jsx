import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const dataLine = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 500 },
  { name: 'Apr', value: 700 },
];

function ProductCategoriesPopularity() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((_, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-lg shadow-lg border-t-8 border-t-[#0098C2] transform hover:translate-y-2 transition-all"
        >
          <div className="flex flex-col items-start mb-4">
            <h2 className="text-2xl font-semibold text-[#0098C2] mb-2">Line Chart {i + 1}</h2>
            <span className="px-4 py-1 text-xs rounded-full bg-[#8DC9DD] text-[#0098C2]">
              Monthly
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dataLine}>
              <CartesianGrid strokeDasharray="5 5" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 'bold' }}
                tickLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                axisLine={{ stroke: '#6B7280', strokeWidth: 2 }}
                tickFormatter={(value) => value.toUpperCase()} 
                angle={-45}  
                textAnchor="end"  
              /> 
              <YAxis
                stroke="#6B7280"
                orientation="left"
                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 'bold' }}
                tickLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                axisLine={{ stroke: '#6B7280', strokeWidth: 2 }}
                tickFormatter={(value) => `${value} units`}  
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#F9FAFB',
                  borderColor: '#8DC9DD',
                }}
                labelStyle={{
                  color: '#0098C2',
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#0098C2" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

export default ProductCategoriesPopularity;
