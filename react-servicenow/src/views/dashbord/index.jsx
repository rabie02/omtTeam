// import { useState, useEffect } from 'react';
// import { 
//   LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
// } from 'recharts';
// import { Activity, Users, Briefcase, Tag, FileText, TrendingUp, BarChart2 } from 'lucide-react';

// const DashboardWithCharts = () => {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeCard, setActiveCard] = useState(null);
  
//   // Données fictives pour simuler les statistiques
//   useEffect(() => {
//     setTimeout(() => {
//       setData({
//         users: 1250,
//         clients: 350,
//         productOfferings: 85,
//         productCategories: 15,
//         productSpecifications: 42,
//         trends: {
//           users: 5.2,
//           clients: 3.8,
//           productOfferings: 7.5,
//           productCategories: -2.3,
//           productSpecifications: 12.1,
//         }
//       });
//       setLoading(false);
//     }, 1500);
//   }, []);
  
//   // Données du graphique linéaire
//   const lineChartData = [
//     { name: 'Jan', users: 1100, clients: 320 },
//     { name: 'Feb', users: 1150, clients: 330 },
//     { name: 'Mar', users: 1180, clients: 335 },
//     { name: 'Apr', users: 1190, clients: 340 },
//     { name: 'May', users: 1220, clients: 345 },
//     { name: 'Jun', users: 1250, clients: 350 },
//   ];
  
//   // Données pour l'histogramme
//   const barChartData = [
//     { name: 'Basique', value: 35 },
//     { name: 'Standard', value: 25 },
//     { name: 'Premium', value: 15 },
//     { name: 'Enterprise', value: 10 },
//   ];
  
//   // Données pour le pie chart
//   const pieChartData = [
//     { name: 'Informatique', value: 40 },
//     { name: 'Ventes', value: 30 },
//     { name: 'Marketing', value: 20 },
//     { name: 'Autres', value: 10 },
//   ];
  
//   // Données pour l'histogramme des catégories
//   const categoryData = [
//     { name: 'Cat A', value: 5 },
//     { name: 'Cat B', value: 3 },
//     { name: 'Cat C', value: 4 },
//     { name: 'Cat D', value: 2 },
//     { name: 'Cat E', value: 1 },
//   ];
  
//   // Données pour le graphique d'utilisation
//   const usageData = [
//     { name: 'Lun', value: 65 },
//     { name: 'Mar', value: 59 },
//     { name: 'Mer', value: 80 },
//     { name: 'Jeu', value: 81 },
//     { name: 'Ven', value: 56 },
//     { name: 'Sam', value: 40 },
//     { name: 'Dim', value: 35 },
//   ];
  
//   // Couleurs pour les graphiques
//   const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  
//   // Animations pour les cartes
//   const handleCardHover = (index) => {
//     setActiveCard(index);
//   };
  
//   // Fonction pour déterminer la couleur basée sur la tendance
//   const getTrendColor = (value) => {
//     if (value > 0) return 'text-emerald-500';
//     if (value < 0) return 'text-rose-500';
//     return 'text-gray-500';
//   };
  
//   // Fonction pour obtenir l'icône de tendance
//   const getTrendIcon = (value) => {
//     if (value > 0) return '↑';
//     if (value < 0) return '↓';
//     return '';
//   };
  
//   // Composant pour les cartes de statistiques
//   const StatCard = ({ title, value, icon, color, bgColor, trend, index }) => (
//     <div 
//       className={`p-6 rounded-xl shadow-md transition-all duration-300 ${
//         activeCard === index ? 'transform -translate-y-2 shadow-lg' : ''
//       } ${bgColor} cursor-pointer`}
//       onMouseEnter={() => handleCardHover(index)}
//       onMouseLeave={() => handleCardHover(null)}
//     >
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="text-gray-600 mb-1 text-sm font-medium">{title}</p>
//           <h2 className="text-3xl font-bold mb-1">{loading ? '...' : value.toLocaleString()}</h2>
          
//           {!loading && data?.trends && (
//             <div className={`flex items-center ${getTrendColor(trend)}`}>
//               <span className="mr-1">{getTrendIcon(trend)}</span>
//               <span className="text-sm">{Math.abs(trend)}% ce mois</span>
//             </div>
//           )}
//         </div>
        
