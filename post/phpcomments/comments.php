<?php
// Initialize sessions
session_start();
// Include the config file
include 'config.php';
// PHPMailer Namespaces
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
// Connect to the MySQL database using the PDO interface
try {
    $pdo = new PDO('mysql:host=' . db_host . ';dbname=' . db_name . ';charset=' . db_charset, db_user, db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $exception) {
    // If there is an error with the connection, stop the script and display the error.
    exit('Failed to connect to database: ' . $exception->getMessage());
}
// The following function will be used to assign a unique icon color to our users
function color_from_string($string) {
    // The list of hex colors
    $colors = ['#34568B','#FF6F61','#6B5B95','#88B04B','#F7CAC9','#92A8D1','#955251','#B565A7','#009B77','#DD4124','#D65076','#45B8AC','#EFC050','#5B5EA6','#9B2335','#DFCFBE','#BC243C','#C3447A','#363945','#939597','#E0B589','#926AA6','#0072B5','#E9897E','#B55A30','#4B5335','#798EA4','#00758F','#FA7A35','#6B5876','#B89B72','#282D3C','#C48A69','#A2242F','#006B54','#6A2E2A','#6C244C','#755139','#615550','#5A3E36','#264E36','#577284','#6B5B95','#944743','#00A591','#6C4F3D','#BD3D3A','#7F4145','#485167','#5A7247','#D2691E','#F7786B','#91A8D0','#4C6A92','#838487','#AD5D5D','#006E51','#9E4624'];
    // Find color based on the string
    $colorIndex = hexdec(substr(sha1($string), 0, 10)) % count($colors);
    // Return the hex color
    return $colors[$colorIndex];
}
// Below function will convert datetime to time elapsed string.
function time_elapsed_string($datetime, $full = false) {
    $now = new DateTime;
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    $w = floor($diff->d / 7);
    $diff->d -= $w * 7;
    $string = ['y' => 'year','m' => 'month','w' => 'week','d' => 'day','h' => 'hour','i' => 'minute','s' => 'second'];
    foreach ($string as $k => &$v) {
        if ($k == 'w' && $w) {
            $v = $w . ' week' . ($w > 1 ? 's' : '');
        } else if (isset($diff->$k) && $diff->$k) {
            $v = $diff->$k . ' ' . $v . ($diff->$k > 1 ? 's' : '');
        } else {
            unset($string[$k]);
        }
    }
    if (!$full) $string = array_slice($string, 0, 1);
    return $string ? implode(', ', $string) . ' ago' : 'just now';
}
// The below function will output a comment
function show_comment($comment, $comments = [], $filters = [], $max_comments = -1, $current_nest = 0) {
    static $count = 0;
    $count++;
    if ($max_comments != -1 && $count > $max_comments) return;
    // Convert new lines to <br> and escape special characters
    $content = str_replace("\r\n\r\n", "<br><br>\r\n", htmlspecialchars($comment['content'], ENT_QUOTES));
    // Allowed html tags, feel free to add tags to the arrays
    $independent_tags = ['<code>', '</code>', '<pre>', '</pre>', '<blockquote>', '</blockquote>', '<h6>', '</h6>'];
    $allowed_tags = array_merge($independent_tags, ['<i>', '</i>', '<strong>', '</strong>', '<u>', '</u>']);
    $escapted_tags = array_map(function($value) {
        return htmlspecialchars($value, ENT_QUOTES);
    }, $allowed_tags);
    $content = str_ireplace($escapted_tags, $allowed_tags, $content);
    // Place new lines before independant tags
    $content = preg_replace('#(' . implode('|', $independent_tags) . ')#i', "\r\n$1\r\n", $content);
    // Apply the filters
    if ($filters) {
        $content = str_ireplace(array_column($filters, 'word'), array_column($filters, 'replacement'), $content);
    }
    // Add paragraph tags
    $arr = explode("\n", $content);
    $output = '';
    for ($i = 0; $i < count($arr); $i++) {
        $line = trim($arr[$i]);;
        if ($line !== '') {
            if (!preg_match('#^(' . implode('|', $independent_tags) . ')(.*)$#i', $line)) {
                $output .= '<p>' . $arr[$i] . '</p>';
            } else {
                $output .= $line;
            }
        }
    }
    // Remove paragraph tags inside independant tags
    $content = preg_replace_callback('/<(code|pre|blockquote|h6)>(.*?)<\/(code|pre|blockquote|h6)>/s', function($matches) {
        return str_replace(['<p>', '</p>'], '', $matches[0]);
    }, $output);
    // Format URLS
    $content = preg_replace_callback('~(http|ftp)s?://[a-z0-9.-]+\.[a-z]{2,3}(/\S*)?~i', function($matches) {
        $url = str_replace(['<br>', '<br />'], ['', ''], $matches[0]);
        return '<a href="' . $url . '" rel="nofollow noopener" target="_blank">' . $url . '</a>';
    }, $content);
    // Place br tags outside of p tags
    $content = str_replace("<br>\r\n</p>", "</p>\r\n<br>\r\n<br>", $content);
    // Comment template
    $html = '
    <div class="comment" data-id="' . $comment['id'] . '" id="comment-' . $comment['id'] . '">
        <div class="comment-profile-picture">
            <span style="background-color:' . color_from_string($comment['display_name']) . '">' . strtoupper(substr($comment['display_name'], 0, 1)) . '</span>
        </div>
        <div class="con' . (isset($comment['highlighted']) ? ' highlighted' : '') . '">
            <div class="comment-meta">
                <span class="name">' . htmlspecialchars($comment['display_name'], ENT_QUOTES) . '</span>
                ' . ($comment['role'] && $comment['role'] != 'Member' ? '<span class="role" title="User Role">' . $comment['role'] . '</span>' : '') . '
                <span class="date" title="' . date('d-m-Y H:ia', strtotime($comment['submit_date'])) . '">' . time_elapsed_string($comment['submit_date']) . '</span>
                ' . ($comment['edited_date'] > $comment['submit_date'] ? '<span class="edited" title="Edited on ' . date('d-m-Y \a\t H:ia', strtotime($comment['edited_date'])) . '">(edited)</span>' : '') . '
                ' . ($comment['featured'] ? '<span class="featured" title="Featured Comment"><i class="fa-solid fa-thumbtack"></i></span>' : '') . '
                <a href="#" class="toggle-comment"><i class="fa-solid fa-minus"></i></a>
            </div>
            <div class="comment-content">' . $content . '</div>
            ' . ($comment['approved'] ? '' : '<div class="comment-awaiting-approval">(Awaiting approval)</div>') . '
            <div class="comment-footer">
                <span class="num" title="Comment Votes">' . number_format($comment['votes']) . '</span>
                <a href="#" class="vote" title="Vote Up" data-vote="up" data-comment-id="' . $comment['id'] . '">
                    <i class="arrow up"></i>
                </a>
                <a href="#" class="vote" title="Vote Down" data-vote="down" data-comment-id="' . $comment['id'] . '">
                    <i class="arrow down"></i>
                </a>
                ' . (!authentication_required || isset($_SESSION['comment_account_loggedin']) ? '<a class="reply-comment-btn" href="#" data-comment-id="' . $comment['id'] . '">Reply</a>' : '') . '
                ' . (isset($_SESSION['comment_account_loggedin']) && (($_SESSION['comment_account_id'] == $comment['acc_id'] && $comment['submit_date'] > date('Y-m-d H:i:s', strtotime('-' . max_comment_edit_time . ' minutes'))) || $_SESSION['comment_account_role'] == 'Admin') ? '<a class="edit-comment-btn" href="#" data-comment-id="' . $comment['id'] . '">Edit</a>' : '') . '
                ' . (isset($_SESSION['comment_account_loggedin']) && ($_SESSION['comment_account_id'] == $comment['acc_id'] || $_SESSION['comment_account_role'] == 'Admin') ? '<a class="delete-comment-btn" href="#" data-comment-id="' . $comment['id'] . '">Delete</a>' : '') . '
                ' . (isset($_SESSION['comment_account_loggedin']) && $_SESSION['comment_account_role'] == 'Admin' ? '<a class="moderate-comment-btn" href="/post/phpcomments/admin/comment.php?id=' . $comment['id'] . '" target="_blank">Moderate</a>' : '') . '    
                <a class="share-comment-btn" title="Share Comment" href="#" data-comment-id="' . $comment['id'] . '"><i class="fa-solid fa-link fa-sm"></i></a>
            </div>
            <div class="replies">' . ($current_nest < max_nested_replies ? show_comments($comments, $filters, $max_comments, $comment['id'], $current_nest+1) : '') . '</div>
        </div>
    </div>
    ' . ($current_nest >= max_nested_replies ? show_comments($comments, $filters, $max_comments, $comment['id'], $current_nest+1) : '');
    return $html;
}
// Output an array of comments
function show_comments($comments, $filters, $max_comments = -1, $parent_id = -1, $current_nest = 0) {
    $html = '';
    if ($parent_id != -1) {
        array_multisort(array_column($comments, 'submit_date'), SORT_ASC, $comments);
    }
    foreach ($comments as $comment) {
        if ($comment['parent_id'] == $parent_id) {
            $html .= show_comment($comment, $comments, $filters, $max_comments, $current_nest);
        }
    }
    return $html;
}
// Output the write comment form
function show_write_comment_form($parent_id = -1) {
    $input_html = '';
    if (!authentication_required && !isset($_SESSION['comment_account_loggedin'])) {
        $input_html = '
        <input type="text" name="name" placeholder="Your Name">
        ';       
    }
    $html = '
    <div class="write-comment hidden" data-comment-id="' . $parent_id . '">
        <form>
            <input name="parent_id" type="hidden" value="' . $parent_id . '">
            <input name="comment_id" type="hidden" value="-1">
            ' . $input_html . '
            <div class="content">
                <textarea name="content" placeholder="Write your comment..." maxlength="' . max_comment_chars . '" minlength="' . min_comment_chars . '" required></textarea>
                <div class="toolbar">
                    <i class="format-btn fa-solid fa-bold"></i>
                    <i class="format-btn fa-solid fa-italic"></i>
                    <i class="format-btn fa-solid fa-underline"></i>
                    <i class="format-btn fa-solid fa-heading"></i>
                    <i class="format-btn fa-solid fa-quote-left"></i>
                    <i class="format-btn fa-solid fa-code"></i>
                </div>
            </div>
            <p class="msg"></p>
            <div class="group">
                <button type="submit" class="post-button">Comment</button>
                <button type="submit" class="alt cancel-button">Cancel</button>
                <span class="loader hidden"></span>
            </div>
        </form>
    </div>
    ';
    return $html;
}
// Highlight comment function
function highlight_comment($comments, $comment_id, $highlighted = true) {
    foreach ($comments as $i => $comment) {
        if ($comment['id'] == $comment_id) {
            $highlighted_comment = $comment;
            if ($highlighted) {
                $highlighted_comment['highlighted'] = true;
            }
            unset($comments[$i]);
            array_unshift($comments, $highlighted_comment);
            if ($comment['parent_id'] != -1) {
                $comments = highlight_comment($comments, $comment['parent_id'], false);
            }
            break;
        }
    }
    return $comments;
}
// Update featured comments function
function update_featured_comments($comments) {
    foreach ($comments as $i => $comment) {
        if ($comment['featured']) {
            $featured_comment = $comment;
            unset($comments[$i]);
            array_unshift($comments, $featured_comment);
        }
    }
    return $comments;
}
// Page ID needs to exist as it is used to determine which comments are for which page.
if (isset($_GET['page_id'])) {
    // Authenticate user
    if (isset($_GET['method'], $_POST['email'], $_POST['password']) && $_GET['method'] == 'login') {
        // Retrieve the account
        $stmt = $pdo->prepare('SELECT * FROM accounts WHERE email = ?');
        $stmt->execute([ $_POST['email'] ]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC); 
        // Account exists + verify password
        if ($account) {
            // Verify password
            if (password_verify($_POST['password'], $account['password'])) {
                $_SESSION['comment_account_loggedin'] = TRUE;
                $_SESSION['comment_account_id'] = $account['id'];
                $_SESSION['comment_account_display_name'] = $account['display_name'];
                $_SESSION['comment_account_role'] = $account['role']; 
                $_SESSION['comment_account_email'] = $account['email'];
                exit('success');
            } else {
                exit('Incorrect email and/or password!');
            }
        } else {
            exit('Incorrect email and/or password!');
        }
    }
    // Register user
    if (isset($_GET['method'], $_POST['email'], $_POST['password'], $_POST['cpassword'], $_POST['name']) && $_GET['method'] == 'register') {
        // Check if email is already registered
        $stmt = $pdo->prepare('SELECT * FROM accounts WHERE email = ?');
        $stmt->execute([ $_POST['email'] ]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC); 
        if ($account) {
            exit('Email is already registered!');
        }
        // Check if password is valid
        if (strlen($_POST['password']) < 6 || strlen($_POST['password']) > 20) {
            exit('Password must be between 6 and 20 characters long!');
        }
        if ($_POST['cpassword'] != $_POST['password']) {
            exit('Passwords do not match!');
        }
        // Check if display name is valid
        if (strlen($_POST['name']) < 3 || strlen($_POST['name']) > 20) {
            exit('Display name must be between 3 and 20 characters long!');
        }
        if (!preg_match('/^[a-zA-Z0-9\s]+$/', $_POST['name'])) {
            exit('Display name must contain only letters and numbers!');
        }
        // Check if email is valid
        if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
            exit('Email is invalid!');
        }
        // Create account
        $stmt = $pdo->prepare('INSERT INTO accounts (email, password, display_name, role) VALUES (?, ?, ?, ?)');
        $stmt->execute([ $_POST['email'], password_hash($_POST['password'], PASSWORD_DEFAULT), $_POST['name'], 'Member' ]);
        // Authenticate user
        $_SESSION['comment_account_loggedin'] = TRUE;
        $_SESSION['comment_account_id'] = $pdo->lastInsertId();
        $_SESSION['comment_account_display_name'] = $_POST['name'];
        $_SESSION['comment_account_role'] = 'Member';
        $_SESSION['comment_account_email'] = $_POST['email'];
        exit('success');
    }
    // Delete comment
    if (isset($_GET['delete_comment'])) {
        // Retrieve the comment
        $stmt = $pdo->prepare('SELECT acc_id FROM comments WHERE id = ?');
        $stmt->execute([ $_GET['delete_comment'] ]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);
        // Check if the user is the owner of the comment or an admin
        if (isset($_SESSION['comment_account_loggedin']) && ($_SESSION['comment_account_id'] == $comment['acc_id'] || $_SESSION['comment_account_role'] == 'Admin')) {
            // Delete the comment
            $stmt = $pdo->prepare('DELETE FROM comments WHERE id = ?');
            $stmt->execute([ $_GET['delete_comment'] ]);
            exit('success');
        }
        exit('error');
    }
    // IF the user clicks one of the vote buttons
    if (isset($_GET['vote'], $_GET['comment_id'])) {
        // Check if the cookie exists for the specified comment
        if (!isset($_COOKIE['vote_' . $_GET['comment_id']])) {
            // Cookie does not exists, update the votes column and increment/decrement the value
            $stmt = $pdo->prepare('UPDATE comments SET votes = votes ' . ($_GET['vote'] == 'up' ? '+' : '-') . ' 1 WHERE id = ?');
            $stmt->execute([ $_GET['comment_id'] ]);
            // Set vote cookie, this will prevent the users from voting multiple times on the same comment, cookie expires in 10 years
            setcookie('vote_' . $_GET['comment_id'], 'true', time() + (10 * 365 * 24 * 60 * 60), '/');
        }
        // Retrieve the number of votes from the comments table
        $stmt = $pdo->prepare('SELECT votes FROM comments WHERE id = ?');
        $stmt->execute([ $_GET['comment_id'] ]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);
        // Output the votes
        echo $comment['votes'];
        exit;
    }
    // Retrieve the filters
    $filters = $pdo->query('SELECT * FROM comment_filters')->fetchAll(PDO::FETCH_ASSOC);
    // IF the user submits the write comment form
    if (isset($_POST['content'], $_POST['parent_id'], $_POST['comment_id'])) {
        // Validation
        if (strlen($_POST['content']) > max_comment_chars) {
            exit('Error: comment must be no longer than ' . max_comment_chars . ' characters long!');
        }
        if (strlen($_POST['content']) < min_comment_chars) {
            exit('Error: comment must be at least ' . min_comment_chars . ' characters long!');
        }
        // Display name must contain only characters and numbers.
        if (isset($_POST['name']) && !empty($_POST['name']) && !preg_match('/^[a-zA-Z\s]+$/', $_POST['name'])) {
            exit('Error: Display name must contain only letters and numbers!');
        }
        // Name must be between 3 and 20 characters long.
        if (isset($_POST['name']) && !empty($_POST['name']) && (strlen($_POST['name']) < 3 || strlen($_POST['name']) > 20)) {
            exit('Error: Display name must be between 3 and 20 characters long!');
        }
        // Check if authentication required
        if (authentication_required && !isset($_SESSION['comment_account_loggedin'])) {
            exit('Error: Please login to post a comment!');    
        }
        // Declare comment variables
        $approved = comments_approval_level == 0 ? 1 : 0;
        $approved = comments_approval_level == 1 && isset($_SESSION['comment_account_loggedin']) ? 1 : $approved;
        $approved = isset($_SESSION['comment_account_loggedin']) && $_SESSION['comment_account_role'] == 'Admin' ? 1 : $approved;
        $acc_id = isset($_SESSION['comment_account_loggedin']) ? $_SESSION['comment_account_id'] : -1; 
        $name = isset($_SESSION['comment_account_display_name']) ? $_SESSION['comment_account_display_name'] : 'Anonymous'; 
        $name = isset($_POST['name']) && !empty($_POST['name']) ? $_POST['name'] : $name;
        // IF the comment ID is not -1, update the comment
        if ($_POST['comment_id'] != -1 && isset($_SESSION['comment_account_loggedin'])) {
            // Update comment
            if ($_SESSION['comment_account_role'] == 'Admin') {
                $stmt = $pdo->prepare('UPDATE comments SET content = ?, edited_date = ? WHERE id = ?');
                $stmt->execute([ $_POST['content'], date('Y-m-d H:i:s'), $_POST['comment_id'] ]);
            } else {
                $stmt = $pdo->prepare('UPDATE comments SET content = ?, edited_date = ? WHERE id = ? AND acc_id = ? AND submit_date > ?');
                $stmt->execute([ $_POST['content'], date('Y-m-d H:i:s'), $_POST['comment_id'], $_SESSION['comment_account_id'], date('Y-m-d H:i:s', strtotime('-' . max_comment_edit_time . ' minutes')) ]);
            }
            $id = $_POST['comment_id'];
        } else {
            // Insert a new comment
            $stmt = $pdo->prepare('INSERT INTO comments (page_id, parent_id, display_name, content, submit_date, approved, acc_id) VALUES (?,?,?,?,?,?,?)');
            $stmt->execute([ $_GET['page_id'], $_POST['parent_id'], $name, $_POST['content'], date('Y-m-d H:i:s'), $approved, $acc_id ]);
            $id = $pdo->lastInsertId();
        }
        // Retrieve the comment
        $stmt = $pdo->prepare('SELECT c.*, a.role FROM comments c LEFT JOIN accounts a ON a.id = c.acc_id WHERE c.id = ?');
        $stmt->execute([ $id ]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);
        // Send notification email
        if (mail_enabled) {
            // Include PHPMailer library
            require 'lib/phpmailer/Exception.php';
            require 'lib/phpmailer/PHPMailer.php';
            require 'lib/phpmailer/SMTP.php';
            // Create an instance; passing `true` enables exceptions
            $mail = new PHPMailer(true);
            try {
                // SMTP Server settings
                if (SMTP) {
                    $mail->isSMTP();
                    $mail->Host = smtp_host;
                    $mail->SMTPAuth = true;
                    $mail->Username = smtp_user;
                    $mail->Password = smtp_pass;
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                    $mail->Port = smtp_port;
                }
                // Recipients
                $mail->setFrom(mail_from, mail_name);
                $mail->addAddress(notification_email);
                $mail->addReplyTo(mail_from, mail_name);
                // Content
                $mail->isHTML(true);
                $title = 'A new comment has been posted!';
                $mail->Subject = $title;
                // Email
                $email = isset($_SESSION['comment_account_loggedin']) ? $_SESSION['comment_account_email'] : '--';
                // Read the template contents and replace the "%link" placeholder with the above variable
                $email_template = str_replace(['%name%','%email%','%date%','%page_id%','%comment%','%url%','%title%','%btn_text%'], [$name, $email, date('Y-m-d H:i:s'), $_GET['page_id'], nl2br(strip_tags($_POST['content'])), comments_url . 'admin/comment.php?id=' . $id, $title, 'Manage Comment'], file_get_contents('notification-email-template.html'));
                $mail->Body = $email_template;
                $mail->AltBody = strip_tags($email_template);
                // Send mail
                $mail->send();
            } catch (Exception $e) {
                // Output error message
                exit('Error: Message could not be sent. Mailer Error: ' . $mail->ErrorInfo);
            }
            // Send reply email
            if ($_POST['parent_id'] != -1) {
                // Retrieve the parent comment
                $stmt = $pdo->prepare('SELECT c.*, a.role, a.email, pd.url FROM comments c JOIN accounts a ON a.id = c.acc_id JOIN comment_page_details pd ON pd.page_id = c.page_id WHERE c.id = ? AND c.acc_id != ?');
                $stmt->execute([ $_POST['parent_id'], $acc_id ]);
                $parent_comment = $stmt->fetch(PDO::FETCH_ASSOC);
                // Send email to the parent comment author
                if ($parent_comment) {
                    // Create an instance; passing `true` enables exceptions
                    $mail = new PHPMailer(true);
                    try {
                        // SMTP Server settings
                        if (SMTP) {
                            $mail->isSMTP();
                            $mail->Host = smtp_host;
                            $mail->SMTPAuth = true;
                            $mail->Username = smtp_user;
                            $mail->Password = smtp_pass;
                            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                            $mail->Port = smtp_port;
                        }
                        // Recipients
                        $mail->setFrom(mail_from, mail_name);
                        $mail->addAddress($parent_comment['email']);
                        $mail->addReplyTo(mail_from, mail_name);
                        // Content
                        $mail->isHTML(true);
                        $title = 'Someone replied to your comment!';
                        $mail->Subject = $title;
                        // Read the template contents and replace the "%link" placeholder with the above variable
                        $email_template = str_replace(['%name%','%email%','%date%','%page_id%','%comment%','%url%','%title%','%btn_text%'], [$parent_comment['display_name'], $parent_comment['email'], date('Y-m-d H:i:s'), $_GET['page_id'], nl2br(strip_tags($_POST['content'])), $parent_comment['url'] . '#comment-' . $parent_comment['id'], $title, 'View Comment'], file_get_contents('notification-email-template.html'));
                        $mail->Body = $email_template;
                        $mail->AltBody = strip_tags($email_template);
                        // Send mail
                        $mail->send();
                    } catch (Exception $e) {
                        // Output error message
                        exit('Error: Message could not be sent. Mailer Error: ' . $mail->ErrorInfo);
                    }
                }
            }
        }
        // Output the comment
        exit(show_comment($comment, [], $filters));
    }
    // If the limit variables exist, add the LIMIT clause to the SQL statement
    $comments_per_pagination_page = isset($_GET['comments_to_show']) ? $_GET['comments_to_show'] : -1;
    // Search comments
    if (isset($_GET['method'], $_GET['query']) && $_GET['method'] == 'search' && search_enabled) {
        // Retrieve the comments
        $stmt = $pdo->prepare('SELECT c.*, a.role FROM comments c LEFT JOIN accounts a ON a.id = c.acc_id WHERE c.page_id = ? AND (c.content LIKE ? OR c.display_name LIKE ?) ORDER BY c.submit_date DESC');
        $stmt->execute([ $_GET['page_id'], '%' . $_GET['query'] . '%', '%' . $_GET['query'] . '%' ]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        exit(show_comments($comments,  $filters, $comments_per_pagination_page));
    }
    // By default, order by the submit data (newest)
    $sort_by = 'ORDER BY c.votes DESC, c.submit_date DESC';
    if (isset($_GET['sort_by'])) {
        // User has changed the sort by, update the sort_by variable
        $sort_by = $_GET['sort_by'] == 'newest' ? 'ORDER BY c.submit_date DESC' : $sort_by;
        $sort_by = $_GET['sort_by'] == 'oldest' ? 'ORDER BY c.submit_date ASC' : $sort_by;
        $sort_by = $_GET['sort_by'] == 'votes' ? 'ORDER BY c.votes DESC, c.submit_date DESC' : $sort_by;
    }
    // Get all comments by the Page ID ordered by the submit date
    $stmt = $pdo->prepare('SELECT c.*, a.role FROM comments c LEFT JOIN accounts a ON a.id = c.acc_id WHERE c.page_id = :page_id AND c.approved = 1 ' . $sort_by);
    // Bind the page ID to our query
    $stmt->bindValue(':page_id', $_GET['page_id'], PDO::PARAM_INT);
    $stmt->execute();
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Highlighted comment
    $highlight_comment = isset($_GET['highlight_comment']) ? $_GET['highlight_comment'] : 0;
    // Put the highlighted comment first in the comments array
    if ($highlight_comment != 0) {
        $comments = highlight_comment($comments, $highlight_comment);
    }
    $comments = update_featured_comments($comments);
    // Get the overall rating and total number of comments
    $stmt = $pdo->prepare('SELECT COUNT(*) AS total_comments FROM comments WHERE page_id = ? AND approved = 1');
    $stmt->execute([ $_GET['page_id'] ]);
    $comments_info = $stmt->fetch(PDO::FETCH_ASSOC);
} else {
    exit('No page ID specified!');
}
?>
<div class="comment-header">
    <span class="total"><?=number_format($comments_info['total_comments'])?> Comments</span>
    <div class="comment-btns">
        <?php if (!isset($_SESSION['comment_account_loggedin'])): ?>
        <a href="#" class="login-btn"><i class="fa-solid fa-lock fa-sm"></i>Login</a>
        <?php endif; ?>
    </div>
    <div class="sort-by">
        <a href="#">Sort by <?=isset($_GET['sort_by']) ? htmlspecialchars(ucwords($_GET['sort_by']), ENT_QUOTES) : 'Votes'?><i class="fa-solid fa-caret-down fa-sm"></i></a>
        <div class="options">
            <a href="#" data-value="votes">Votes</a>
            <a href="#" data-value="newest">Newest</a>
            <a href="#" data-value="oldest">Oldest</a>
        </div>
    </div>
    <?php if (search_enabled): ?>
    <a href="#" class="search-btn<?=$comments_per_pagination_page == -1 || $comments_per_pagination_page > $comments_info['total_comments'] ? ' search-local' : '' ?>"><i class="fa-solid fa-search"></i></a>
    <?php endif; ?>
</div>

<div class="comment-auth-forms hidden">
    <form class="comment-login-form">
        <h3>Login</h3>
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Password" required>
        <div class="msg"></div>
        <button type="submit">Login</button>
    </form>
    <form autocomplete="off" class="comment-register-form">
        <h3>Register</h3>
        <input type="text" name="name" placeholder="Display Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Password" autocomplete="new-password" required>
        <input type="password" name="cpassword" placeholder="Confirm Password" autocomplete="new-password" required>
        <div class="msg"></div>
        <button type="submit">Register</button>
    </form>
</div>

<div class="comment-content">
    <?php if (search_enabled): ?>
    <div class="comment-search">
        <i class="fa-solid fa-search"></i>
        <input type="text" placeholder="Search..." data-comment-id="-1">
    </div>
    <?php endif; ?>
    <?php if (!authentication_required || isset($_SESSION['comment_account_loggedin'])): ?>
    <input type="text" placeholder="Write your comment..." class="comment-placeholder-content" data-comment-id="-1">
    <?php endif; ?>
</div>

<?=show_write_comment_form()?>

<div class="comments-wrapper">
    <?=show_comments($comments, $filters, $comments_per_pagination_page)?>
</div>

<?php if (!$comments): ?>
<p class="no-comments">There are no comments.</p>
<?php endif; ?>

<?php if ($comments_per_pagination_page != -1 && $comments_per_pagination_page < $comments_info['total_comments']): ?>
<div class="show-more-comments">
    <a href="#">Show More</a>
</div>
<?php endif; ?>