// prisma.config.ts
import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  // Ruta de tu schema
  schema: 'prisma/schema.prisma',

  // Opcional, pero recomendable para tener las migraciones ordenadas
  migrations: {
    path: 'prisma/migrations',
  },

  // Aquí es donde ahora va la URL de la base de datos
  datasource: {
    url: env('DATABASE_URL'),
  },
});

