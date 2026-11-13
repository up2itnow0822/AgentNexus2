/**
 * ESM-safe Docker HEALTHCHECK probe (CommonJS; no require('http') under type:module).
 */
const port = process.env.PORT || '3000';
const url = `http://127.0.0.1:${port}/health`;

fetch(url)
  .then((response) => {
    process.exit(response.status === 200 ? 0 : 1);
  })
  .catch(() => {
    process.exit(1);
  });
