# Design Spec: Ecommerce Team Project

**Status:** Draft for design-token confirmation before implementation  
**Date:** 2026-10-06  
**Product:** Vietnamese-first multi-seller commerce marketplace, web-only  
**Reference:** Auto-design using confirmed Shopify VN-inspired direction and `docs/DESIGN.md` as the baseline. No image, Figma, or Stitch reference was available.

## Design Read

Reading this as a multi-seller commerce web app for Vietnamese shoppers, sellers, and administrators, with a minimal, trust-first Shopify VN-inspired language, leaning toward customized shadcn/ui with Tailwind utilities.

## Three Dials

- `DESIGN_VARIANCE: 5/10`. Quiet, consistent commerce layouts, with composition changes only where they help discovery or task completion.
- `MOTION_INTENSITY: 3/10`. No decorative or continuous animation. Use restrained feedback for focus, pressed, loading, and state changes.
- `VISUAL_DENSITY: 5/10`. Comfortable scan density for a daily-use app. Admin and seller lists remain compact enough to operate, without ornamental dashboard cards.

## Product and Design-System Decisions

- Product type: multi-seller e-commerce with buyer, seller, guest, and admin surfaces. The interface is not a marketing landing page.
- Audience: Vietnamese shoppers and operators on mobile, tablet, and desktop web.
- Foundation: React 18 + Vite + TypeScript + Tailwind CSS + customized shadcn/ui. Keep shadcn/ui as the only component system.
- Theme lock: light-only for this MVP, as selected. The background is white and the secondary surface is `#f5f5f5`. Do not invert individual page sections.
- Primary is explicitly pure black `#000000`, with white labels. Core chrome is monochrome. Green, amber, and red appear only as semantic status foregrounds, not as extra canvases.
- Shapes: pill buttons, 8px form fields, 12px content group/media surfaces, 1px hairline rules. Panels stay flat unless elevation is needed for a floating overlay.
- Typography: Neue Haas Grotesk Display where a licensed/self-hosted asset exists, with a system sans fallback; Inter Variable/system sans for UI. Enable `ss03` for headings and UI as specified in `docs/DESIGN.md`.
- Motion: 150-200ms for meaningful feedback only; transform, opacity, and color. Respect `prefers-reduced-motion`. No scroll choreography.
- Product media uses actual uploaded/shop product photography. Do not create fake screenshot previews or decorative placeholder illustrations. Reserve image aspect ratios and use neutral loading skeletons.
- Use Lucide for interface icons because it is named in the canonical frontend stack. Icons supplement visible labels and never replace accessible names.
- Locale: Vietnamese copy throughout; format money as VNĐ. Statuses are always named in text and not indicated by color alone.

## Shared Application Shell

### Public and Customer Navigation

- Desktop header: white, 64-72px high, 1px bottom hairline. Wordmark/home link on the left, category/shop discovery navigation, search, then account/cart actions. Keep the row on one line at 1280px; secondary destinations move to the account menu rather than wrap.
- Mobile header: compact 56px row with brand, search action, and cart/account controls. Search expands to a labeled full-width search field. Menu is an accessible sheet or dropdown with a clear close control and focus management.
- Guest actions lead to login when required. Do not imply that a guest cart exists.
- Customer account navigation exposes profile, purchase orders, and seller channel when appropriate.

### Seller and Admin Navigation

- Seller pages use a compact top header plus a desktop side navigation: `Tổng quan`, `Sản phẩm`, `Đơn bán`, `Thiết lập gian hàng`. On narrow screens the navigation becomes a labeled menu or compact tab strip with no more than five destinations.
- Admin pages use an admin side navigation with `Tổng quan`, `Người dùng`, `Sản phẩm`, `Danh mục`, `Đơn hàng`. On mobile it becomes a collapsible menu; content tables change to readable row cards when columns no longer fit.
- Role and ownership are reflected in routes and available actions. Do not present admin controls to customers or sellers.

### Shared Form, Data, and Feedback Rules

