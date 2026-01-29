-- Migration 1: Add admin role to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';