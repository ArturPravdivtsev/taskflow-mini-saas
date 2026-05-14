CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO tasks (title, done)
SELECT 'Learn Kubernetes', false
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Learn Kubernetes'
);

INSERT INTO tasks (title, done)
SELECT 'Build Vue app', true
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Build Vue app'
);
