-- Default State Mappings
-- Since seed.sql runs as a database admin, we will write a base trigger or seed records if user_id is static or let the application seed these dynamically upon authentication.
-- Below is the standard SQL to insert templates or seed default records.

-- Note: The application will check and initialize these state mappings and categories automatically for the authenticated user to ensure a perfect Zero-Configuration bootstrap.

-- Examples:
-- INSERT INTO public.state_group_map (state_name, state_group) VALUES
-- ('Backlog', 'backlog'),
-- ('Triage', 'unstarted'),
-- ('Todo / Unstarted', 'unstarted'),
-- ('In Progress (Dev)', 'started'),
-- ('In Progress / Doing', 'started'),
-- ('In Review', 'started'),
-- ('Done / Completed', 'completed'),
-- ('Cancelled / Canceled', 'cancelled');
