CREATE DATABASE dbgames1;

USE dbgames1;

CREATE TABLE `users` (
  `login` varchar(255) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `couleur1` varchar(255) DEFAULT NULL,
  `couleur2` varchar(255) DEFAULT NULL,
  `parties` int(10) unsigned DEFAULT NULL,
  `gagnees` int(10) unsigned DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`login`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
