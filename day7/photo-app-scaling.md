### Assumptions.
-Total Registered Users: 10,000,000 users
-Daily Active Percentage: 10%
-Uploads per Active User: 1 photo/day
-Feed Views per Active User: 50 feed pages/day
-File Sizes: 2 MB per photo, 50 KB per thumbnail

### Daily Active users.
-Total registered users * Active users percentage
-(10,000,000 * 0.10) = 1,000,000 users
-DAU = 1,000,000 users

### Calculating the traffic and the storage.
/*Uploads per second(writes)*/
-(DAU *1)/86,400 seconds
-(1,000,000 * 1)/86,400 = 12 uploads / second

/*Feed views per second (read)*/
-(DAU*50)/86,400 seconds
-(1,000,000*50)/86,400 = 579 views / second.

/*Peak traffic*/
-Uploads per second*5
-(12 * 5) = 60 uploads / second.
-Feed views per second *5
-(579 * 5) =2895 Feed views  / second
/*storage per year*/
-photos uploaded in a year
-DAU * 365
-(1,000,000 * 365)=365,000,000
-Total size of photo
-(365,000,000 *2.05)=748,250,000 MB
-748,250,000 MB =748.25 TB Round up to have 749 TB

### Deciding whether the system is read-heavy or write-heavy.
-From the calculations you will realize that the feed views are vastly higher than the uploads
-reads > Writes.
-Having noticed the needs of the system,the architecture should heavily focus on fast read performance. Using caching for popular feeds, a CDN for deliver image files close to users, and database read replicas to handle heavy query traffic.

### Explaining why photos should not be stored inside the database?
-Storing multi-megabyte photo files directly in a database bloats its size and slows down backups.
-Using a distributed object storage service (like AWS S3) which is designed specifically to hold large files cheaply and reliably, while the database only stores lightweight text metadata (like the image URL, caption, user ID, and timestamp).

### Draw the Architecture Diagram.

[ Mobile / Web App ]
       │
       ▼
 [ CDN (CloudFront) ] <--- Serves photos/thumbnails fast
       │
       ▼
 [ Load Balancer ]
       │
       ├────────────────────────┐
       ▼                        ▼
 [ App Server 1 ]        [ App Server 2 ]
       │                        │
       ├───────► [ Redis Cache ] (for quick feed lookups)
       │
       ├───────► [ Primary Database ] (Writes) ──► [ Read Replica ] (Reads)
       │
       ├───────► [ Object Storage ] (S3 - Raw Photos & Thumbnails)
       │
       └───────► [ Message Queue (RabbitMQ/SQS) ] ──► [ Worker Service ] (Creates Thumbnails) 

### Explain Each Component in One Sentence
-CDN: Caches static assets close to users globally to reduce latency.
-Load Balancer: Distributes incoming HTTP traffic evenly across multiple application servers.
-App Servers: Handle business logic, authenticate requests, and coordinate reads and writes.
-Cache: Stores hot data (like recent user feeds) in memory for lightning-fast retrieval.
-Database: Manages relational metadata like user profiles, relationships, and post details.
-Read Replica: Offloads heavy read queries from the primary database to keep things fast.
-Object Storage: Stores raw photo files and generated thumbnails securely and cost-effectively.
-Queue: Asynchronously buffers background jobs so uploads do not hang while waiting for processing.
-Worker: Pulls jobs from the queue to resize full photos into optimized thumbnails.

### Describe the Upload Flow.
-Initiate Upload: The user selects a photo on their phone and sends it to the Load Balancer, which routes it to an App Server.
-Save File: The App Server uploads the raw, full-size photo directly into Object Storage.
Save Metadata: The App Server writes a new record to the Database containing the image URL, caption, and user ID.
-Queue Job: The App Server pushes a background job message (containing the photo reference) into the Message Queue and immediately responds to the user that the upload is successful.
-Background Processing: A background Worker picks up the job from the queue, downloads the raw photo, shrinks it into a 50 KB thumbnail, and uploads the thumbnail back to Object Storage.

### Trade-Offs.
-Consistency vs. Speed (Replicas): Using database read replicas means feed updates might suffer from a slight replication lag, meaning a user might not see a new post instantly on another device, but it scales read performance massively.

-Storage Cost vs. Quality: Storing raw 2 MB photos guarantees high resolution for users, but incurs significantly higher cloud storage costs compared to aggressive compression.
