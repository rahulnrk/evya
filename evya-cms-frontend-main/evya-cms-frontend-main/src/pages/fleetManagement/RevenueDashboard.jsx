// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
// import { Download, DollarSign, Battery, Car, ArrowLeft } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// // Static data for demonstration - EV Cars only
// const fleetRevenueData = {
//   totalRevenue: 18750,
//   totalEnergyConsumed: 12500, // kWh
//   ratePerKwh: 1.50, // Average rate per kWh
//   monthlyData: [
//     { month: 'Jan', revenue: 1800, energy: 1200, fleet: 'Main EV Fleet' },
//     { month: 'Feb', revenue: 2025, energy: 1350, fleet: 'Main EV Fleet' },
//     { month: 'Mar', revenue: 1470, energy: 980, fleet: 'Main EV Fleet' },
//     { month: 'Apr', revenue: 2250, energy: 1500, fleet: 'Main EV Fleet' },
//     { month: 'May', revenue: 2520, energy: 1680, fleet: 'Main EV Fleet' },
//     { month: 'Jun', revenue: 2925, energy: 1950, fleet: 'Main EV Fleet' },
//     { month: 'Jul', revenue: 3150, energy: 2100, fleet: 'Main EV Fleet' },
//     { month: 'Aug', revenue: 2835, energy: 1890, fleet: 'Main EV Fleet' },
//   ],
//   fleetPerformance: [
//     { name: 'Main EV Fleet', revenue: 18750, energy: 12500, vehicles: 15 },
//     { name: 'North EV Fleet', revenue: 12460, energy: 8650, vehicles: 10 },
//     { name: 'South EV Fleet', revenue: 9350, energy: 6450, vehicles: 8 },
//   ],
//   vehicleTypes: [
//     { name: 'Sedan', value: 45, revenue: 8438, color: '#0088FE' },
//     { name: 'SUV', value: 35, revenue: 6563, color: '#00C49F' },
//     { name: 'Compact', value: 20, revenue: 3750, color: '#FFBB28' },
//   ],
//   topEVs: [
//     { id: 'EV-001', model: 'Tesla Model 3', revenue: 2850, energy: 1900, efficiency: 6.7 },
//     { id: 'EV-007', model: 'Ford Mustang Mach-E', revenue: 2450, energy: 1680, efficiency: 6.9 },
//     { id: 'EV-012', model: 'Nissan Leaf', revenue: 2150, energy: 1480, efficiency: 6.5 },
//     { id: 'EV-004', model: 'Chevy Bolt', revenue: 1950, energy: 1350, efficiency: 6.9 },
//     { id: 'EV-009', model: 'Hyundai Ioniq 5', revenue: 2650, energy: 1750, efficiency: 6.6 },
//   ]
// };

// // BackButton component
// const BackButton = () => {
//   const navigate = useNavigate();
  
//   return (
//     <Button 
//       variant="outline" 
//       onClick={() => navigate('/fleetManagement')}
//       className="flex items-center gap-2"
//     >
//       <ArrowLeft className="h-4 w-4" />
//       Back
//     </Button>
//   );
// };

// const RevenueDashboard = () => {
//   const navigate = useNavigate();
//   const [timeFilter, setTimeFilter] = useState('lastMonth');
//   const [fleetFilter, setFleetFilter] = useState('all');
//   const [filteredData, setFilteredData] = useState(fleetRevenueData.monthlyData);

//   useEffect(() => {
//     // Filter logic based on time filter
//     let data = [...fleetRevenueData.monthlyData];
    
//     if (timeFilter === 'lastMonth') {
//       data = data.slice(-1);
//     } else if (timeFilter === 'lastQuarter') {
//       data = data.slice(-3);
//     } else if (timeFilter === 'lastYear') {
//       data = data.slice(-12);
//     }
    
//     setFilteredData(data);
//   }, [timeFilter, fleetFilter]);

//   const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
//   const totalEnergy = filteredData.reduce((sum, item) => sum + item.energy, 0);

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <div className="flex items-center gap-4">
//           <BackButton />
//           <h1 className="text-3xl font-bold">Revenue</h1>
//         </div>
//         <div className="flex gap-2">
//           <Select value={timeFilter} onValueChange={setTimeFilter}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="Select period" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="lastMonth">Last Month</SelectItem>
//               <SelectItem value="lastQuarter">Last Quarter</SelectItem>
//               <SelectItem value="lastYear">Last Year</SelectItem>
//             </SelectContent>
//           </Select>
//           {/* <Button>
//             <Download className="h-4 w-4 mr-2" />
//             Export Report
//           </Button> */}
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
//             <DollarSign className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
//             <p className="text-xs text-muted-foreground">
//               +12% from previous period
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Energy Consumed</CardTitle>
//             <Battery className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{totalEnergy.toLocaleString()} kWh</div>
//             <p className="text-xs text-muted-foreground">
//               Average rate: ${fleetRevenueData.ratePerKwh}/kWh
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">EV Cars</CardTitle>
//             <Car className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">33</div>
//             <p className="text-xs text-muted-foreground">
//               +3 since last month
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       <Tabs defaultValue="overview" className="w-full">
//         <TabsList>
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="vehicleAnalysis">EV Analysis</TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>Revenue Trend</CardTitle>
//               <CardDescription>
//                 Revenue generated from EV energy consumption over time
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="pl-2">
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={filteredData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="month" />
//                     <YAxis yAxisId="left" />
//                     <YAxis yAxisId="right" orientation="right" />
//                     <Tooltip 
//                       formatter={(value, name) => [
//                         name === 'energy' ? `${value} kWh` : `$${value}`,
//                         name === 'energy' ? 'Energy Consumed' : 'Revenue'
//                       ]}
//                     />
//                     <Legend />
//                     <Bar yAxisId="left" dataKey="energy" fill="#8884d8" name="Energy Consumed" />
//                     <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//         <TabsContent value="vehicleAnalysis">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Revenue by EV Type</CardTitle>
//                 <CardDescription>
//                   Distribution of revenue across different EV car types
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-80">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={fleetRevenueData.vehicleTypes}
//                         cx="50%"
//                         cy="50%"
//                         labelLine={false}
//                         outerRadius={80}
//                         fill="#8884d8"
//                         dataKey="value"
//                         nameKey="name"
//                         label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                       >
//                         {fleetRevenueData.vehicleTypes.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.color} />
//                         ))}
//                       </Pie>
//                       <Tooltip formatter={(value, name, props) => [
//                         `$${props.payload.revenue}`,
//                         `Revenue from ${name}`
//                       ]} />
//                       <Legend />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>
            
//             <Card>
//               <CardHeader>
//                 <CardTitle>Top Performing EVs</CardTitle>
//                 <CardDescription>
//                   Electric vehicles with highest revenue generation
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   {fleetRevenueData.topEVs.map((vehicle) => (
//                     <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg">
//                       <div>
//                         <p className="font-medium">{vehicle.model}</p>
//                         <p className="text-sm text-muted-foreground">{vehicle.id} • {vehicle.efficiency} km/kWh</p>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-medium">${vehicle.revenue}</p>
//                         <p className="text-sm text-muted-foreground">{vehicle.energy} kWh</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default RevenueDashboard;