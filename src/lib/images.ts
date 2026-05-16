/** Curated Unsplash images for shop / inventory UI */
export const images = {
  authHero:
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1400&q=80",
  dashboardBanner:
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1600&q=80",
  emptyCategories:
    "https://images.unsplash.com/photo-1586201375761-badc3f9f7378?auto=format&fit=crop&w=600&q=80",
  emptyInventory:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
  emptySales:
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
  emptyReports:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  productFallback:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=200&q=80",
} as const;

export const categoryImages = [
  "https://images.unsplash.com/photo-1586201375761-badc3f9f7378?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1607082348824-0a960f8510be?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
];

export function getCategoryImage(index: number): string {
  return categoryImages[index % categoryImages.length];
}

export function getCategoryFallback(index: number): string {
  return getCategoryImage(index);
}

/** Default image when no user upload exists (browser-only uploads use EntityImage) */
export function getProductImage(name: string): string {
  const key = name.toLowerCase();
  if (key.includes("rice") || key.includes("basmati"))
    return "https://images.unsplash.com/photo-1586201375761-badc3f9f7378?auto=format&fit=crop&w=200&q=80";
  if (key.includes("oil") || key.includes("ghee"))
    return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80";
  if (key.includes("soap") || key.includes("cream") || key.includes("cosmetic"))
    return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=200&q=80";
  return images.productFallback;
}
