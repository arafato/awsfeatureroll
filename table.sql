CREATE TABLE features (
       id int NOT NULL AUTO_INCREMENT,
       category VARCHAR(50),
       unixtimestamp int NOT NULL,
       published varchar(20),
       title varchar(512) NOT NULL,
       url varchar(512),
       PRIMARY KEY (id),
       INDEX(unixtimestamp),
       INDEX(category)
) 