- Form fields have visible labels above controls, helper text where needed, and validation below the affected field. Placeholders are examples, never labels.
- Inputs are at least 44px high and use white fill, 1px hairline border, 8px radius, visible focus ring, and clear disabled/error states.
- Buttons have a minimum 44px hit target. Primary actions are black pill buttons with white text. Secondary actions are white/transparent pill buttons with black text and a hairline border. Destructive actions remain clearly named and confirmed; use error color only for status emphasis.
- Use skeletons that match final image, row, and summary geometry. Reserve image aspect ratio to avoid layout shift. Loading controls communicate progress and prevent accidental double submission.
- Empty states use direct Vietnamese explanations and one next action where useful. Errors are contextual with a retry action where retry is safe. Avoid toast-only errors for form validation or payment outcome.
- Use semantic headings, landmarks, labels, button/link semantics, keyboard access, visible focus, accessible dialog focus handling, and live announcement for asynchronous results.
- Contrast target is WCAG AA: at least 4.5:1 for normal text and 3:1 for large text and non-text controls. The specified primary/secondary text and semantic status foregrounds are selected to meet AA on white and `#f5f5f5`; validate final rendered tokens and states during implementation.
- Shared responsive checkpoints are 375px, 768px, and 1280px. Page gutters: 16px, 24px, and 32px respectively. No horizontal page scrolling.

## Screen Inventory

The repository's `docs/DESIGN.md` supplies the visual baseline and responsive conventions. Screen coverage below is reconciled against `SPECIFICATIONS.md`, `docs/PRD.md`, `docs/USER_FLOW.md`, and `project-ecommerce/07-tech-conventions.md`. It covers 22 screen specifications, including create/edit and state variants where they share a page template.

## Screen Specs

### 1. Đăng nhập (`/login`)

**Layout:** Shared public header; centered, narrow form column on a white canvas. Title and short instruction above fields. Registration link below the submit action. Keep the content aligned to the start of the form, not as a full-screen decorative hero.

**Components:** Email field, password field with show/hide control, primary `Đăng nhập` pill, inline form error, loading submit state, link to `Đăng ký`.

**States:** Initial; submitting; invalid email/password; wrong credentials; locked account with the exact explanation `Tài khoản đã bị khóa`; server/network error with retry; success redirects to intended destination or product listing.

**Interactions:** Submit on Enter; reveal/hide password; preserve only a safe local return path; after refresh failure clear session and return here. No social-login controls unless a supported authentication provider is added.

**Responsive:** 375px: one-column form with 16px gutters and full-width submit. 768px: same form with a moderate max width. 1280px: centered form column beneath the standard header; no split marketing panel.

**Accessibility:** Persistent labels; email and password autocomplete; password visibility control has an accessible name and pressed state; inline errors are associated with fields and announced; all actions keyboard reachable with visible focus; controls meet 44px minimum.

### 2. Đăng ký (`/register`)

**Layout:** Same public auth shell and form width as login, so the two entry paths remain visually related. Short explanation that registration creates a customer account.

**Components:** Full name, email, password, password visibility control, password requirement helper, primary `Tạo tài khoản` pill, login link, inline error summary when multiple fields fail.

**States:** Initial; field validation; submitting; duplicate email with a clear return-to-login option; network/server failure; success enters the signed-in experience. Never expose a role selector.

**Interactions:** Validate required fields and password minimum length of 8; trim and normalize email presentation; submit once while pending; after successful registration use the returned customer identity.

**Responsive:** 375px: stacked fields and full-width primary action. 768px: narrow centered column. 1280px: same form width and shell as login.

**Accessibility:** Labels remain visible; native email/password semantics and autocomplete; errors are inline and linked to fields; password requirements are readable before submit; keyboard order follows visual order and focus remains on the first invalid field.

### 3. Hồ sơ cá nhân (`/profile`)

**Layout:** Account shell with page title and a single profile form grouped by personal/contact details. A separate quiet section links to seller setup; do not merge profile address and seller pickup address.

**Components:** Full name, phone, personal address, save button, success/error feedback, seller-channel link or shop summary when configured.

**States:** Loading profile skeleton; populated form; unsaved changes; field validation; saving; save success; fetch/save error with safe retry. Missing optional values remain blank, not fabricated.

**Interactions:** Prefill from `/users/me`; update only editable profile fields; retain unsaved form values after server validation errors; seller setup link opens the distinct shop form.

**Responsive:** 375px: single-column fields. 768px: two columns only for short independent fields, address spans full width. 1280px: narrow reading/form column within account shell.

**Accessibility:** Explicit field labels and autocomplete attributes; required/optional status stated in text; save status announced; errors associate with controls; focus order is top-to-bottom.

