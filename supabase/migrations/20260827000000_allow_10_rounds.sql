ALTER TABLE public.rounds DROP CONSTRAINT rounds_round_number_check;
ALTER TABLE public.rounds ADD CONSTRAINT rounds_round_number_check CHECK (round_number BETWEEN 1 AND 10);
