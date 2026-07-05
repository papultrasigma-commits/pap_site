-- Correção de RLS para permitir que os administradores banam utilizadores.
-- Este script precisa de ser executado no SQL Editor do Supabase.

-- 1. Cria uma política que permite a utilizadores com is_admin = true atualizar a tabela profiles
CREATE POLICY "Admins podem atualizar profiles"
ON public.profiles
FOR UPDATE
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Nota: Se já houver outras políticas, pode ser necessário ajustá-las.
-- Verifica também se a política "Os utilizadores podem atualizar o próprio perfil" existe:
-- CREATE POLICY "Utilizadores podem atualizar o próprio perfil"
-- ON public.profiles FOR UPDATE USING (auth.uid() = id);
