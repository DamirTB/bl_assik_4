```
CREATE TABLE User (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    friends_counter INT DEFAULT 0,
    wallet_address VARCHAR(255) UNIQUE,
    token_id INT DEFAULT -1
);
```

```
CREATE TABLE Friendship (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_1 VARCHAR(255) NOT NULL,
    user_2 VARCHAR(255) NOT NULL,
    accepted BOOLEAN DEFAULT FALSE
);
```

```
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    author VARCHAR(255) NOT NULL
);
```