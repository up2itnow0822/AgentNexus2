# Audit reconciliation table

Registry: https://registry.npmjs.org/ | pnpm 10.28.2 | `pnpm audit --prod`

| Summary | main | PR branch |
|---|---:|---:|
| critical | 5 | 0 |
| high | 61 | 28 |

## Ops-tracked override packages

| Package | Advisory (representative) | Before | After | Status |
|---------|-------------------------|--------|-------|--------|
| proxy-addr | GHSA-jqcg-44mw-7w3h | 2.0.7 | 2.0.8 | fixed (pnpm override) |
| tar | GHSA-23hp-3jrh-7fpw | 6.2.1 / <=7.5.18 | 7.5.23 (override) | fixed (pnpm override) |
| shell-quote | GHSA-w7jw-789q-3m8p | 1.8.3 | 1.12.0 | fixed (pnpm override) |
| handlebars | GHSA-8r5x-fm3f-whwj | 4.7.9 | 4.7.10 | fixed (pnpm override) |
| axios | GHSA-pmwg-cvhr-8vh7 | 1.15.0 | 1.21.1 | fixed (pnpm override) |
| undici | GHSA-rfgv-xxqx-mfg5 | 6.24.0 | 6.29.1 | fixed (pnpm override) |
| ws | GHSA-96hv-2xvq-fx4p | 8.18.3 | 8.23.0 | fixed (pnpm override) |
| form-data | GHSA-hmw2-7cc7-3qxx | 4.0.4 | 4.0.6 | fixed (pnpm override) |

## All critical + high advisories on main (status on PR branch)