//         <div className={`flex items-center justify-center w-12 h-12 rounded-full ${color} text-white`}>
//           {icon}
//         </div>
//       </div>
//     </div>
//   );
  
//   // Formatage des labels du Pie Chart
//   const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
//     const RADIAN = Math.PI / 180;
//     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
//     const x = cx + radius * Math.cos(-midAngle * RADIAN);
//     const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
//     return (
//       <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
//         {`${(percent * 100).toFixed(0)}%`}
//       </text>
//     );
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* En-tête */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
//           <div className="flex items-center mt-2">
//             <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
//             <p className="text-gray-500">Toutes les données sont en temps réel</p>
//           </div>
//         </div>
        
//         {/* Cartes de statistiques */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <StatCard 
//             title="Utilisateurs" 
//             value={data?.users || 0} 
//             icon={<Users size={24} />}
//             color="bg-blue-500"
//             bgColor="bg-white"
//             trend={data?.trends?.users || 0}
//             index={0}
//           />
          
//           <StatCard 
//             title="Clients" 
//             value={data?.clients || 0} 
//             icon={<Briefcase size={24} />}
//             color="bg-purple-500"
//             bgColor="bg-white"
//             trend={data?.trends?.clients || 0}
//             index={1}
//           />
          
//           <StatCard 
//             title="Offres Produits" 
//             value={data?.productOfferings || 0} 
//             icon={<Activity size={24} />}
//             color="bg-emerald-500"
//             bgColor="bg-white"
//             trend={data?.trends?.productOfferings || 0}
//             index={2}
//           />
          
//           <StatCard 
//             title="Catégories" 
//             value={data?.productCategories || 0} 
//             icon={<Tag size={24} />}
//             color="bg-amber-500"
//             bgColor="bg-white"
//             trend={data?.trends?.productCategories || 0}
//             index={3}
//           />
//         </div>
        
//         {/* Rangée des graphiques */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//           {/* Graphique linéaire */}
//           <div className="bg-white p-6 rounded-xl shadow-md">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-semibold text-gray-800">Évolution des utilisateurs</h2>
//               <div className="flex space-x-2">
//                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                   Utilisateurs
//                 </span>
//                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
//                   Clients
//                 </span>
//               </div>
//             </div>
            
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={lineChartData}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                   <XAxis dataKey="name" stroke="#9CA3AF" />
//                   <YAxis stroke="#9CA3AF" />
//                   <Tooltip />
//                   <Legend />
//                   <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
//                   <Line type="monotone" dataKey="clients" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
          
//           {/* Histogramme */}
//           <div className="bg-white p-6 rounded-xl shadow-md">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-semibold text-gray-800">Répartition des offres</h2>
//               <BarChart2 size={20} className="text-gray-400" />
//             </div>
            
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={barChartData}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                   <XAxis dataKey="name" stroke="#9CA3AF" />
//                   <YAxis stroke="#9CA3AF" />
//                   <Tooltip />
//                   <Legend />
//                   <Bar dataKey="value" name="Nombre d'offres" fill="#10B981">
//                     {barChartData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>
        
//         {/* Deuxième rangée de graphiques */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//           {/* Pie Chart */}
//           <div className="bg-white p-6 rounded-xl shadow-md">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-semibold text-gray-800">Répartition par secteur</h2>
//               <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
//                 <span className="text-gray-500 font-medium text-xs">%</span>
//               </div>
//             </div>
            
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={pieChartData}
//                     cx="50%"
//                     cy="50%"
//                     labelLine={false}
//                     label={renderCustomizedLabel}
//                     outerRadius={80}
//                     fill="#8884d8"
//                     dataKey="value"
//                   >
//                     {pieChartData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                   <Legend />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
          
//           {/* Histogramme des catégories */}
//           <div className="bg-white p-6 rounded-xl shadow-md">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-semibold text-gray-800">Catégories de produits</h2>
//               <Tag size={20} className="text-gray-400" />
//             </div>
            
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart 
//                   data={categoryData}
//                   layout="vertical"
//                 >
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                   <XAxis type="number" stroke="#9CA3AF" />
//                   <YAxis dataKey="name" type="category" stroke="#9CA3AF" />
//                   <Tooltip />
//                   <Legend />
//                   <Bar dataKey="value" name="Nombre" fill="#F59E0B" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
          
