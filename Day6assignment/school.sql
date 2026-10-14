
PRAGMA foreign_keys = ON;

/* Drop in reverse order so the file can be run again from scratch. */
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

/* Tables */

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    title     TEXT NOT NULL,
    credits   INTEGER NOT NULL CHECK (credits > 0)
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id   INTEGER NOT NULL,
    course_id    INTEGER NOT NULL,
    grade        INTEGER CHECK (grade BETWEEN 0 AND 100),
    FOREIGN KEY (student_id) REFERENCES students (student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses (course_id)   ON DELETE CASCADE,
    -- A student can enrol on a given course only once.
    UNIQUE (student_id, course_id)
);

/* Speeds up "which students are on this course" lookups (see school-design.md). */
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);

/* Sample data */

INSERT INTO students (student_id, name, email) VALUES
    (1, 'Amina Hassan',  'amina.hassan@example.com'),
    (2, 'Brian Otieno',  'brian.otieno@example.com'),
    (3, 'Chloe Martin',  'chloe.martin@example.com'),
    (4, 'Daniel Kimani', 'daniel.kimani@example.com'),
    (5, 'Esther Wanjiku','esther.wanjiku@example.com');

INSERT INTO courses (course_id, title, credits) VALUES
    (1, 'Web Foundations', 4),
    (2, 'Databases',       4),
    (3, 'Algorithms',      3),
    (4, 'Networking',      3);

/*grade is NULL until the course has been marked.*/
INSERT INTO enrolments (student_id, course_id, grade) VALUES
    (1, 1, 88),
    (1, 2, 92),
    (1, 3, NULL),
    (2, 1, 75),
    (2, 2, 81),
    (3, 1, 90),
    (3, 3, 68),
    (4, 2, NULL);

/* Queries */


/*Query 1: all courses for one student, found by name.*/
SELECT c.title, c.credits, e.grade
FROM students AS s
JOIN enrolments AS e ON e.student_id = s.student_id
JOIN courses AS c    ON c.course_id = e.course_id
WHERE s.name = 'Amina Hassan'
ORDER BY c.title;

/*Query 2: all students on one course.*/
SELECT s.name, s.email, e.grade
FROM courses AS c
JOIN enrolments AS e ON e.course_id = c.course_id
JOIN students AS s   ON s.student_id = e.student_id
WHERE c.title = 'Databases'
ORDER BY s.name;

/*Query 3: number of students per course.*/
/*LEFT JOIN keeps courses with no students, which show a count of 0.*/
SELECT c.title, COUNT(e.enrolment_id) AS student_count
FROM courses AS c
LEFT JOIN enrolments AS e ON e.course_id = c.course_id
GROUP BY c.course_id, c.title
ORDER BY student_count DESC, c.title;

/*Query 4: students who have no enrolments.*/
SELECT s.name, s.email
FROM students AS s
LEFT JOIN enrolments AS e ON e.student_id = s.student_id
WHERE e.enrolment_id IS NULL;

/*Query 5: update one enrolment's grade (Daniel Kimani, Databases).*/
UPDATE enrolments
SET grade = 85
WHERE student_id = (SELECT student_id FROM students WHERE name = 'Daniel Kimani')
  AND course_id  = (SELECT course_id FROM courses WHERE title = 'Databases');

/*Check that the update worked.*/
SELECT s.name, c.title, e.grade
FROM enrolments AS e
JOIN students AS s ON s.student_id = e.student_id
JOIN courses AS c  ON c.course_id = e.course_id
WHERE s.name = 'Daniel Kimani';