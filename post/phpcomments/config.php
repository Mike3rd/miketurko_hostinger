<?php
// Your MySQL database hostname.
define('db_host','localhost');
// Your MySQL database username.
define('db_user','u940803011_miketurko');
// Your MySQL database password.
define('db_pass','9tXPvlX08]8?');
// Your MySQL database name.
define('db_name','u940803011_miketurko');
// Your MySQL database charset.
define('db_charset','utf8');
/* Comments */
// Comments require approval before they are displayed on the website.
// List:0=No Approval Required,1=Approval Required for Guests,2=Approval Required for All Users
define('comments_approval_level',1);
// Authentication will require the user to login or register before they can write a comment.
define('authentication_required',false);
// The maximum number of nested replies.
define('max_nested_replies',2);
// The maximum number of characters the user can enter in the comment.
define('max_comment_chars',3000);
// The minimum number of characters the user can enter in the comment.
define('min_comment_chars',0);
// The maximum number of minutes the user has to edit their comment.
define('max_comment_edit_time',60);
// If enabled, the user can search for comments.
define('search_enabled',false);
// The directory URL where the comment files are located.
define('comments_url','https://miketurko.com/post/phpcomments/');
/* Mail */
// Send mail to users, etc?
define('mail_enabled',false);
// This is the email address that will be used to send emails.
define('mail_from','mturko@outlook.com');
// This is the email address that will receive the notifications.
define('notification_email','mturko@outlook.com');
// The name of your business.
define('mail_name','Mike Turko');
// If enabled, the mail will be sent using SMTP.
define('SMTP',false);
// Your SMTP hostname.
define('smtp_host','smtp.example.com');
// Your SMTP port number.
define('smtp_port',465);
// Your SMTP username.
define('smtp_user','user@example.com');
// Your SMTP Password.
define('smtp_pass','secret');
?>