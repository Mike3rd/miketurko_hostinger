CREATE DATABASE IF NOT EXISTS `phpcomments_advanced` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `phpcomments_advanced`;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `display_name` varchar(50) NOT NULL,
  `role` enum('Admin','Member') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

INSERT INTO `accounts` (`id`, `email`, `password`, `display_name`, `role`) VALUES
(1, 'admin@example.com', '$2y$10$ZU7Jq5yZ1U/ifeJoJzvLbenjRyJVkSzmQKQc.X0KDPkfR3qs/iA7O', 'Admin', 'Admin');

CREATE TABLE IF NOT EXISTS `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL DEFAULT -1,
  `display_name` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `submit_date` datetime NOT NULL DEFAULT current_timestamp(),
  `votes` int(11) NOT NULL DEFAULT 0,
  `img` varchar(255) NOT NULL DEFAULT '',
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `acc_id` int(11) NOT NULL DEFAULT -1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

INSERT INTO `comments` (`id`, `page_id`, `parent_id`, `display_name`, `content`, `submit_date`, `votes`, `img`, `approved`, `acc_id`) VALUES
(1, 1, -1, 'John Doe', 'Great article, David!', '2022-05-16 15:22:37', 5, '', 1, -1),
(2, 1, -1, 'Mark', 'Really enjoyed this post, thanks!', '2022-05-16 15:23:06', 0, '', 1, -1),
(3, 1, 1, 'David', 'Thanks, John Doe! Much appreciated!', '2022-05-16 17:03:40', 1, '', 1, -1);

CREATE TABLE IF NOT EXISTS `filters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `word` varchar(255) NOT NULL,
  `replacement` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;