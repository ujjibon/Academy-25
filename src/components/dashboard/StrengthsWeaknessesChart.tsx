'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { UserProfile } from '@/lib/firebase';

interface StrengthsWeaknessesChartProps {
  userProfile: UserProfile;
}

export function StrengthsWeaknessesChart({ userProfile }: StrengthsWeaknessesChartProps) {
    const chartData = [...userProfile.strengths, ...userProfile.weaknesses].map(skill => ({
        name: skill.name,
        value: skill.value,
        fill: skill.value >= 60 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'
    }));

    if (chartData.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                <p>No skill data available yet. Complete lessons to build your skills!</p>
            </div>
        );
    }

  return (
    <div className="h-[300px] w-full">
       <ChartContainer config={{}} className="h-full w-full">
        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" dataKey="value" hide/>
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
          <Bar dataKey="value" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
