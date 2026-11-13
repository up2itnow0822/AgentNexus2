/**
 * ESM-safe Docker HEALTHCHECK probe (CommonJS; no require('http') under type:module).
 */
// Honor the same PORT the app binds (Dockerfile sets production default via ENV).
const port = process.env.PORT || '8200';
const url = `http://127.0.0.1:${port}/health`;

fetch(url)
  .then((response) => {
    process.exit(response.status === 200 ? 0 : 1);
  })
  .catch(() => {
    process.exit(1);
  });
