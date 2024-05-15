CREATE TABLE book_notes(
	id SERIAL PRIMARY KEY,
	title TEXT,
	author TEXT,
	key TEXT,
	rating INTEGER,
	review TEXT
);

INSERT INTO book_notes (title, author, key, rating, review)
VALUES ('Avatar', 'Aaron Ehasz', 'https://covers.openlibrary.org/b/olid/OL26107904M-M.jpg', 10, 'Very Good');
INSERT INTO book_notes (title, author, key, rating, review)
VALUES ('A Game of Thrones', 'George R. R. Martin', 'https://covers.openlibrary.org/b/olid/OL40209111M-M.jpg', 10, 'Very Good Too');
INSERT INTO book_notes (title, author, key, rating, review)
VALUES ('Noli Me Tángere', 'José Rizal', 'https://covers.openlibrary.org/b/olid/OL44578999M-M.jpg', 9, 'Good');
INSERT INTO book_notes (title, author, key, rating, review)
VALUES ('"Harry Potter and the Prisoner of Azkaban Selected Violin"', 'John Williams', 'https://covers.openlibrary.org/b/olid/OL8005747M-M.jpg', 10, 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.');
