# Puissance 4 (Four in a row)

This is a multiuser online version of the popular game Four in a row.

## Installation

You will need [Node.js](http://nodejs.org) >= 0.8, and a MySQL database.

To install the dependencies, run

	npm install

Then create the database and tables
	
    mysql -u root -padmin < dbgame.sql

If your MySQL credentials do not match those above, edit `app1.js`.

## Playing

Start the server with

	node app1.js

Now point your browser(s) to <http://localhost:8080>. Create accounts
and have fun!
