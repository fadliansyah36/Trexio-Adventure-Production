# TREXIO DATABASE & SYSTEM CAPACITY REGISTER

| Resource / Entity | Current Usage | Projected 6M | Projected 12M | Upper Capacity Limit | Alert Warning Threshold | Critical Threshold | Scaling Action Trigger | Owner Role | Status |
|---|---|---|---|---|---|---|---|---|---|
| PostgreSQL Storage | ~50 MB | 15 GB | 60 GB | 100 GB (Auto-expandable) | 70% Capacity | 85% Capacity | Cloud SQL Auto Storage Expansion | DBA_ROLE | Operational |
| Database Connection Pool | 1 - 3 Conns | 15 Conns | 45 Conns | 100 Conns | 70 Conns | 85 Conns | Deploy PgBouncer / Increase max_connections | DBA_ROLE | Operational |
| Booking Transaction Throughput | ~50 TPS | 250 TPS | 1,000 TPS | 5,000 TPS | 3,500 TPS | 4,500 TPS | Vertical scale Cloud SQL vCPU/RAM | Backend_Role | Operational |
| Active User Accounts (`users`) | ~100 Users | 50,000 Users | 250,000 Users | 5,000,000 Users | 3,500,000 Users | 4,500,000 Users | Partition user audit tables | DBA_ROLE | Operational |
| Chat Messages (`messages`) | ~200 Messages | 500,000 Msgs | 2,500,000 Msgs | 50,000,000 Msgs | 35,000,000 Msgs | 45,000,000 Msgs | Partition messages table by month | DBA_ROLE | Operational |
