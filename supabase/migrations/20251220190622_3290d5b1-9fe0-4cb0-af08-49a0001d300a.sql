-- Add SELECT policy for admins to view orders (the table currently only has INSERT and ALL policies but no explicit SELECT for admins)
-- The "Admins can manage all orders" policy with ALL command should cover SELECT, but let's ensure it's explicit

-- First, let's drop and recreate the policies to be more explicit
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Create explicit SELECT policy for admins
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));