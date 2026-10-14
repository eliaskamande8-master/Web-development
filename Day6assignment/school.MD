The database stores students, the courses they can take, and which students are on which courses. It has three tables: `students`, `courses` and `enrollments`.

## Tables

### students

One row per person.

- `student_id` is the primary key.
- `name` is required.
- `email` is required and unique, so two students cannot share an address.

### courses

One row per course.

- `course_id` is the primary key.
- `title` is required.
- `credits` is required and must be greater than zero.

### enrolments

One row each time a student takes a course.

- `enrolment_id` is the primary key.
- `student_id` is a foreign key to `students`, and `course_id` is a foreign key to `courses`. Both are required, so an enrolment cannot point at a student or course that does not exist.
- `grade` is a number from 0 to 100. It can be empty (NULL), because a student has no grade until the course is marked.
- The pair (`student_id`, `course_id`) is unique, so a student cannot enrol on the same course twice.

## Relationships

A student can have many enrolments, but each enrolment belongs to one student. That is a one-to-many relationship. The same is true between a course and its enrolments: one course has many enrolments, and each enrolment belongs to one course.

Put together, students and courses have a many-to-many relationship. One student takes several courses, and one course has several students.

A relational table cannot store a many-to-many relationship directly, so it needs a join table. If `course_id` sat in `students`, each student could have only one course. Storing a list of course ids in one column would stop the database from checking them against `courses`, and it would make queries like "who is on Databases?" awkward. The `enrolments` table avoids both problems by holding one row per pairing. It also gives the grade a home. A grade belongs to a student on a particular course, not to the student alone or the course alone.

## Index

I would add an index on `enrolments (course_id)`.

The unique rule on (`student_id`, `course_id`) already creates an index that starts with `student_id`, so looking up a student's courses is fast. Looking up by course alone cannot use that index well, and SQLite would read the whole table. Two of the queries do exactly that: listing the students on a course, and counting students per course. With the new index, SQLite reports a search on `course_id` instead of a full scan. The cost is a little extra storage and slightly slower inserts, which is small for a table that is read far more often than it is written.

## SQL or NoSQL

I would choose SQL. The data is structured, every record of a given type has the same fields, and the main feature is a many-to-many relationship, which is what foreign keys and joins handle well. The database itself can enforce the rules that matter here: unique emails, no double enrolment, and no enrolment for a missing student or course. Questions like "how many students are on each course" or "which students have no enrolments" are short JOIN and GROUP BY queries. In a document database I would have to embed courses inside each student document or students inside each course document. Either way the same course details would be copied many times, so renaming a course would mean updating many documents, and counting students per course would need extra work. NoSQL would make more sense if the system had to write huge volumes of data across many servers, or if records had very different shapes. A school's records are neither.