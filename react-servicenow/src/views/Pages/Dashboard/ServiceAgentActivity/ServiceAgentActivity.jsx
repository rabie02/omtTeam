import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const dataRadar = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Science', A: 98, B: 130, fullMark: 150 },
  { subject: 'Coding', A: 86, B: 130, fullMark: 150 },
  { subject: 'Design', A: 99, B: 100, fullMark: 150 },
];

export default function ServiceAgentActivity() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition duration-300"
        >
          <h2 className="text-md font-bold text-[#0098C2] mb-4">Agent Radar {i + 1}</h2>
          <div className="bg-[#8DC9DD]/20 rounded-xl p-2">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart outerRadius={60} data={dataRadar}>
                <PolarGrid stroke="#ccc" />
                <PolarAngleAxis dataKey="subject" stroke="#0098C2" />
                <Radar
                  name="A"
                  dataKey="A"
                  stroke="#0098C2"
                  fill="#0098C2"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