### 4. Thiết lập gian hàng (`/seller/setup`)

**Layout:** Seller shell with a short explanation of the public shop identity and pickup address. Form is one focused group; no KYC or approval step is implied.

**Components:** Shop name, pickup address, character/length guidance, save button, link back to seller products after successful setup.

**States:** Loading existing shop data; new setup; edit setup; invalid name length; submitting; saved; account blocked or permission error; server/network error.

**Interactions:** Enforce shop name length 3-50 characters; save with `PATCH /users/me/shop`; successful first setup opens seller products; edits do not change historical order snapshots.

**Responsive:** 375px: full-width stacked controls and action. 768px: centered form column. 1280px: seller navigation plus a constrained main form.

**Accessibility:** Visible labels, helper copy, associated validation, keyboard operation, 44px controls; clearly explain that pickup address is for fulfillment, not the public shop header unless product policy explicitly exposes it.

### 5. Gian hàng công khai (`/shops/:sellerId`)

**Layout:** Public shell; shop identity header followed by the seller's active public products. Shop details occupy a compact band, not a dashboard card. Product results use the same grid and item treatment as public search.

**Components:** Shop name, joined date and product count when returned, product grid, sort control if supported, pagination/load-more pattern aligned to API pagination.

**States:** Shop loading; populated; shop missing or seller banned (not found state); no active products; product fetch error with retry.

**Interactions:** Select a product to open detail; back navigation returns to the prior discovery context; shop-level filtering remains scoped to the seller.

**Responsive:** 375px: compact shop header and two-column product grid if image/text legibility remains intact, otherwise one column for narrow devices. 768px: two or three columns based on available width. 1280px: four columns with fluid container and stable image ratio.

**Accessibility:** Shop name is the page heading; product image alt text describes the product; product title is the link name; item price and stock status are text; pagination controls are keyboard accessible.

### 6. Sản phẩm và danh mục (`/` and `/products`)

**Layout:** Public discovery shell. Search and active filters precede a results heading and count. Desktop filters sit in a narrow sidebar; mobile filters open in a labeled sheet. Product media leads each item; avoid equal decorative feature cards and avoid fake inventory metrics.

**Components:** Search input, category navigation, price range, sort control, active filter chips, product grid, pagination, product item with image/name/price/shop link, semantic out-of-stock label.

**States:** Initial skeleton; populated results; no result with clear-filter action; empty catalog; invalid filter; API error with retry. Only active and unblocked products are displayed.

**Interactions:** Search, category, seller, price, and sort update query parameters so results can be shared and browser back works. Product cards navigate to details. `Hết hàng` is visible when stock is zero; do not offer add-to-cart from list.

**Responsive:** 375px: 2-column image-first grid with concise names and prices; filters in bottom sheet; search remains easy to reach. 768px: filter drawer/sidebar and 3-column grid. 1280px: fixed-width filter rail and 4-column results grid; navigation remains one line.

**Accessibility:** Search has a visible/accessible label; filter controls have labels and current values; result count announced after updates; product images have meaningful alt text; sort and pagination work by keyboard; no color-only stock indicator.

### 7. Danh mục sản phẩm (`/categories/:slug`)

**Layout:** Reuse discovery shell with category title and optional category image only if real category media exists. The selected category is clear above results; category choice does not require a separate decorative landing hero.

**Components:** Category title, category navigation/filter, inherited search/sort/price controls, product grid, pagination, reset-filter action.

**States:** Category loading; populated; no active category products; invalid or inactive category; product fetch error.

**Interactions:** Search and sort stay scoped to the selected category; changing category updates route and browser history; inactive/missing category shows a not-found state rather than invented content.

**Responsive:** 375px: title and filter trigger above two-column grid. 768px: filters can sit beside three-column grid. 1280px: same discovery layout as product listing.

**Accessibility:** One page-level heading; current category indicated with text and selected state; filters keyboard operable; product and pagination accessibility match the product listing screen.

### 8. Chi tiết sản phẩm (`/products/:id`)

**Layout:** Public shell; desktop two-column product view with image gallery on the left and product title, price, availability, seller, quantity, and actions on the right. Description and details follow below as a readable text section. Mobile stacks gallery before purchase information and keeps the primary action reachable without obscuring content.

**Components:** Responsive product gallery, image thumbnails, product name, VNĐ price, stock status, description, category link, seller shop link, quantity control, add-to-cart button, login redirect prompt for guests.

