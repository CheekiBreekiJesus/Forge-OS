# 07 UI UX Direction

## 1. Visual Style

Desired style:
- Clean industrial dashboard
- Modern SaaS interface
- Practical and functional
- Not overly decorative
- Suitable for factory and office use

Suggested visual tone:
- Neutral background
- Strong hierarchy
- Clear cards/tables
- Compact data-dense screens where useful
- Large readable actions for shop-floor/tablet use

Brand direction:
- Industrial
- Reliable
- Modern
- Operational
- Precise

## 2. UX Principles

- Factory users must be able to complete tasks quickly.
- Forms should be simple and forgiving.
- Avoid hiding important actions.
- Use clear statuses.
- Prioritize search and filtering.
- Support keyboard-friendly admin workflows.
- Support tablet-friendly shop-floor workflows.
- Reduce repeated data entry.
- Allow drafts/incomplete records.
- Make production sheets printable/exportable.
- Use plain operational language.

## 3. Important Screens / Pages

Recommended MVP screens:
1. Login
2. Tenant/company switcher if multi-tenant user support exists
3. Dashboard
4. Customers list
5. Customer detail
6. Products list
7. Product detail
8. Orders list
9. Order detail
10. Production jobs list
11. Production job detail
12. Technical sheet view/edit
13. Inventory list
14. Machines list
15. Machine detail
16. Settings
17. Language selector

JH Gomes-specific useful screens:
- Cup printing job creation
- Cup size setup sheet
- Production run tracking
- Print/export technical sheet

## 4. Navigation Structure

Suggested sidebar:
- Dashboard
- Customers
- Orders
- Production
- Products
- Inventory
- Machines
- Maintenance
- Marketing
- Reports
- Settings

Suggested production subnavigation:
- Jobs
- Technical Sheets
- Machines
- Setup Checklists
- Quality Logs

## 5. Accessibility Considerations

- Use readable font sizes.
- Maintain sufficient contrast.
- Avoid relying on color alone for status.
- Add labels to form inputs.
- Ensure keyboard navigation works.
- Make buttons large enough for tablet use.
- Support Portuguese text length expansion.
- Avoid dense UI on mobile unless necessary.

## 6. Localization / i18n Notes

Required locales:
- `pt-PT`
- `en`

Future:
- `es`

Rules:
- Backend/internal naming remains English.
- User-facing text must come from translation dictionaries.
- Default deployment language for JH Gomes: `pt-PT`.
- Avoid Brazilian Portuguese terms in `pt-PT`.
- Use locale-aware date and number formatting.
- Use locale-aware currency formatting where relevant.

Potential translation structure:
- `locales/en/common.json`
- `locales/pt-PT/common.json`
- `locales/en/production.json`
- `locales/pt-PT/production.json`

Open Question:
- Which i18n library should be used?
