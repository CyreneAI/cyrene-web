// 'use client'

// import React from 'react';
// import { 
//   Area, 
//   AreaChart, 
//   ResponsiveContainer, 
//   Tooltip, 
//   XAxis, 
//   YAxis 
// } from 'recharts';

// // Define types
// interface PriceChartProps {
//   data?: {
//     time: string;
//     price: number;
//     volume?: number;
//   }[];
//   height?: number;
//   showTooltip?: boolean;
//   showXAxis?: boolean;
//   showYAxis?: boolean;
// }

// // Sample data generator
// const generateSampleData = () => {
//   const basePrice = 49.6;
//   const hours = 24;
//   const data = [];
  
//   for (let i = 0; i < hours; i++) {
//     // Create some random price fluctuations
//     const randomOffset = (Math.random() - 0.5) * 1.5;
//     // Add some trend to make it look realistic
//     const trendFactor = Math.sin(i / (hours / 6)) * 0.8;
    
//     const time = new Date();
//     time.setHours(time.getHours() - (hours - i));
    
//     data.push({
//       time: time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
//       price: basePrice + randomOffset + trendFactor,
//       volume: Math.floor(Math.random() * 1000) + 200
//     });
//   }
  
//   return data;
// };

// const PriceChart: React.FC<PriceChartProps> = ({ 
//   data = generateSampleData(),
//   height = 350,
//   showTooltip = true,
//   showXAxis = true,
//   showYAxis = true
// }) => {
//   const minPrice = Math.floor(Math.min(...data.map(item => item.price)) * 0.99);
//   const maxPrice = Math.ceil(Math.max(...data.map(item => item.price)) * 1.01);
  
//   // Format numbers to display with appropriate precision
//   const formatPrice = (price: number) => {
//     return `$${price.toFixed(2)}k`;
//   };
  
//   const CustomTooltip = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-[#040A25] p-3 border border-[#2F3755] rounded-lg shadow-xl">
//           <p className="text-gray-300 mb-1">{`Time: ${label}`}</p>
//           <p className="text-[#4D84EE] font-bold">{`Price: ${formatPrice(payload[0].value)}`}</p>
//           {payload[0].payload.volume && (
//             <p className="text-green-400">{`Volume: $${payload[0].payload.volume.toLocaleString()}`}</p>
//           )}
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="w-full h-full">
//       <ResponsiveContainer width="100%" height={height}>
//         <AreaChart
//           data={data}
//           margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
//         >
//           {/* Gradients */}
//           <defs>
//             <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="5%" stopColor="#4D84EE" stopOpacity={0.3} />
//               <stop offset="95%" stopColor="#4D84EE" stopOpacity={0} />
//             </linearGradient>
//           </defs>
          
//           {/* Grid Lines */}
//           <svg>
//             <defs>
//               <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
//                 <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2F3755" strokeWidth="0.5" />
//               </pattern>
//             </defs>
//             <rect width="100%" height="100%" fill="url(#grid)" />
//           </svg>
          
//           {/* Axes */}
//           {showXAxis && (
//             <XAxis 
//               dataKey="time"
//               axisLine={false}
//               tickLine={false}
//               tick={{ fill: '#8896b7', fontSize: 10 }}
//               tickMargin={10}
//               minTickGap={20}
//             />
//           )}
          
//           {showYAxis && (
//             <YAxis
//               domain={[minPrice, maxPrice]}
//               axisLine={false}
//               tickLine={false}
//               tick={{ fill: '#8896b7', fontSize: 10 }}
//               tickMargin={10}
//               tickFormatter={formatPrice}
//               orientation="right"
//             />
//           )}
          
//           {/* Chart elements */}
//           <Area
//             type="monotone"
//             dataKey="price"
//             stroke="#4D84EE"
//             fillOpacity={1}
//             fill="url(#colorPrice)"
//             strokeWidth={2}
//           />
          
//           {showTooltip && <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4D84EE', strokeWidth: 1, strokeOpacity: 0.5 }} />}
//         </AreaChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default PriceChart;