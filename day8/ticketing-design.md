# TicketHub Design Document

TicketHub is a website that sells tickets for concerts and events. This document follows the six-part design framework: requirements, estimates, API, data model, architecture, and trade-offs. It also explains specifically how two people are prevented from buying the same seat.

## 1. Requirements

### Functional requirements
- Users can register, log in and log out.
- Users can browse and search upcoming events by name, date, city and category.
- Users can view an event's details and its seat map with live availability.
- Users can hold one or more seats temporarily (maximum 6 per order) while they pay.
- Users can release a hold, and holds expire automatically after 5 minutes.
- Users can pay for held seats by card through an external payment provider.
- Users receive a confirmation and can view their tickets (with a QR code) under "My tickets".
- Users can cancel an order and receive a refund before the event's cutoff date.

### Non-functional requirements
- **Speed:** Browsing and event pages respond in under 300 ms (95th percentile). The seat map loads in under 500 ms. During a big sale, a hold request receives a response within 2 seconds.
- **Correctness:** A seat is never sold to two people. A user is never charged without receiving a ticket, and never receives a ticket without paying. A payment is never processed twice for the same order.
- **Fairness:** Buyers are served in the order they arrive (first come, first served). During a big sale, users enter a waiting room and are admitted in arrival order. Each account is limited to 6 tickets per event, and automated buying (bots) is rate-limited.
- **Availability:** Browsing remains available (99.9%) even if payments are slow. If a sale is overloaded, users wait in a queue instead of seeing errors.
- **Security:** Passwords are hashed, all traffic uses HTTPS, and card details never reach our servers (the payment provider handles them).

## 2. Estimates

### Normal day
- Page views: 50,000 visitors x 10 pages = **500,000 page views per day**.
- Average rate: 500,000 / 86,400 seconds = about **6 requests per second**.
- Assuming the busiest hour is about 4x the average: roughly **25 requests per second**.
- Sales: 5,000 tickets per day = about **0.06 tickets per second**. Write traffic is very low.
- Users: 2 million are registered, but only 2.5% (50,000) visit on a given day.

### Big sale (popular concert)
- Arrivals: 200,000 people within 10 minutes (600 seconds) = about **333 new users per second**.
- Requests: assuming about 10 requests per user (event page, seat map, seat selection, retries) = 2,000,000 / 600 = about **3,300 requests per second**.
- Hold attempts: assuming about 3 attempts per user = 600,000 / 600 = about **1,000 hold attempts per second**.
- Demand versus supply: 200,000 buyers for 20,000 seats is **10 buyers per seat**. About 90% of users will not get a ticket.
- Sales: up to 20,000 tickets in 10 minutes = about **33 sales per second**.

### Comparison

| Measure | Normal day | Big sale (10 minutes) | Ratio |
|---|---|---|---|
| New visitors per second | about 0.6 | about 333 | about 570x |
| Requests per second | about 6 (peak hour about 25) | about 3,300 | about 130x to 550x |
| Tickets sold | 5,000 per day | up to 20,000 | 4x a full day's sales, in under 1% of the time |

The big sale is hundreds of times busier than a normal day, and the load is concentrated on a single event and a single set of seats. A system sized for a normal day would fail, so the design must absorb the spike (CDN, cache, waiting room) and protect the database, where contention for seats occurs.

## 3. API

All endpoints use JSON over HTTPS. Authenticated endpoints require a bearer token.

| # | Method and path | Purpose |
|---|---|---|
| 1 | `GET /events?city=&date=&page=` | Browse and search events (public, cached) |
| 2 | `GET /events/{eventId}` | View event details |
| 3 | `GET /events/{eventId}/seats` | View seats and their status (available, held, sold) |
| 4 | `POST /events/{eventId}/holds` | Hold seats. Body: `{"seatIds":[101,102]}`. Returns `holdId` and `expiresAt`, or `409` if a seat is taken |
| 5 | `DELETE /holds/{holdId}` | Release a hold |
| 6 | `POST /orders` | Pay for a hold. Body: `{"holdId":"h_9f2","paymentToken":"tok_123"}`. Requires an `Idempotency-Key` header |
| 7 | `GET /me/tickets` | View my tickets |
| 8 | `POST /orders/{orderId}/cancel` | Cancel an order and refund |
| 9 | `POST /auth/register`, `POST /auth/login` | Sign up and log in |

Example responses:

```json
POST /events/42/holds  ->  201 Created
{ "holdId": "h_9f2", "expiresAt": "2026-11-01T20:05:00Z" }

POST /events/42/holds  ->  409 Conflict
{ "error": "SEAT_UNAVAILABLE", "seatIds": [102] }
```

## 4. Data Model

| Table | Columns |
|---|---|
| **users** | `id` (PK), `email` (UNIQUE), `password_hash`, `name`, `created_at` |
| **venues** | `id` (PK), `name`, `city`, `capacity` |
| **events** | `id` (PK), `venue_id` (FK to venues), `name`, `starts_at`, `on_sale_at`, `status` |
| **event_seats** | `id` (PK), `event_id` (FK to events), `section`, `row`, `number`, `price`, `status` (available / held / sold), `held_by` (FK to users, nullable), `hold_expires_at` (nullable). UNIQUE (`event_id`, `section`, `row`, `number`) |
| **orders** | `id` (PK), `user_id` (FK to users), `event_id` (FK to events), `total`, `status` (pending / paid / cancelled / refunded), `idempotency_key` (UNIQUE), `payment_ref`, `created_at` |
| **tickets** | `id` (PK), `order_id` (FK to orders), `event_seat_id` (FK to event_seats, **UNIQUE**), `qr_code` |