**States:** Loading skeleton with reserved image ratio; available; sold out; missing/hidden/blocked not-found; guest; signed-in buyer; own product; add-to-cart pending/success/error. Owner/Admin-only moderation details are not public.

**Interactions:** Gallery selection supports keyboard; add-to-cart requires login and redirects to `/login` when guest; admin cannot buy; seller cannot buy their own product; disable purchase for stock zero; quantity cannot exceed current stock; display errors inline or as an announced concise message.

**Responsive:** 375px: stacked media and details; gallery thumbnails horizontally scroll only within the gallery with clear controls, not page-level overflow; purchase CTA remains in normal flow or an accessible sticky bottom action that does not cover content. 768px: two-column media/detail layout when space permits. 1280px: generous image region and constrained purchase panel.

**Accessibility:** Descriptive image alt text, selected thumbnail state, labeled quantity controls, explicit stock text, accessible disabled explanation, keyboard-operable gallery, all CTA labels contrast against their backgrounds.

### 9. Giỏ hàng (`/cart`)

**Layout:** Customer shell. Items are grouped by shop using headings and sparse hairline separators. Desktop places the order summary alongside the list; mobile puts summary after items and may provide a non-obscuring sticky checkout action.

**Components:** Shop group, product thumbnail/name/price, quantity selector, remove action, item subtotal, overall total in VNĐ, checkout button, unavailable item notice if the API surfaces it.

**States:** Loading skeleton; empty cart with `Khám phá sản phẩm` action; populated by multiple shops; quantity update pending; stale/out-of-stock/hidden item removed with explanation; fetch/update error and retry. No guest-cart merge state exists.

**Interactions:** Update quantity within current stock; remove item; clear cart only with confirmation if provided; checkout requires login and excludes admin; user cannot buy own product; totals are display estimates and are recalculated by the server at order creation.

**Responsive:** 375px: each item is a compact horizontal row with image, title, quantity, and remove action; shop grouping remains visible; totals stack below. 768px: wider item rows, summary may move to a side column. 1280px: list and fixed-width summary columns.

**Accessibility:** Shop groups use headings; buttons expose product-specific accessible names; quantity inputs announce bounds; updated total is announced politely; destructive removal has clear confirmation/undo only if implemented; touch controls meet 44px.

### 10. Thanh toán (`/checkout`)

**Layout:** Focused checkout shell with recipient form as the primary column and an item/shop summary as a secondary column. Mobile stacks summary after recipient details and before the single submit action. Explain that a multi-shop order creates separate shop orders with one VNPay payment.

**Components:** Prefilled full name, phone, address fields; grouped cart summary by shop; VNĐ total; expiry/payment note where applicable; primary `Tiếp tục thanh toán` action; inline availability/validation messages.

**States:** Loading profile/cart; populated form; missing phone/address; empty/invalid cart; submitting; stock conflict or unavailable product; server error; success redirect to VNPay. Never create checkout when any item fails validation.

**Interactions:** Prefill from profile; allow permitted recipient/address updates; submit once; show clear progress; server is source of truth for price and stock; redirect using returned VNPay URL only after successful order creation; do not allow admin checkout.

**Responsive:** 375px: single column, concise shop groups, summary immediately above submit action. 768px: form and summary columns if both remain readable. 1280px: form main column with summary rail. No tiny or fixed overlay hiding the action.

**Accessibility:** Labels and autocomplete for recipient details; required fields named; error summary links to affected fields; total has a textual label; pending state is announced and button disabled semantically; VNPay redirect is explained before leaving the site.

### 11. Kết quả thanh toán (`/checkout/result?checkoutCode=...`)

**Layout:** Focused status page in the customer shell. One clear outcome heading and concise explanation, followed by checkout code and the resulting seller orders. Each order links to its own detail. Avoid celebratory animation or status based solely on URL query parameters.

**Components:** Status heading/icon, checkout reference, server-verified payment state, order links/status labels, `Xem đơn mua` and context-appropriate `Thử thanh toán lại` or `Tiếp tục mua sắm` actions.

**States:** Verifying/loading; paid; failed; expired; still pending; unknown checkout; fetch/network error. The client must fetch `/checkouts/:checkoutCode` and never trust `?status=` as proof.

