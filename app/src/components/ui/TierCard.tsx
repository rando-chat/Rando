import React from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './Card';

interface TierFeature {
  text: string;
  included: boolean;
}

interface TierCardProps {
  tier: 'free' | 'premium' | 'student';
  title: string;
  description: string;
  price: {
    monthly: number;
    yearly?: number;
  };
  features: TierFeature[];
  featured?: boolean;
  ctaText: string;
  onCtaClick: () => void;
  popular?: boolean;
}

const TierCard = ({
  tier,
  title,
  description,
  price,
  features,
  featured = false,
  ctaText,
  onCtaClick,
  popular = false,
}: TierCardProps) => {
  const getTierIcon = () => {
    switch (tier) {
      case 'premium':
        return '👑';
      case 'student':
        return '🎓';
      default:
        return '✨';
    }
  };

  const getTierColor = () => {
    switch (tier) {
      case 'premium':
        return 'from-[#FB6962] to-[#FF8C7F]';
      case 'student':
        return 'from-[#D4AF37] to-[#F4D03F]';
      default:
        return 'from-[#2E235E] to-[#4A3F8C]';
    }
  };

  return (
    <Card
      variant={featured ? 'gold' : 'default'}
      padding="lg"
      hover={!featured}
      glow={featured}
      className="relative h-full"
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="premium" size="lg">
            ⭐ Most Popular
          </Badge>
        </div>
      )}

      {featured && (
        <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] rounded-2xl blur opacity-20 -z-10" />
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor()} text-white`}
            >
              {getTierIcon()}
            </div>
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <p className="text-[#B8B8D1]">{description}</p>
            </div>
          </div>
          {tier === 'student' && (
            <Badge variant="student" size="lg">
              🎓 50% OFF
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">${price.monthly}</span>
            <span className="text-[#B8B8D1] ml-2">/month</span>
          </div>
          {price.yearly && (
            <p className="text-sm text-[#B8B8D1]">
              ${price.yearly}/year (save ${(price.monthly * 12 - price.yearly).toFixed(2)})
            </p>
          )}
          {tier === 'student' && (
            <p className="text-sm text-[#10B981]">
              🎓 Verified students only
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              {feature.included ? (
                <span className="text-[#10B981] mr-3 mt-0.5 flex-shrink-0">✓</span>
              ) : (
                <div className="text-[#8a8aa3] mr-3 mt-0.5 flex-shrink-0">×</div>
              )}
              <span
                className={feature.included ? 'text-white' : 'text-[#8a8aa3] line-through'}
              >
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant={featured ? 'gold' : tier === 'premium' ? 'coral' : 'default'}
          size="lg"
          fullWidth
          onClick={onCtaClick}
          className={featured ? 'shadow-lg shadow-yellow-500/25' : ''}
        >
          {ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TierCard;