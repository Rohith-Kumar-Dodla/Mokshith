# QA Dataset Builder — Scalability

Support tiers and notes

- 100 products: single-node execution; minimal memory/CPU.  
- 500 products: small parallelism for product and inventory generation.  
- 2,500 products: recommended QA baseline — batch generation, worker concurrency, and timeouts tuned.  
- 10,000 products: partition workload by vendor or category; run generation across multiple workers/nodes.  
- 50,000+ products: use cloud-based worker fleets, chunked imports, and streaming ingestion to avoid OOM.  
- 100,000 products: require sharded ingestion strategy and robust monitoring.

Architectural considerations
- Use task queues (BullMQ) for parallel generation and backoff.  
- Use streaming/stream processors for large exports.  
- Monitor memory, DB write throughput, and index build costs.

