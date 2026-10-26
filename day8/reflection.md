# Reflection

The most difficult concept in this course was concurrency, specifically understanding how transactions and constraints keep data correct when many users act at the same moment. In my earlier projects everything happened one step at a time, so I could not see how two people could ever conflict. I overcame this by drawing the sequence of steps for two users on paper and asking where each could slip in between "check" and "update". Seeing that the check and the update must be a single atomic step made the idea click, and I applied it in the TicketHub design to prevent double-booking.

Based on the feedback I received, I would improve the structure and documentation of my capstone. The feedback pointed to unclear organisation and missing explanation of my decisions. I would split the code into smaller, well-named parts, add input validation and clearer error handling, and write a README that explains how to run the project and why I made key choices, the way I did in this design document.

Next, I want to learn a backend framework in depth, along with how to deploy a real application. I also plan to build a small working version of a system like TicketHub, so that I can test ideas such as holds, queues and caching in practice, and keep improving by asking for feedback on real projects.
