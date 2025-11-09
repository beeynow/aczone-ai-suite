import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function PriceRangeSlider() {
  const [priceValue, setPriceValue] = useState([2]);
  
  // Conversion: $2 = 100 points
  const priceToPoints = (price: number) => {
    return Math.floor((price / 2) * 100);
  };

  const pointsToPrice = (points: number) => {
    return (points / 100) * 2;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${price}`;
  };

  const formatPoints = (points: number) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
    return points.toLocaleString();
  };

  const handlePriceChange = (value: number[]) => {
    setPriceValue(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 2 && value <= 1000000) {
      setPriceValue([value]);
    }
  };

  const currentPrice = priceValue[0];
  const currentPoints = priceToPoints(currentPrice);

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Price Range Selector</Label>
        <p className="text-sm text-muted-foreground">
          Choose your budget and see the equivalent points
        </p>
      </div>

      {/* Price Input */}
      <div className="space-y-2">
        <Label htmlFor="price-input">Price ($)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="price-input"
            type="number"
            min={2}
            max={1000000}
            step={1}
            value={currentPrice}
            onChange={handleInputChange}
            className="pl-7"
          />
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Min: $2</span>
          <span className="text-muted-foreground">Max: $1M</span>
        </div>
        <Slider
          value={priceValue}
          onValueChange={handlePriceChange}
          min={2}
          max={1000000}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between items-center">
          <div className="bg-primary/10 px-3 py-1.5 rounded-md">
            <span className="text-sm font-medium text-primary">
              {formatPrice(currentPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Points Display */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">You will receive</p>
            <p className="text-3xl font-bold text-primary">
              {formatPoints(currentPoints)} Points
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="text-sm font-medium">$2 = 100 pts</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Minimum purchase: $2 (100 points)</p>
        <p>• Maximum purchase: $1,000,000 (50M points)</p>
        <p>• Conversion rate: $2 = 100 points</p>
      </div>
    </Card>
  );
}