**Interactions:** Polling is not assumed unless explicitly implemented; provide a retry/check-status action for pending or fetch failure. Paid state links to order history; failed/expired state explains that the cart is retained and stock was released according to server result.

**Responsive:** 375px: stacked status and order summaries, full-width primary action. 768px: centered readable content. 1280px: constrained content width with seller orders grouped vertically.

**Accessibility:** Outcome includes text, not only icon/color; status changes use a polite live region; keyboard focus moves to the result heading after navigation; order links identify seller/order; no auto-focus trap.

### 12. Đơn mua (`/orders/my`)

**Layout:** Account shell with title, status filter, and paginated orders grouped by checkout code. Within each checkout group, each seller order is independently identified. Use responsive order rows/cards, not a dense desktop-only table.

**Components:** Status filter, checkout group header, order row with code/shop/date/total/status, detail link, pagination.

**States:** Loading rows; no orders with discovery action; populated; empty filter; pagination loading; server error; expired/failed orders retain their explicit state.

**Interactions:** Filter by supported status; open order detail; query state is reflected in URL; each order can progress independently even when it shares a checkout code.

**Responsive:** 375px: each order is a stacked summary card with checkout group label. 768px: compact rows with status and total aligned. 1280px: wider list table-like layout with named column headers and sparse dividers.

**Accessibility:** Use list/article semantics or a properly marked-up table; filters have labels; status text is explicit; group headings clarify shared checkout; pagination names include direction/page; keyboard navigation remains predictable.

### 13. Chi tiết đơn mua (`/orders/my/:id`)

**Layout:** Breadcrumb/back link, order status and code, seller identity, snapshot item list, recipient details, and total. Keep immutable order snapshot values visually distinct from live product pages.

**Components:** Status label, order/checkout reference, item rows with snapshot image/name/price/quantity, recipient block, total, seller shop link if available, payment state.

**States:** Loading; owned order; not found including another user's order; network error; order in pending/confirmed/shipping/delivered/cancelled/refunded states.

**Interactions:** Back returns to order history; product links appear only when the item remains publicly available; customer has no unsupported cancellation/refund controls.

**Responsive:** 375px: vertically stacked sections and item rows. 768px: two-column recipient/order metadata where practical. 1280px: order content constrained to readable width with summary rail.

**Accessibility:** Status and payment state are textual; item names and images have accessible descriptions; headings divide recipient/items/payment; privacy-sensitive recipient values are not placed in page title or URL.

### 14. Sản phẩm của tôi (`/seller/products`)

**Layout:** Seller shell with page title, primary `Thêm sản phẩm` action, and filters for active/hidden/blocked state. Product rows use image, name, stock, price, visibility, and explicit block reason when present. Avoid a generic metrics dashboard.

**Components:** Search/filter controls, product image and details, stock/price, visibility status, edit action, hide/show or soft-delete control, block reason notice, pagination.

**States:** Loading skeleton; no products with add action; populated; no filter results; hidden product; admin-blocked product with reason; fetch/update error.

**Interactions:** Route to create/edit form; toggle active state without overriding admin block; display block reason; soft-deleted products remain non-public; paginate/search using supported API parameters.

**Responsive:** 375px: product rows become stacked cards with action menu; 768px: compact rows; 1280px: list/table layout with clear headers. No page-level horizontal scrolling.

**Accessibility:** Every product row has a named heading; visibility is text plus optional semantic icon; action menus have accessible names and keyboard support; destructive action asks for confirmation; image alt text uses product name.

### 15. Thêm hoặc sửa sản phẩm (`/seller/products/new`, `/seller/products/:id/edit`)

**Layout:** Seller shell and focused form. Name, category, description, price, stock, and image manager are ordered by creation task. Preview is an actual form-driven preview, not a fake screenshot. Existing blocked state/reason is shown read-only when editing.

**Components:** Name field, category select, description field, integer VNĐ price, nonnegative stock, image upload/drop zone, up to five thumbnails with reorder/remove, primary save action, cancel/back link, inline block state.

**States:** Initial; loading edit data; upload progress/error; invalid fields; submitting; save success; permission error; edit target missing; Cloudinary or API failure. Draft values are retained after recoverable errors.

**Interactions:** First image is the cover; accept JPEG/PNG/WebP up to 5MB and at most five Cloudinary images; reorder/remove images; create makes product public according to API defaults; seller cannot change ownership, slug, or moderation fields. Edit form never exposes mass-assignment fields.