### Relationships
- A venue has many events (one-to-many).
- An event has many event_seats, one per physical seat (one-to-many).
- A user has many orders (one-to-many), and an order has many tickets (one-to-many).
- Each ticket refers to exactly one event_seat, and each event_seat can have at most one ticket (one-to-one, enforced by the UNIQUE constraint).

## 5. Preventing Double-Booking

Two people must never hold or own the same seat. The design uses three layers, so that if one fails the next still prevents the error.

**Layer 1: atomic conditional update when holding.** Holding a seat is one SQL statement that checks and changes the seat in the same step:

```sql
UPDATE event_seats
SET status = 'held',
    held_by = :userId,
    hold_expires_at = now() + interval '5 minutes'
WHERE id = :seatId
  AND (status = 'available'
       OR (status = 'held' AND hold_expires_at < now()));
```

The database locks the row while the statement runs. If two users request the same seat at the same moment, one statement runs first and reports `1 row updated`. The second then sees the seat is no longer available and reports `0 rows updated`, and the API returns `409`. There is no gap between "check" and "set" in which a second user can intervene. When a user requests several seats, all the updates run inside one transaction; if any seat returns 0 rows, the entire transaction rolls back so no one receives a partial order.

**Layer 2: a transaction when paying.** `POST /orders` begins a transaction and locks the seats with `SELECT ... FOR UPDATE`. It confirms each seat is still `held` by this user and that the hold has not expired. Only then does it charge the card, create the order and tickets, and mark the seats `sold`, all in a single commit. If payment fails, the transaction rolls back and the seats stay held until the hold expires.

**Layer 3: constraints as a final safety net.** `tickets.event_seat_id` is UNIQUE, so even if an application bug attempted to create two tickets for one seat, the database would reject the second insert. The UNIQUE `idempotency_key` on orders prevents a double click or network retry from creating or charging a second order.

**Expired holds.** A background worker runs every 30 seconds and returns expired holds to `available`. The Layer 1 statement also treats an expired hold as available, so correctness does not depend on the worker running on time.

## 6. Architecture

### Diagram

```
                +-----------+
   Users -----> |    CDN    |  (static files, event pages, images)
                +-----+-----+
                      |
                +-----v--------+
                | Load balancer|
                +-----+--------+
                      |
              +-------v---------+        +----------------+
              |  Waiting room   |<------>|     Redis      |
              | (queue + tokens)|        | (queue, cache, |
              +-------+---------+        |  rate limits)  |
                      |                  +--------^-------+
              +-------v---------+                 |
              |   API servers   |-----------------+
              |   (stateless)   |
              +---+---------+---+
                  |         |
         writes   |         |  reads
          +-------v--+   +--v-----------+      +------------------+
          | Primary  |-->| Read replicas|      | Payment provider |
          |    DB    |   +--------------+      +--------^---------+
          +-------^--+                                 |
                  |            +-----------+           |
                  +------------+  Workers  +-----------+
                               | (expiry,  |
                               |  emails)  |
                               +-----------+
```

### Components
- **CDN:** serves images, scripts and cached event pages from locations near the user, absorbing most browsing traffic before it reaches our servers.
- **Load balancer:** distributes requests across API servers and removes unhealthy servers.
- **Waiting room:** when a big sale opens, users join a queue in arrival order and are admitted at a controlled rate (for example 500 per second). This converts a sudden spike of 200,000 users into a steady flow the database can handle, and it is the main fairness mechanism. Admitted users receive a signed token that the hold endpoint requires.
- **API servers:** stateless, so more can be added during a sale. They store no data themselves.
- **Redis:** stores queue positions, caches the seat map (refreshed every 1 to 2 seconds) and counts requests for rate limiting per account and per IP address.
- **Primary database:** the single source of truth for seats and orders. All holds and purchases go here, where the atomic updates in section 5 make double-booking impossible.
- **Read replicas:** serve browsing and "my tickets" reads so they do not compete with purchases.
- **Payment provider:** an external service that processes cards. We store only a payment reference.
- **Workers:** release expired holds, send confirmation emails and retry failed refunds outside the user's request.

### How the design survives the big sale
The CDN and cache absorb the read traffic, so the roughly 3,300 requests per second shrink to a few hundred reaching the servers. The waiting room limits write traffic to what the database can safely process. The seat-map cache means thousands of users watching the map do not each query the database. Only hold and payment requests reach the primary database, and they are protected by the layers in section 5.

## 7. Trade-offs

1. **Waiting room: fairness and stability versus speed and simplicity.** The queue keeps the system alive and the sale fair, but users must wait and it adds a component to build and operate. Without it, a lucky few would get a faster experience and the system would crash for everyone else.

2. **Database locking versus an in-memory lock (Redis).** Using the main database for the atomic update is slower and concentrates load on one machine, but it is the source of truth, so a seat cannot be wrongly sold. Redis locks would be faster but could disagree with the database after a crash. We chose correctness and protected the database with the waiting room.

3. **Cached seat map: speed versus freshness.** A 1 to 2 second cache means a user may click a seat that was just taken and receive a `409`. In return, the database is spared thousands of reads per second. The hold endpoint always checks the real database, so a stale view can never cause a double sale.

4. **Hold duration of 5 minutes.** Long holds are kind to slow payers but let people block seats they never buy. Short holds free seats sooner but risk losing a buyer mid-payment. Five minutes balances the two.
