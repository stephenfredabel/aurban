export const propertyCategories = [
  { id: 'rental', label: 'Rental', description: 'Short and long-term residential rentals', slug: 'rental' },
  { id: 'lease', label: 'Lease', description: 'Commercial and residential lease properties', slug: 'lease' },
  { id: 'buy', label: 'Buy', description: 'Properties available for outright purchase', slug: 'buy' },
  { id: 'land', label: 'Land', description: 'Plots of land for sale across Nigeria', slug: 'land' },
];

export const getCategoryById = (id) => propertyCategories.find((c) => c.id === id);