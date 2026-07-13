# QA Dataset Generation — Future Growth & Scaling

Scaling tiers (design considerations)
- 100 products — minimal functional QA (fast generation, low cost).  
- 500 products — lightweight regression dataset.  
- 2,500 products — realistic QA (recommended initial target).  
- 10,000 products — performance & load testing tier.  
- 50,000 products — stress testing; requires cost/retention planning.

Implications for generation architecture
- Use batching, incremental imports, and asynchronous workers for large volumes.  
- Monitor costs (Atlas storage, read units, worker processing).  
- For large datasets prefer sampling and representative subsets for routine QA; reserve full-scale runs for scheduled load tests.

Data partitioning & sharding notes
- If production uses sharding, replicate logical partitioning in QA to surface distribution issues.