**Responsive:** 375px: single-column fields and image strip; 768px: details and image manager may form two balanced columns; 1280px: constrained form main column with optional real preview rail. Image thumbnails reflow without overflowing.

**Accessibility:** Visible labels and helper text; upload supports keyboard file selection and announces progress/errors; thumbnail reorder/remove actions have names; errors associate with fields; inputs and controls have 44px hit height.

### 16. Đơn bán (`/orders/selling`)

**Layout:** Seller shell with title, status filters, and a scannable list of only the signed-in seller's orders. Emphasize order state and next allowed action. No cross-seller rows.

**Components:** Status filter, order row/card with order code, buyer/recipient summary as permitted, date, total, item count, status, detail link, pagination.

**States:** Loading; no orders; populated; empty filter; pending payment orders are labeled as pending with no manual confirmation action; list/fetch error.

**Interactions:** Open detail; filter status; seller action controls appear only for valid transitions: confirmed to shipping, shipping to delivered, confirmed to cancelled with mandatory reason. No manual pending/confirmed/refunded action.

**Responsive:** 375px: stacked order summaries; 768px: compact list rows; 1280px: structured table-like list with responsive columns and no clipped action controls.

**Accessibility:** Status text is explicit; action buttons name the destination state; filters and pagination are labeled; no transition depends on color; recipient data is minimized to what is operationally needed.

### 17. Chi tiết đơn bán (`/orders/selling/:id`)

**Layout:** Order status and permitted next steps at top, followed by order item snapshot, recipient/pickup context, payment state, and a clear event/summary area. Actions are grouped separately from read-only data.

**Components:** Status label, item snapshots, order/checkout references, recipient address, payment state, `Giao hàng`, `Đã giao`, and `Hủy đơn` controls when valid, reason dialog for cancellation.

**States:** Loading; owned order; missing/other seller order not found; pending payment with actions unavailable; confirmed/shipping/delivered/cancelled/refunded states; mutation pending/error/success.

**Interactions:** Only legal transitions are shown. Cancellation requires a non-empty reason and confirmation. Double-submit is prevented; stock restoration is server-owned and not represented as a client-side action.

**Responsive:** 375px: sections stack and primary valid action spans available width. 768px: order details and recipient summary can sit side by side. 1280px: main item list and narrow action/status rail.

**Accessibility:** Dialog traps focus, names its purpose, returns focus to opener, and labels reason input; status transition explanation is textual; controls are disabled with explanation when action is invalid.

### 18. Bảng điều khiển quản trị (`/admin`)

**Layout:** Admin shell with a concise title and navigation to user, product, category, and order management. This is an operational index, not an analytics dashboard: PRD excludes an analytics/reporting feature and does not define aggregate metric endpoints. Show real action-needed links only if their data is available.

**Components:** Admin navigation, links to each management area, optional real counts only when supplied by an existing supported endpoint, sign-out/account control.

**States:** Loading user authorization; authorized overview; unauthorized redirect/403; server error. Do not fill missing endpoint data with fake statistics.

**Interactions:** Navigation to management pages; admin role guard; no purchase/cart/selling affordance.

**Responsive:** 375px: collapsible admin menu and vertical navigation links. 768px: compact nav with content. 1280px: fixed-width sidebar and open main area.

**Accessibility:** Current nav item uses `aria-current`; navigation landmarks are labeled; actions are text-labeled; unauthorized state is understandable without relying on color.

### 19. Quản lý người dùng (`/admin/users`)

**Layout:** Admin shell with search and filters above a responsive user list. Ban state and shop presence are explicit. Keep destructive controls at row end, separated from identity fields.

**Components:** Search, role/active filters, user list with name/email/role/active/shop state, ban/unban action, confirmation dialog, pagination.

**States:** Loading; empty directory; no matching results; active/banned users; current admin row with self-ban disabled; fetch/mutation error; success confirmation.

**Interactions:** Search/filter/paginate; ban requires confirmation and explains that products may be blocked; unban confirms the action; admin cannot ban self; server errors retain filter state.

**Responsive:** 375px: user rows become labeled summary blocks with action menu. 768px: compact table with selected key fields. 1280px: full table with search/filter rail; no forced page-level overflow.

