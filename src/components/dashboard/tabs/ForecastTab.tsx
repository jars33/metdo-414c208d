
import React from "react";
import { Card } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface ForecastTabProps {
  forecastData: any[];
  isLoading: boolean;
}

export function ForecastTab({ forecastData, isLoading }: ForecastTabProps) {
  // Safely check if forecastData is available
  const safeData = Array.isArray(forecastData) ? forecastData : [];
  
  return (
    <Card className="w-full">
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">
          Financial Forecast
        </h2>
        <div className="h-80 w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Skeleton className="h-[70%] w-[90%]" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={safeData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis 
                  tickFormatter={(value) => `€${value}`} 
                  className="text-muted-foreground" 
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value ? `€${value.toFixed(2)}` : 'N/A',
                    name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')
                  ]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone"
                  dataKey="actualRevenue" 
                  name="Actual Revenue" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  connectNulls={true}
                />
                <Line 
                  type="monotone"
                  dataKey="actualCost" 
                  name="Actual Cost" 
                  stroke="#F97316" 
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  );
}
