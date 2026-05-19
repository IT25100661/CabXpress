# Changelog

## [1.0.1] - 2026-05-06
### Added
- Feature: Added Vehicle image upload mechanism in `VehicleController` supporting local multipart mapping and React Admin Dashboard interaction.
- Feature: Added proper map routing using OpenRoute API key integration within `MapsService`.
- Backend: Created `WebConfig.java` to serve static uploaded files correctly.

### Fixed
- Fixed Route Conflict: Adjusted mapping inside `BookingController` so that `/my-bookings` doesn't conflict with `/{id}` wildcard route.
- Admin Dropdowns: Prevented unintended unmounting and rapid closing of React user navigation dropdowns utilizing proper generic hover and mouse events.
- Stale Pages: Bound `<Routes>` mapping context to React `<App/>` router pathname so that all admin CRUD pages refetch live configurations instead of displaying stagnant states when navigating via the browser back button.
- CRUD Interfaces: Completed Admin missing CRUD routes (`ReviewController`, `ContactController`). Updated React `AdminPages.tsx` component to utilize real interactive inputs connected to backend API resources, stepping away from strictly visual UI-mocks.
- Clean-up: Purged "university" / "demo evaluation" project mentions making the UI fully production-ready.
- Pricing logic, fallback locations, and Stripe payments are correctly capturing env keys.