**Accessibility:** Table has caption or labeled region and header associations; ban dialog explains impact and receives focus; buttons say `Khóa tài khoản` or `Mở khóa tài khoản`; active state is text and icon, not color alone.

### 20. Kiểm duyệt sản phẩm (`/admin/products`)

**Layout:** Admin shell with search/status/seller filters and an image-first product moderation list. Block reason is visible in blocked rows. Moderation actions are distinct from ordinary seller editing.

**Components:** Search/filter controls, product thumbnail/name/seller/category/visibility, block reason, block/unblock dialog, pagination.

**States:** Loading; empty list; no results; active/hidden/blocked product; block reason required; self or invalid target errors; fetch/mutation error.

**Interactions:** Filter all products including hidden and blocked; block requires a reason; unblock is explicit; do not imply seller can override admin block. Ban cascade reason remains distinguishable from admin-set block reason.

**Responsive:** 375px: product summaries with moderation menu and reason below the title. 768px: compact rows. 1280px: structured table/list and a dedicated reason column where width permits.

**Accessibility:** Product rows and moderation actions have descriptive names; dialog has required reason label and inline error; state and reason are readable text; keyboard focus returns to the originating row.

### 21. Quản lý đơn hàng quản trị (`/admin/orders`)

**Layout:** Admin shell with filters for status, seller, and buyer. Show all orders in responsive list form; order details expose permitted state controls. Keep checkout grouping clear but recognize each seller order is independent.

**Components:** Status/seller/user filters, order list with order/checkout code, buyer, seller, date, total, status, detail link, pagination; refund action only for eligible paid cancelled order.

**States:** Loading; no orders; empty filter; pending; confirmed/shipping/delivered/cancelled/refunded; fetch/mutation error. Pending orders have no manual cancellation action.

**Interactions:** Open detail; apply supported filters; allow transitions matching the order state machine; `cancelled` to `refunded` only for paid orders; never imply payment reversal is automatic if it is handled manually.

**Responsive:** 375px: each order becomes a labeled summary card. 768px: compact rows with details link. 1280px: table-like listing with seller/buyer columns and actions that remain visible.

**Accessibility:** Filters are labeled; table headers are associated; transitions are named in text; refund confirmation explains eligibility and manual nature; no status is conveyed by color alone.

### 22. Quản lý danh mục (`/admin/categories`)

**Layout:** Admin shell with category list and a visible `Thêm danh mục` action. Create/edit form is inline in a dialog or an adjacent constrained pane; delete uses a confirmation dialog. Public category navigation is distinct from this admin page.

**Components:** Category name/image if supported; active state if exposed by API; create/edit form; category list; delete confirmation; product-use error feedback; pagination only if API supports it.

**States:** Loading; empty categories; populated; create/edit validation; duplicate name; delete blocked because products still use category; delete confirmation; server/network error.

**Interactions:** Create, edit, and delete with confirmation; slug is generated by server and is not an editable field; deleting a category with products is rejected with the server explanation; public lists show active categories only.

**Responsive:** 375px: category rows stack with actions in an accessible menu; form is full-width dialog/sheet. 768px: list and form may sit side by side if both fit. 1280px: list main area with a narrow edit pane or dialog.

**Accessibility:** Dialog semantics, visible labels, inline duplicate/required errors, keyboard operation, and focus restoration; delete confirmation names the category; active state uses visible text.

## Design Anti-Patterns to Avoid

- Do not ship default shadcn/ui appearance without applying the specified black/white palette, pill action shape, and hairline treatment.
- No purple/blue gradients, glows, decorative background textures, dark-mode section flips, or gratuitous animation.
- No repeated three-equal-card dashboard or marketing layouts. Use plain groups, structured lists, and product grids according to content.
- No placeholders as labels, icon-only actions without names, color-only status, tiny touch targets, hidden focus, or error-only toast feedback.
- No fake inventory, fake analytics, invented shipping/payment guarantees, made-up shop counts, or fabricated customer testimonials.
- No fake product images or fake screenshots. Product media comes from real uploaded images; empty/loading states use neutral skeletons only.
- Avoid long divider under every metadata line. Use hairlines to clarify groups, not as decoration.
- Do not add unsupported admin, seller, or customer actions. Respect the auth, ownership, checkout, stock, and order state rules in `SPECIFICATIONS.md`.

## Diagram Status