| Severity | Package | Advisory ID | Vulnerable range | On PR branch |
|---|---|---|---|---|
| critical | handlebars | GHSA-8r5x-fm3f-whwj | >=4.0.0 <=4.7.9 | not reported (fixed or unreachable) |
| critical | handlebars | GHSA-p8wg-vrv2-v86f | >=3.0.0 <=4.7.9 | not reported (fixed or unreachable) |
| critical | proxy-addr | GHSA-jqcg-44mw-7w3h | >=1.1.0 <2.0.8 | not reported (fixed or unreachable) |
| critical | shell-quote | GHSA-w7jw-789q-3m8p | >=1.1.0 <=1.8.3 | not reported (fixed or unreachable) |
| critical | tar | GHSA-23hp-3jrh-7fpw | <=7.5.18 | not reported (fixed or unreachable) |
| high | @babel/plugin-transform-modules-systemjs | GHSA-fv7c-fp4j-7gwp | >=7.12.0 <=7.29.3 | still reported |
| high | @grpc/grpc-js | GHSA-5375-pq7m-f5r2 | >=1.14.0 <1.14.4 | still reported |
| high | @grpc/grpc-js | GHSA-99f4-grh7-6pcq | >=1.14.0 <1.14.4 | still reported |
| high | @grpc/grpc-js | GHSA-m9gg-hp2v-232j | >=1.14.0 <1.14.5 | still reported |
| high | axios | GHSA-pmwg-cvhr-8vh7 | >=1.0.0 <1.15.1 | not reported (fixed or unreachable) |
| high | axios | GHSA-pf86-5x62-jrwf | >=1.0.0 <1.15.1 | not reported (fixed or unreachable) |
| high | axios | GHSA-6chq-wfr3-2hj9 | >=1.0.0 <1.15.1 | not reported (fixed or unreachable) |
| high | axios | GHSA-q8qp-cvcw-x6jj | >=1.0.0 <1.15.2 | not reported (fixed or unreachable) |
| high | axios | GHSA-hfxv-24rg-xrqf | >=1.0.0 <1.16.0 | not reported (fixed or unreachable) |
| high | axios | GHSA-777c-7fjr-54vf | >=1.7.0 <1.16.0 | not reported (fixed or unreachable) |
| high | axios | GHSA-p92q-9vqr-4j8v | >=1.0.0 <1.16.0 | not reported (fixed or unreachable) |
| high | axios | GHSA-j5f8-grm9-p9fc | >=1.0.0 <1.16.0 | not reported (fixed or unreachable) |
| high | axios | GHSA-3g43-6gmg-66jw | >=1.0.0 <1.15.2 | not reported (fixed or unreachable) |
| high | axios | GHSA-35jp-ww65-95wh | >=1.0.0 <1.16.0 | not reported (fixed or unreachable) |
| high | axios | GHSA-pjwm-pj3p-43mv | >=1.15.0 <1.16.0 | not reported (fixed or unreachable) |
| high | axios | GHSA-mghh-pgcx-3jjj | >=1.15.0 <1.20.0 | not reported (fixed or unreachable) |
| high | axios | GHSA-3pq3-5fj3-cg6v | >=1.13.0 <1.20.0 | not reported (fixed or unreachable) |
| high | axios | GHSA-542g-h47m-68v8 | >=1.13.0 <1.20.0 | not reported (fixed or unreachable) |
| high | body-parser | GHSA-27r3-jxmh-p828 | <1.20.9 | not reported (fixed or unreachable) |
| high | brace-expansion | GHSA-3jxr-9vmj-r5cp | <1.1.16 | still reported |
| high | brace-expansion | GHSA-3jxr-9vmj-r5cp | >=3.0.0 <5.0.7 | still reported |
| high | brace-expansion | GHSA-mh99-v99m-4gvg | <1.1.17 | still reported |
| high | brace-expansion | GHSA-mh99-v99m-4gvg | >=4.0.0 <5.0.8 | still reported |
| high | brace-expansion | GHSA-rgw5-rvv9-x895 | >=4.0.0 <5.0.9 | still reported |
| high | brace-expansion | GHSA-rgw5-rvv9-x895 | <1.1.18 | still reported |
| high | brace-expansion | GHSA-qhr7-859c-m2p7 | <1.1.20 | still reported |
| high | brace-expansion | GHSA-qhr7-859c-m2p7 | >=4.0.0 <5.0.11 | still reported |
| high | brace-expansion | GHSA-6j4f-fj2g-mc7p | <1.1.19 | still reported |
| high | brace-expansion | GHSA-6j4f-fj2g-mc7p | >=4.0.0 <5.0.10 | still reported |
| high | browserslist | GHSA-c83g-rgw3-j3cx | <=4.28.6 | still reported |
| high | browserslist | GHSA-73wf-gq98-2v4g | <=4.28.6 | still reported |
| high | compression | GHSA-vc2v-76pw-4v95 | <1.8.2 | still reported |
| high | follow-redirects | GHSA-q3jh-wrc6-jgq8 | >=1.16.0 <1.16.1 | not reported (fixed or unreachable) |
| high | follow-redirects | GHSA-8r9p-f939-6h3c | >=1.16.0 <1.16.1 | not reported (fixed or unreachable) |
| high | follow-redirects | GHSA-mrwp-f3q8-3g9p | >=1.16.0 <=1.16.1 | not reported (fixed or unreachable) |
| high | form-data | GHSA-hmw2-7cc7-3qxx | >=4.0.0 <4.0.6 | not reported (fixed or unreachable) |
| high | image-size | GHSA-5p2g-fcmc-qvqq | >=1.2.0 <=2.0.2 | still reported |
| high | image-size | GHSA-w3rx-r6r6-pgpr | >=0.6.3 <=2.0.2 | still reported |
| high | js-yaml | GHSA-52cp-r559-cp3m | >=3.0.0 <3.15.0 | still reported |
| high | js-yaml | GHSA-5p4m-2wfm-xmqj | >=3.0.0 <3.15.1 | still reported |
| high | js-yaml | GHSA-2883-xcg3-v3hh | >=3.0.0 <3.15.2 | still reported |
| high | langsmith | GHSA-3644-q5cj-c5c7 | <0.6.0 | still reported |
| high | pdfjs-dist | GHSA-hq66-cqwq-w95j | >=5.6.83 <6.2.108 | still reported |
| high | shell-quote | GHSA-395f-4hp3-45gv | <=1.8.4 | not reported (fixed or unreachable) |
| high | tar | GHSA-34x7-hfp2-rc4v | <7.5.7 | not reported (fixed or unreachable) |
| high | tar | GHSA-8qq5-rm4j-mr97 | <=7.5.2 | not reported (fixed or unreachable) |
| high | tar | GHSA-83g3-92jg-28cx | <7.5.8 | not reported (fixed or unreachable) |
| high | tar | GHSA-qffp-2rhf-9h96 | <=7.5.9 | not reported (fixed or unreachable) |
| high | tar | GHSA-9ppj-qmqm-q256 | <=7.5.10 | not reported (fixed or unreachable) |
| high | tar | GHSA-r6q2-hw4h-h46w | <=7.5.3 | not reported (fixed or unreachable) |
| high | tar | GHSA-8x88-c5mf-7j5w | <=7.5.17 | not reported (fixed or unreachable) |
| high | tar | GHSA-r292-9mhp-454m | <=7.5.20 | not reported (fixed or unreachable) |
| high | undici | GHSA-rfgv-xxqx-mfg5 | >=6.7.0 <6.28.1 | not reported (fixed or unreachable) |
| high | undici | GHSA-xjj6-f33q-929c | >=6.23.0 <6.29.1 | not reported (fixed or unreachable) |
| high | undici | GHSA-2m5v-pch6-74hx | >=4.0.0 <6.29.1 | not reported (fixed or unreachable) |
| high | undici | GHSA-qrxm-fqhp-jwvm | >=4.2.1 <6.29.1 | not reported (fixed or unreachable) |
| high | undici | GHSA-vxpw-j846-p89q | <6.27.0 | not reported (fixed or unreachable) |
| high | ws | GHSA-96hv-2xvq-fx4p | >=8.0.0 <8.21.0 | not reported (fixed or unreachable) |
| high | zod | GHSA-mrhx-c7xc-m3w5 | <4.6.6 | still reported |

## Why early PR audit showed 0/0

Prior runs used `pnpm audit --prod` against an already-hoisted workspace `node_modules` without a fresh isolated `pnpm install --frozen-lockfile --ignore-workspace`, which reported ~5 total prod dependencies and no advisories. The isolated lockfile method above matches Ops (main: 5 critical / 61 high).
