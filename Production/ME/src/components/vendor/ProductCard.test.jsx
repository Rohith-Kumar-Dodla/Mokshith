import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import BulkOfferPreview, { getActiveBulkTierIndex } from './BulkOfferPreview';
import { resolveEffectiveUnitPrice } from '../../utils/pricingCalculator';
import { mapBackendProduct } from '../../utils/productMapper';

const renderCard = (product, props = {}) => render(
  <MemoryRouter>
    <ProductCard product={product} {...props} />
  </MemoryRouter>
);

const baseProduct = mapBackendProduct({
  _id: 'p1',
  name: 'Rice',
  price: 123,
  stock: 100,
  moq: 1,
  categoryId: { name: 'Grains' },
  bulkPricing: [
    { minQuantity: 5, price: 113 },
    { minQuantity: 10, price: 103 },
  ],
});

describe('ProductCard bulk pricing UX', () => {
  it('does not display MOQ or stock text', () => {
    renderCard(baseProduct);
    expect(screen.queryByText(/MOQ:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stock:/i)).not.toBeInTheDocument();
  });

  it('shows bulk offers before quantity controls', () => {
    renderCard(baseProduct);
    expect(screen.getByText(/Bulk Offers/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders configured bulk tiers', () => {
    renderCard(baseProduct);
    expect(screen.getByText(/5\+.*113\.00\/unit/i)).toBeInTheDocument();
    expect(screen.getByText(/10\+.*103\.00\/unit/i)).toBeInTheDocument();
    expect(screen.getByText(/Save ₹10\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Save ₹20\.00/i)).toBeInTheDocument();
  });

  it('omits bulk offers section when no tiers exist', () => {
    const product = mapBackendProduct({
      _id: 'p2',
      name: 'Sugar',
      price: 50,
      stock: 20,
      moq: 1,
      categoryId: { name: 'Grocery' },
      bulkPricing: [],
    });
    renderCard(product);
    expect(screen.queryByText(/Bulk Offers/i)).not.toBeInTheDocument();
  });

  it('activates only the highest applicable tier', () => {
    const { rerender } = render(
      <BulkOfferPreview bulkPricing={baseProduct.bulkPricing} basePrice={123} quantity={1} />
    );
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument();

    rerender(
      <BulkOfferPreview bulkPricing={baseProduct.bulkPricing} basePrice={123} quantity={5} />
    );
    expect(screen.getByText(/✓ 5\+/)).toBeInTheDocument();
    expect(screen.queryByText(/✓ 10\+/)).not.toBeInTheDocument();

    rerender(
      <BulkOfferPreview bulkPricing={baseProduct.bulkPricing} basePrice={123} quantity={12} />
    );
    expect(screen.getByText(/✓ 10\+/)).toBeInTheDocument();
    expect(screen.queryByText(/✓ 5\+/)).not.toBeInTheDocument();
  });

  it('reflects bulk pricing in card totals at applicable quantity', () => {
    const expected = resolveEffectiveUnitPrice({ apiPricing: null, product: baseProduct, quantity: 5 });
    expect(expected.unitPrice).toBe(113);
    expect(expected.total).toBe(565);
    renderCard(baseProduct);
    expect(screen.getByText('₹123.00')).toBeInTheDocument();
  });

  it('preserves MOQ minimum quantity behavior', () => {
    const moqProduct = mapBackendProduct({
      _id: 'p3',
      name: 'Oil',
      price: 200,
      stock: 50,
      moq: 5,
      categoryId: { name: 'Oils' },
      bulkPricing: [{ minQuantity: 10, price: 180 }],
    });

    renderCard(moqProduct);
    expect(screen.getByText('5')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const minus = buttons.find((btn) => btn.disabled);
    expect(minus).toBeTruthy();
  });
});

describe('getActiveBulkTierIndex', () => {
  const tiers = [
    { minQty: 5, price: 113 },
    { minQty: 10, price: 103 },
  ];

  it('returns -1 below first tier', () => {
    expect(getActiveBulkTierIndex(tiers, 1)).toBe(-1);
  });

  it('returns first tier at threshold', () => {
    expect(getActiveBulkTierIndex(tiers, 5)).toBe(0);
  });

  it('keeps lower tier between thresholds', () => {
    expect(getActiveBulkTierIndex(tiers, 7)).toBe(0);
  });

  it('returns highest tier at and above top threshold', () => {
    expect(getActiveBulkTierIndex(tiers, 10)).toBe(1);
    expect(getActiveBulkTierIndex(tiers, 12)).toBe(1);
  });
});

describe('pricing consistency with cart calculator', () => {
  it('matches bulk unit price at quantity 5', () => {
    const product = mapBackendProduct({
      _id: 'p4',
      price: 123,
      moq: 1,
      bulkPricing: [{ minQuantity: 5, price: 113 }],
    });
    const cardPricing = resolveEffectiveUnitPrice({ apiPricing: null, product, quantity: 5 });
    expect(cardPricing.unitPrice).toBe(113);
    expect(cardPricing.total).toBe(565);
  });
});