The architecture and checkout flow are diagram-worthy. The Archify CLI/package was not found in the environment (`command -v archify` and local package search returned no executable), so diagram generation was skipped as a best-effort blocker. No diagram is claimed or referenced as generated. Scalability Option is off, so this spec intentionally has no Architecture & Infrastructure section.

## Pre-Flight Check, Section 14

This is a product application, not a marketing landing page. Landing-only hero/image/logo-wall requirements are not applicable; interaction, theme, color, type, and accessibility checks are evaluated against the specified app screens.

| Check | Result | Evidence / decision |
|---|---|---|
| Brief inference declared | PASS | Design Read appears above and reflects the marketplace, audience, style, and system. |
| Three dials explicit and reasoned | PASS | Variance 5, motion 3, density 5 with context. |
| Design foundation selected | PASS | Customized shadcn/ui + Tailwind is canonical stack and a single owned component system. |
| Redesign audit | N/A | New app design; no existing product UI to preserve. |
| Zero em-dash/en-dash separator | PASS | New design artifacts use ordinary hyphens only. |
| Theme lock | PASS | Light-only MVP explicitly selected; white and `#f5f5f5` are the two canvases. |
| Color consistency | PASS | Black primary; semantic colors limited to status foregrounds. |
| Shape consistency | PASS | Pill buttons, 8px controls, 12px grouped surfaces, hairline rules. |
| Button contrast | PASS | Black with white text measures 21:1 on white; white button labels use black text. |
| CTA label wrapping | PASS | Short Vietnamese action labels; mobile full-width, desktop intrinsic width. |
| Form contrast | PASS | Measured normal-text contrast on white / `#f5f5f5`: secondary `#52525b` 7.73:1 / 7.09:1; muted `#62626b` 6.04:1 / 5.54:1; success `#067647` 5.69:1 / 5.22:1; warning `#854d0e` 6.85:1 / 6.28:1; error `#b42318` 6.57:1 / 6.03:1. Focus outline is black. |
| Serif and premium palette checks | N/A | No serif and no beige/brass premium palette. |
| Italic descender clearance | N/A | No italic display treatment specified. |
| Landing hero and marketing composition checks | N/A | These are task-oriented application screens, not landing pages. |
| Eyebrow count and section layout repetition | PASS | No decorative eyebrow system or repeated marketing section families. |
| CTA intent duplication | PASS | Primary action is unique to its task; no duplicate marketing CTA intent. |
| Logo-wall and bento checks | N/A | No logo wall or bento marketing grid. |
| Copy self-audit | PASS | UI examples are direct Vietnamese functional labels; no invented claims or filler copy. |
| Motion motivation and reduced motion | PASS | Motion is feedback-only at intensity 3; no continuous/automatic choreography. |
| Desktop navigation fit | PASS | Shared shell caps desktop header at 64-72px and keeps primary nav on one line. |
| Long-list and data density | PASS | Responsive list/table patterns, filters, pagination, and mobile row cards are specified. |
| Real images and no fake previews | PASS | Only real seller-uploaded product/category media; skeletons reserve space. |
| No overlays/captions/version labels/scroll cues | PASS | None specified. |
| No decorative status dots | PASS | Status uses meaningful text/icon; no decorative dots. |
| No repeated row borders as decoration | PASS | Hairlines separate meaningful groups, not every metadata line. |
| Content density | PASS | Moderate density; no invented metrics or data dumps. |
| Dark mode tokens/test | OVERRIDDEN | Explicit selected MVP theme is light-only. Do not implement a second theme without a scope change. |
| Mobile collapse explicit | PASS | All 22 screens specify 375px, 768px, and 1280px behavior. |
| Viewport stability | PASS | No full-height hero or `100vh` pattern is specified. |
| Loading, empty, error cycles | PASS | Each screen defines meaningful load/empty/error and relevant permission states. |
| Cards vs grouping | PASS | Flat content groups and hairlines are preferred; containers only communicate task hierarchy. |
| Icon source | PASS | Lucide retained because it is the project's canonical dependency; no hand-drawn icons or emoji. |
| Core Web Vitals | PASS | Responsive image sizing, lazy loading below fold, reserved media dimensions, and restrained client motion are required at implementation. |
| One design system | PASS | Customized shadcn/ui only. |

**Gate result: PASS.** Design tokens and screen specifications are ready for user confirmation before UI implementation. Diagram generation remains the sole best-effort blocker.