//           {/* Carte de statistiques et progression */}
//           <div className="space-y-6">
//             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-md text-white">
//               <div className="flex justify-between items-start">
//                 <div>
//                   <p className="opacity-80 mb-1 text-sm font-medium">Spécifications Produits</p>
//                   <h2 className="text-3xl font-bold mb-1">{loading ? '...' : (data?.productSpecifications || 0)}</h2>
                  
//                   {!loading && data?.trends && (
//                     <div className="flex items-center text-green-300">
//                       <span className="mr-1">↑</span>
//                       <span className="text-sm">{Math.abs(data?.trends?.productSpecifications || 0)}%</span>
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20">
//                   <FileText size={24} className="text-white" />
//                 </div>
//               </div>
//             </div>
            
//             <div className="bg-white p-6 rounded-xl shadow-md">
//               <h3 className="font-semibold text-gray-800 mb-4">Performance</h3>
              
//               <div className="space-y-4">
//                 <div>
//                   <div className="flex justify-between mb-1 text-sm">
//                     <span>Utilisateurs actifs</span>
//                     <span className="font-medium">92%</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-2">
//                     <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
//                   </div>
//                 </div>
                
//                 <div>
//                   <div className="flex justify-between mb-1 text-sm">
//                     <span>Taux de conversion</span>
//                     <span className="font-medium">68%</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-2">
//                     <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '68%' }}></div>
//                   </div>
//                 </div>
                
//                 <div>
//                   <div className="flex justify-between mb-1 text-sm">
//                     <span>Satisfaction client</span>
//                     <span className="font-medium">87%</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-2">
//                     <div className="bg-amber-500 h-2 rounded-full" style={{ width: '87%' }}></div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         {/* Graphique d'utilisation hebdomadaire */}
//         <div className="bg-white p-6 rounded-xl shadow-md mb-8">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-semibold text-gray-800">Utilisation Hebdomadaire</h2>
//             <div className="flex space-x-2">
//               <button className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">Semaine</button>
//               <button className="px-3 py-1 text-xs font-medium text-gray-500 rounded-md">Mois</button>
//               <button className="px-3 py-1 text-xs font-medium text-gray-500 rounded-md">Année</button>
//             </div>
//           </div>
          
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={usageData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis dataKey="name" stroke="#9CA3AF" />
//                 <YAxis stroke="#9CA3AF" />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="value" name="Taux d'utilisation" fill="#8B5CF6">
//                   {usageData.map((entry, index) => (
//                     <Cell 
//                       key={`cell-${index}`} 
//                       fill={entry.value > 70 ? '#10B981' : (entry.value > 50 ? '#8B5CF6' : '#9CA3AF')} 
//                     />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
        
//         {/* Section de résumé et distribution */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Tableau résumé */}
//           <div className="bg-white p-6 rounded-xl shadow-md">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">Résumé des activités récentes</h2>
            
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead>
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Activité
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Statut
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   <tr>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                       Nouvelle offre produit créée
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       30 Avr 2025
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                         Complété
//                       </span>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                       Mise à jour des spécifications
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       29 Avr 2025
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
//                         En cours
//                       </span>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
//                       Ajout de nouvelle catégorie
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       28 Avr 2025
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                         Complété
//                       </span>
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>
          
//           {/* Distribution des spécifications */}
//           <div className="bg-white p-6 rounded-xl shadow-md">
//             <h2 className="text-xl font-semibold text-gray-800 mb-6">Distribution des spécifications</h2>
            
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={[
//                       { name: 'Type A', value: 15 },
//                       { name: 'Type B', value: 10 },
//                       { name: 'Type C', value: 8 },
//                       { name: 'Type D', value: 6 },
//                       { name: 'Type E', value: 3 },
//                     ]}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={60}
//                     outerRadius={80}
//                     fill="#8884d8"
//                     paddingAngle={5}
//                     dataKey="value"
//                   >
//                     {pieChartData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                   <Legend />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashboardWithCharts;


function home() {
  return ( <>home</> );
}

export default home;