# Library API design

This API manages the books in a library. It has one resource, `books`. All requests and responses use JSON, and every path below is relative to the base URL `https://api.example-library.com`.

A book looks like this:

```json
{
  "id": 42,
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958,
  "isbn": "9780385474542"
}
```

## Endpoints

### List all books

- Method: GET
- Path: `/books`
- Description: Returns every book in the library.
- Success status code: 200 OK

### Get one book

- Method: GET
- Path: `/books/{id}`
- Description: Returns the single book with the given id.
- Success status code: 200 OK

### Create a book

- Method: POST
- Path: `/books`
- Description: Adds a new book and returns it with its generated id.
- Success status code: 201 Created
- Example request body:

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958,
  "isbn": "9780385474542"
}
```

### Update a book

- Method: PUT
- Path: `/books/{id}`
- Description: Replaces the book with the given id. The body must contain every field.
- Success status code: 200 OK
- Example request body:

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1959,
  "isbn": "9780385474542"
}
```

### Delete a book

- Method: DELETE
- Path: `/books/{id}`
- Description: Removes the book with the given id.
- Success status code: 204 No Content (the response has no body)

### List books by an author

- Method: GET
- Path: `/books?author={name}`, for example `/books?author=Chinua%20Achebe`
- Description: Returns only the books whose author matches the `author` query parameter.
- Success status code: 200 OK (an empty array `[]` if the author has no books)

## Error codes

### 400 Bad Request

The request is malformed or has invalid data, so the server cannot process it.

- Example: `POST /books` with a body that has no `title`, or a body that is not valid JSON.
- Example: `GET /books/abc`, because the id must be a number.

Example response body:

```json
{
  "error": "Bad Request",
  "message": "The field 'title' is required."
}
```

### 404 Not Found

The path is valid, but no book exists with the id that was requested.

- Example: `GET /books/9999` when no book has id 9999.
- Example: `PUT /books/9999` or `DELETE /books/9999` for the same missing id.

Example response body:

```json
{
  "error": "Not Found",
  "message": "No book with id 9999."
}
```