import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
  } from 'recharts';
  
  const dataArea = [
    { name: 'Page A', uv: 400, pv: 2400 },
    { name: 'Page B', uv: 300, pv: 1398 },
    { name: 'Page C', uv: 200, pv: 9800 },
    { name: 'Page D', uv: 278, pv: 3908 },
  ];
  
  function ProductAvailabilityStatus() {
    return (
      <div className="grid grid-cols-12 gap-6">
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            className="col-span-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#0098C2]">
                Area Chart {i + 1}
              </h2>
              <span className="px-2 py-0.5 text-sm rounded-full bg-[#8DC9DD] text-white">
                Weekly
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dataArea}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#F9FAFB', borderColor: '#8DC9DD' }}
                  labelStyle={{ color: '#0098C2' }}
                />
                <Area
                  type="monotone"
                  dataKey="uv"
                  stroke="#0098C2"
                  fill="#8DC9DD"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    );
  }
  
  export default ProductAvailabilityStatus;
  