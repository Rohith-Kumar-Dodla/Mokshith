# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: logistics.functional.spec.ts >> Logistics Functional Suite >> Section E — Queue, History, Analytics & Persistence >> LF-LOG-028 | Location update persists currentLocation
- Location: tests\functional\logistics.functional.spec.ts:450:5

# Error details

```
AxiosError: Request failed with status code 429
```

# Test source

```ts
  109 |   });
  110 | 
  111 |   const oos = await mk('pf-cart-oos', {
  112 |     name: uniqueProductName('pf-cart-oos'),
  113 |     price: 50,
  114 |     categoryId,
  115 |     stock: 0,
  116 |     moq: 1,
  117 |   });
  118 | 
  119 |   const moq5 = await mk('pf-cart-moq5', {
  120 |     name: uniqueProductName('pf-cart-moq5'),
  121 |     price: 60,
  122 |     categoryId,
  123 |     stock: 50,
  124 |     moq: 5,
  125 |   });
  126 | 
  127 |   const moq7 = await mk('pf-cart-moq7', {
  128 |     name: uniqueProductName('pf-cart-moq7'),
  129 |     price: 70,
  130 |     categoryId,
  131 |     stock: 50,
  132 |     moq: 7,
  133 |   });
  134 | 
  135 |   const lowStock = await mk('pf-cart-low', {
  136 |     name: uniqueProductName('pf-cart-low'),
  137 |     price: 55,
  138 |     categoryId,
  139 |     stock: 5,
  140 |     moq: 10,
  141 |   });
  142 | 
  143 |   const stockCap = await mk('pf-cart-cap', {
  144 |     name: uniqueProductName('pf-cart-cap'),
  145 |     price: 65,
  146 |     categoryId,
  147 |     stock: 50,
  148 |     moq: 1,
  149 |   });
  150 | 
  151 |   const inactiveCreated = await mk('pf-cart-inact', {
  152 |     name: uniqueProductName('pf-cart-inact'),
  153 |     price: 45,
  154 |     categoryId,
  155 |     stock: 10,
  156 |     moq: 1,
  157 |     isActive: true,
  158 |   });
  159 |   await patchProductStatusApi(adminSession, inactiveCreated.id, false);
  160 |   const inactive = { ...inactiveCreated };
  161 | 
  162 |   const imageProduct = await mk(
  163 |     'pf-cart-img',
  164 |     {
  165 |       name: uniqueProductName('pf-cart-img'),
  166 |       price: 120,
  167 |       categoryId,
  168 |       stock: 30,
  169 |       moq: 1,
  170 |     },
  171 |     VALID_IMAGE
  172 |   );
  173 | 
  174 |   return {
  175 |     categoryId,
  176 |     standard,
  177 |     bulk,
  178 |     second,
  179 |     third,
  180 |     fourth,
  181 |     oos,
  182 |     moq5,
  183 |     moq7,
  184 |     lowStock,
  185 |     stockCap,
  186 |     inactive,
  187 |     imageProduct,
  188 |   };
  189 | }
  190 | 
  191 | export async function addToWishlistApi(session: ApiSession, productId: string) {
  192 |   const response = await apiClient.post(
  193 |     '/wishlist/add',
  194 |     { productId },
  195 |     { headers: authHeaders(session) }
  196 |   );
  197 |   const body = response.data as { data?: unknown } & Record<string, unknown>;
  198 |   return body?.data ?? body;
  199 | }
  200 | 
  201 | export async function createOrderApi(
  202 |   session: ApiSession,
  203 |   payload: {
  204 |     paymentMethod: string;
  205 |     shippingAddress: Record<string, string>;
  206 |     idempotencyKey?: string;
  207 |   }
  208 | ) {
> 209 |   const response = await apiClient.post('/orders', payload, {
      |                    ^ AxiosError: Request failed with status code 429
  210 |     headers: {
  211 |       ...authHeaders(session),
  212 |       ...(payload.idempotencyKey ? { 'Idempotency-Key': payload.idempotencyKey } : {}),
  213 |     },
  214 |   });
  215 |   const body = response.data as { data?: unknown } & Record<string, unknown>;
  216 |   return body?.data ?? body;
  217 | }
  218 | 
  219 | export function buildShippingAddress() {
  220 |   return {
  221 |     name: 'Cart Functional Vendor',
  222 |     phone: '9000000101',
  223 |     addressLine: '123 Certification Street',
  224 |     city: 'Hyderabad',
  225 |     state: 'Telangana',
  226 |     pincode: '500001',
  227 |   };
  228 | }
  229 | 
  230 | export function parseRupee(text: string): number {
  231 |   const normalized = text.replace(/[₹,\s]/g, '');
  232 |   return Number(normalized);
  233 | }
  234 | 
  235 | /** Discount rows render as `-₹100.00`; compare absolute savings amount. */
  236 | export function parseDiscountRupee(text: string): number {
  237 |   return Math.abs(parseRupee(text));
  238 | }
  239 | 
  240 | export async function getCartLineQuantity(
  241 |   session: ApiSession,
  242 |   productId: string
  243 | ): Promise<number> {
  244 |   const cart = await getCartApi(session);
  245 |   const line = cart?.items?.find(
  246 |     (item) => resolveRefId(item.productId) === productId
  247 |   );
  248 |   return Number(line?.quantity ?? 0);
  249 | }
  250 | 
  251 | export async function disposeProduct(adminSession: ApiSession, productId: string) {
  252 |   try {
  253 |     await deleteProductApi(adminSession, productId);
  254 |   } catch {
  255 |     // best-effort cleanup
  256 |   }
  257 | }
  258 | 
```