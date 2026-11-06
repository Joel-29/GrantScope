# Design system · Module 2

The interface uses navy/near-black and daylight surfaces, emerald accents, violet privacy details, amber review styling, and red error/destructive styling. Colors do not imply a verified network route. All live metrics remain unmeasured.

## Foundations

`src/styles/tokens.css` defines semantic canvas, panel, raised/hover surface, text, border, accent, violet, amber, danger, radius, and spacing tokens. `globals.css` supplies base typography and shell/landing layouts. `components.css` supplies reusable components and responsive behavior. Numeric text uses tabular figures; fonts are local system fonts with no remote fetch.

`ThemeProvider` applies the resolved theme to the document. `useTheme` subscribes to the device color-scheme query and cleans up the listener. Dark is the initial preference. Native settings radio buttons select dark/light/system; the header button explicitly selects the opposite resolved theme. Preferences stay in memory and reset on reload. System changes are followed only while System is selected. No wallet or interface data is written to local storage.

## Shared components

| Component                | Purpose and behavior                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Button                   | Native button, typed variants/sizes, visible focus, real disabled state, forwarded ref                                |
| Badge                    | Neutral, accent, violet, warning, danger; text always accompanies color                                               |
| Panel / PageHeader       | Consistent section labels, heading hierarchy, optional actions                                                        |
| Notice / StatePanel      | Unavailable and empty context; errors use alert semantics; recovery action supplied by caller                         |
| InfoDialog               | Radix modal with title, description, close actions, focus containment, Escape dismissal and trigger-focus restoration |
| WorkspaceSkeleton        | One loading announcement with busy state; decorative blocks hidden from assistive technology                          |
| PermissionInventory      | Native desktop table with caption and header scopes; mobile cards replace the table below 700px                       |
| MetricCard / AccountCard | Unmeasured metrics and unselected-account state; no fabricated balances or counts                                     |
| TransportReadiness       | Explicitly uninitialized prerequisites, not invented worker progress                                                  |

Dialog behavior follows the [Radix Dialog contract](https://www.radix-ui.com/primitives/docs/components/dialog). Table semantics use native HTML as recommended by [WAI’s table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/). Automated keyboard checks supplement these primitives; no claim of a complete accessibility audit is made.

## Responsive and accessible behavior

- Desktop sidebar collapses to labeled icons; mobile navigation uses a modal dialog.
- Header provides a real theme action, inactive transport explanation, inspection-boundary dialog, and empty activity drawer. None connects a wallet.
- Settings use native fieldsets, radios, labels, and disabled network selectors with explanatory text.
- Form fields have associated labels. Disabled permission filters explain why they are unavailable.
- Route navigation focuses the main landmark; a skip link supports keyboard navigation.
- Skeleton animation stops under reduced motion. Forced-color styles retain component boundaries.
- Components fit a 320px viewport and support mobile card layouts. Dialogs scroll internally within the viewport.

## Isolated previews

`/design-system` exists only in Vite development mode. All fictional records live in `src/design-system/fixtures.ts`, imported only by the workshop. The workshop labels names, amounts and assessments as fixtures and makes no network requests. Its loading/error controls are manual design tools, not a blockchain simulation.

Production pages instantiate `PermissionInventory` only in its unavailable mode; they cannot pass rows through that variant. The preview variant demonstrates searching, filtering, clear-filter recovery, empty/loading/error states, and mobile rows. No approve, revoke, signing, balance or provider code is included.

`scripts/check-production.mjs` runs after every production build to reject known workshop content in emitted JavaScript. Playwright separately checks that the workshop is available during development and returns 404 in production. Source code and UI tests are not proof of a working anonymous transport.
