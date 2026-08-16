-- Optional: wipe old Portuguese tables if you already ran the previous migration.
-- Run this BEFORE 001_init.sql only if those tables exist.

drop table if exists public.comunidade_membros cascade;
drop table if exists public.comunidades cascade;
drop table if exists public.usuarios cascade;
drop table if exists public.campi cascade;
drop table if exists public.instituicoes cascade;
