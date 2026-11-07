---
'react-spring-lightbox': patch
---

Drop the `@babel/runtime` dependency. Rolldown now builds the bundle, which imports no helper packages and is 1.9 kB smaller (300 bytes gzipped). Class fields stay native ES2022 syntax, which Safari 15.6+, Chrome 109+, and Firefox 102+ run.
