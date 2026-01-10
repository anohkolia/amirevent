# TODO: Connect HomeView to Supabase Database

## Problem

- Admin creates events → Data saved to Supabase ✅
- HomeView loads events → Uses mock data ❌

## Solution

Update `stores/events.ts` to fetch from Supabase instead of mock data.

## Tasks

### 1. Update `src/stores/events.ts`

- [x] Analyze current store structure
- [x] Replace mock data with Supabase queries
- [x] Add fetchPublishedEvents() for HomeView
- [x] Add fetchEventById() for EventDetails
- [x] Add fetchTicketTypes() for ticket selection
- [x] Add grouped ticket types for EventCard price display

### 2. Fix Type Compatibility

- [x] Update `src/views/EventDetails.vue` - use string id, fix formatTime
- [x] Update `src/views/HomeView.vue` - pass ticketTypes to EventCard
- [x] Update `src/components/TicketSelector.vue` - use capacity instead of available
- [x] Update `src/stores/cart.ts` - use string IDs

### 3. Test Integration

- [ ] Verify HomeView loads events from Supabase
- [ ] Verify EventCard displays correct data with prices
- [ ] Verify EventDetails shows tickets from Supabase

## Progress

- [x] Analyzed codebase and understood the issue
- [x] Created implementation plan
- [x] Implemented store updates
- [x] Fixed all type compatibility issues
- [ ] Testing the integration (待测试)
