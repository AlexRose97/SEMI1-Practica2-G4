CREATE TABLE client (
    idiclient int NOT NULL AUTO_INCREMENT,
    name varchar(250),    
    username varchar(250),
    password varchar(250),
    urlfoto text,    
    PRIMARY KEY (idiclient)  
);  

CREATE TABLE book ( 
    idbook int NOT NULL AUTO_INCREMENT,
    nombre varchar(250),
    tipo int,
    idiclient int,
    PRIMARY KEY (idbook),
    FOREIGN KEY (idiclient) REFERENCES client (idiclient) ON DELETE CASCADE  
);  


CREATE TABLE picture ( 
    idpicture int NOT NULL AUTO_INCREMENT,
    nombre varchar(250),
    urlfoto text,
    descripcion text,
    idbook int,
    PRIMARY KEY (idpicture),
    FOREIGN KEY (idbook) REFERENCES book (idbook) ON DELETE CASCADE  
);

/*
INSERT INTO client (name, username, password,urlfoto)
VALUES ('admin','admin','admin','https://static.wikia.nocookie.net/new-fantendo/images/2/24/Soy_Admin.jpg/revision/latest/scale-to-width-down/720?cb=20200728204122&path-prefix=es');
*/

/*
drop TABLE picture;
drop TABLE book;
drop TABLE client;
*/
