# Security Fixes TODO

## Task 1: Remove Sign Up Tab from AdminLogin.vue ✅

- [x] Remove "Sign Up" tab button from template
- [x] Remove signup section (v-else)
- [x] Remove handleSignup function
- [x] Remove activeTab ref

## Task 2: Create Database Migration for QR Code Support ✅

- [x] Add qr_code column to orders table
- [x] Add unique order_number column
- [x] Add indexes for faster lookups

## Task 3: Create Supabase Edge Function (create-order) ✅

- [x] Create edge function with input validation
- [x] Implement price recalculation from database
- [x] Implement capacity checks
- [x] Implement transaction for order creation
- [x] Generate QR codes for each ticket
- [x] Return order IDs and QR codes

## Task 4: Update CheckoutView.vue ✅

- [x] Remove mock order creation
- [x] Call Edge Function for real order creation
- [x] Pass QR codes to confirmation page

## Task 5: Update ConfirmationView.vue ✅

- [x] Display order number
- [x] Display QR codes
- [x] Add download ticket functionality

---

## Deployment Instructions

### 1. Apply Database Migration

Run the migration in Supabase SQL Editor:

```bash
# Or use Supabase CLI
supabase db push
```

### 2. Deploy Edge Function

```bash
# Navigate to project directory
cd /home/stalker/Bureau/amirevent

# Deploy the edge function
supabase functions deploy create-order --project-ref your-project-ref

# Set environment variables for the function
supabase secrets set --project-ref your-project-ref SUPABASE_URL=https://your-project.supabase.co
supabase secrets set --project-ref your-project-ref SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Verify Edge Function

```bash
# List deployed functions
supabase functions list

# Test the function (optional)
```

### 4. Update Environment Variables

Add to your `.env` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Test the Application

1. Start the development server
2. Try to access `/admin/signup` - should be removed
3. Try to create an order - should create real orders with QR codes
4. Verify capacity checks work by testing edge cases
