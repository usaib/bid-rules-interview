import { createApp } from './app';
import { loadSeed } from './db';

const PORT = Number(process.env.PORT ?? 4000);

loadSeed();
createApp().listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
