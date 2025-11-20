// import React from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   Users,
//   ClipboardList,
//   Warehouse,
//   FileText,
//   AlertCircle,
// } from "lucide-react";
// import { Card } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";

// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   BarChart,
//   Bar,
// } from "recharts";

// // Données fictives
// const stockData = [
//   { name: "Jan", stock: 400 },
//   { name: "Feb", stock: 300 },
//   { name: "Mar", stock: 500 },
//   { name: "Apr", stock: 450 },
//   { name: "May", stock: 600 },
// ];

// const employeesData = [
//   { name: "Jan", employees: 20 },
//   { name: "Feb", employees: 25 },
//   { name: "Mar", employees: 22 },
//   { name: "Apr", employees: 30 },
//   { name: "May", employees: 28 },
// ];

// const recentStockMovements = [
//   { article: "Article A", magasin: "Magasin 1", qty: -5, date: "18/11/2025" },
//   { article: "Article B", magasin: "Magasin 2", qty: +10, date: "17/11/2025" },
//   { article: "Article C", magasin: "Magasin 1", qty: -2, date: "16/11/2025" },
// ];

// const recentAffectations = [
//   { employe: "John Doe", magasin: "Magasin A", date: "12/11/2025" },
//   { employe: "Jane Smith", magasin: "Magasin B", date: "10/11/2025" },
//   { employe: "Paul Martin", magasin: "Magasin C", date: "08/11/2025" },
// ];

// export default function Dashboard() {
//   const { user } = useAuth();

//   return (
//     <div className="p-6 flex-1 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold text-gray-800 mb-6">
//         Bonjour, {user?.full_name || user?.username}
//       </h1>

//       {/* Cartes KPI */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         {(user.role === "admin" || user.role === "responsable_rh") && (
//           <Card className="p-4 bg-white shadow rounded-2xl border border-gray-200 hover:shadow-lg transition">
//             <div className="flex items-center">
//               <Users className="w-8 h-8 text-green-700 mr-3" />
//               <div>
//                 <p className="text-xl font-semibold text-gray-900">120</p>
//                 <p className="text-sm text-gray-600">Employés</p>
//               </div>
//             </div>
//           </Card>
//         )}

//         {(user.role === "admin" || user.role === "responsable_rh") && (
//           <Card className="p-4 bg-white shadow rounded-2xl border border-gray-200 hover:shadow-lg transition">
//             <div className="flex items-center">
//               <ClipboardList className="w-8 h-8 text-yellow-700 mr-3" />
//               <div>
//                 <p className="text-xl font-semibold text-gray-900">8</p>
//                 <p className="text-sm text-gray-600">Congés en attente</p>
//               </div>
//             </div>
//           </Card>
//         )}

//         {(user.role === "admin" || user.role === "responsable_stock") && (
//           <Card className="p-4 bg-white shadow rounded-2xl border border-gray-200 hover:shadow-lg transition">
//             <div className="flex items-center">
//               <Warehouse className="w-8 h-8 text-blue-700 mr-3" />
//               <div>
//                 <p className="text-xl font-semibold text-gray-900">5</p>
//                 <p className="text-sm text-gray-600">Magasins</p>
//               </div>
//             </div>
//           </Card>
//         )}

//         {(user.role === "admin" || user.role === "responsable_stock" || user.role === "magasinier") && (
//           <Card className="p-4 bg-white shadow rounded-2xl border border-gray-200 hover:shadow-lg transition">
//             <div className="flex items-center">
//               <FileText className="w-8 h-8 text-purple-700 mr-3" />
//               <div>
//                 <p className="text-xl font-semibold text-gray-900">320</p>
//                 <p className="text-sm text-gray-600">Articles en stock</p>
//                 <Progress value={75} className="mt-2 h-2 rounded-full" />
//               </div>
//             </div>
//           </Card>
//         )}
//       </div>

//       {/* Graphiques */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//         {(user.role === "admin" || user.role === "responsable_stock" || user.role === "magasinier") && (
//           <Card className="p-4 bg-white shadow rounded-2xl border border-gray-200">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Stock par mois</h2>
//             <ResponsiveContainer width="100%" height={250}>
//               <BarChart data={stockData}>
//                 <XAxis dataKey="name" stroke="#4B5563" />
//                 <YAxis stroke="#4B5563" />
//                 <Tooltip />
//                 <Bar dataKey="stock" fill="#0A6847" />
//               </BarChart>
//             </ResponsiveContainer>
//           </Card>
//         )}

//         {(user.role === "admin" || user.role === "responsable_rh") && (
//           <Card className="p-4 bg-white shadow rounded-2xl border border-gray-200">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Évolution des employés</h2>
//             <ResponsiveContainer width="100%" height={250}>
//               <LineChart data={employeesData}>
//                 <XAxis dataKey="name" stroke="#4B5563" />
//                 <YAxis stroke="#4B5563" />
//                 <Tooltip />
//                 <Line type="monotone" dataKey="employees" stroke="#297373" strokeWidth={2} />
//               </LineChart>
//             </ResponsiveContainer>
//           </Card>
//         )}
//       </div>

//       {/* Alertes */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//         {recentStockMovements.map((item, idx) => (
//           <Card key={idx} className="p-4 bg-red-50 border border-red-200 rounded-2xl shadow flex items-center">
//             <AlertCircle className="w-6 h-6 text-red-700 mr-3" />
//             <div>
//               <p className="text-sm font-semibold text-red-800">
//                 {item.article} → {item.magasin}
//               </p>
//               <p className="text-xs text-red-700">
//                 {item.qty > 0 ? `+${item.qty}` : item.qty} unités ({item.date})
//               </p>
//             </div>
//           </Card>
//         ))}
//       </div>

//       {/* Tableaux */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <Card className="p-4 bg-white shadow rounded-2xl border border-gray-200">
//           <h3 className="text-md font-semibold text-gray-800 mb-2">Dernières affectations</h3>
//           <table className="w-full text-sm text-gray-700">
//             <thead>
//               <tr className="border-b">
//                 <th className="py-2 text-left">Employé</th>
//                 <th className="text-left">Magasin</th>
//                 <th className="text-left">Date</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentAffectations.map((item, idx) => (
//                 <tr key={idx} className="border-b">
//                   <td className="py-2">{item.employe}</td>
//                   <td>{item.magasin}</td>
//                   <td>{item.date}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>

//         <Card className="p-4 bg-white shadow rounded-2xl border border-gray-200">
//           <h3 className="text-md font-semibold text-gray-800 mb-2">Congés récents</h3>
//           <ul className="text-sm text-gray-700 space-y-1">
//             <li>Marie Dupont - 3 jours</li>
//             <li>Ali Raharisoa - 2 jours</li>
//             <li>Lucien Rabe - 1 jour</li>
//           </ul>
//         </Card>
//       </div>
//     </div>
//   );
// }