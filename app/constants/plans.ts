export interface BoostPlan {
  id: string;
  label: string;
  price: number;
  duration: string;
  description: string;
  popular?: boolean;
  features: string[];
}

/** Profile boost tiers. Prices are in rupees and are paid out of the wallet. */
export const BOOST_PLANS: BoostPlan[] = [
  {
    id: 'BASIC_BOOST',
    label: 'Standard Boost',
    price: 299,
    duration: '24 Hours',
    description: 'Get 2x more visibility in the feed',
    features: ['Priority feed placement', 'Enhanced profile visibility'],
  },
  {
    id: 'PRO_BOOST',
    label: 'Pro Boost',
    price: 799,
    duration: '3 Days',
    description: 'Maximum exposure for your profile',
    popular: true,
    features: ['Top priority in feed forever*', 'Featured profile badge', 'Reach 5x more people'],
  },
  {
    id: 'ULTRA_BOOST',
    label: 'Ultra Boost',
    price: 1499,
    duration: '7 Days',
    description: 'The ultimate growth package',
    features: ['Dominant feed placement', 'Discovery page feature', 'Smart audience targeting'],
  },
];
