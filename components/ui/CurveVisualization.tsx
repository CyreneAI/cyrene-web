interface CurveVisualizationProps {
  totalSupply: number;
  migrationThreshold: number;
  solPrice?: number; // Add SOL price prop
}

const CurveVisualization: React.FC<CurveVisualizationProps> = ({ 
  totalSupply, 
  migrationThreshold,
  solPrice = 100 // Default fallback price
}) => {
  // Calculate price points along the curve - more points for smoother curve
  const calculatePricePoints = () => {
    const points = [];
    const steps = 50; // More steps for smoother curve
    
    for (let i = 0; i <= steps; i++) {
      const supply = (i / steps) * totalSupply;
      // Bonding curve formula: price increases with supply
      const price = (supply / totalSupply) * migrationThreshold;
      points.push({ supply, price });
    }
    
    return points;
  };

  const points = calculatePricePoints();
  const maxPrice = migrationThreshold;

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  // Generate SVG path for the curve
  const generateCurvePath = () => {
    if (points.length === 0) return '';
    
    const width = 100;
    const height = 100;
    
    let path = '';
    
    points.forEach((point, i) => {
      const x = (point.supply / totalSupply) * width;
      const y = height - (point.price / maxPrice) * height;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  // Calculate correct migration market cap: migrationThreshold * SOL_PRICE * 2
  const migrationMarketCap = migrationThreshold * solPrice * 2;

  return (
    <div className="bg-gray-800/30 rounded-xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-white">Curve Preview</h4>
        <div className="text-sm text-gray-400">
          Peak: ${formatNumber(migrationThreshold)}
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="relative h-48 bg-gray-900/50 rounded-lg border border-white/5 overflow-hidden">
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Y-axis labels */}
        <div className="absolute left-2 top-2 bottom-8 flex flex-col justify-between text-xs text-gray-400">
          <span>${formatNumber(maxPrice)}</span>
          <span>${formatNumber(maxPrice * 0.75)}</span>
          <span>${formatNumber(maxPrice * 0.5)}</span>
          <span>${formatNumber(maxPrice * 0.25)}</span>
          <span>$0</span>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute left-8 right-2 bottom-2 flex justify-between text-xs text-gray-400">
          <span>0</span>
          <span>{formatNumber(totalSupply * 0.25)}</span>
          <span>{formatNumber(totalSupply * 0.5)}</span>
          <span>{formatNumber(totalSupply * 0.75)}</span>
          <span>{formatNumber(totalSupply)}</span>
        </div>
        
        {/* Chart content */}
        <div className="absolute left-8 right-2 top-2 bottom-8">
          <svg 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none" 
            className="w-full h-full"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              
              <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            {/* Fill area under curve */}
            <path
              d={`${generateCurvePath()} L 100 100 L 0 100 Z`}
              fill="url(#fillGradient)"
            />
            
            {/* Main curve line */}
            <path
              d={generateCurvePath()}
              stroke="url(#curveGradient)"
              strokeWidth="2"
              fill="none"
              className="drop-shadow-sm"
            />
            
            {/* End point indicator */}
            <circle
              cx="100"
              cy={100 - (migrationThreshold / maxPrice) * 100}
              r="3"
              fill="#8b5cf6"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
      
      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-gray-400 mb-1">Starting MC</div>
          <div className="text-white font-medium">$0</div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-gray-400 mb-1">Migration MC</div>
          <div className="text-white font-medium">${formatNumber(migrationMarketCap)}</div>
        </div>
      </div>
      
      {/* Token supply info */}
      <div className="mt-4 flex justify-between items-center text-sm">
        <div className="text-gray-400">Token Supply</div>
        <div className="text-white font-medium">{formatNumber(totalSupply)}</div>
      </div>
    </div>
  );
};

export default CurveVisualization;