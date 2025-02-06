<?php
include 'main.php';
// Remove script execution time limit and remove the upload file size limit
set_time_limit(0);
ini_set('post_max_size', '0');
ini_set('upload_max_filesize', '0');
// Function to format the message to be inserted into the database
function format_message($message) {
    // Decode html entities
    $message = html_entity_decode($message);
    // Replace all <br> tags with \r\n (newline)
    $message = str_replace(['<br />', '<br>', '<br >'], "\r\n", $message);
    // Replace all <p> tags with \r\n\r\n (double newline)
    $message = str_replace('</p><p>', "\r\n\r\n", $message);
    // Remove all paragraph tags and disqus placeholders
    $message = str_replace(['<p>', '</p>', ':disqus'], '', $message);
    // Format code blocks
    $message = str_replace(['<pre><code>', '</code></pre>'], ['<code>', '</code>'], $message);
    $message = str_replace(['<code>', '</code>'], ['<pre><code>', '</code></pre>'], $message);
    // Remove empty links with href="#"
    $message = preg_replace('/<a.*?href="#".*?>(.*?)<\/a>/', '', $message);
    // Replace all anchor tags with with the href attribute value
    $message = preg_replace('/<a.*?href="(.*?)".*?>(.*?)<\/a>/', ' $1 ', $message);
    return $message;
}
// Function to insert disqus posts into the database
function insert_disqus_posts($pdo, $posts, $parent_id = -1, $insert_id = -1) {
    $count = 0;
    foreach ($posts as $post) {
        // Skip spam 
        if ($post['isSpam'] == 'true') continue;
        // if ($post['isDeleted'] == 'true') continue;
        if ($post['parent_id'] == $parent_id) {
            $author = isset($post['author']['username']) ? $post['author']['username'] : 'Anonymous';
            $author = isset($post['author']['name']) ? $post['author']['name'] : $author;
            $author = $post['isDeleted'] == 'true' ? 'Anonymous' : $author;
            $message = $post['isDeleted'] == 'true' ? 'This comment was deleted.' : format_message($post['message']);
            $stmt = $pdo->prepare('INSERT INTO comments (page_id, parent_id, display_name, content, submit_date, edited_date, approved) VALUES (?, ?, ?, ?, ?, ?, 1)');
            $stmt->execute([ $post['unique_id'], $insert_id, $author, $message, date('Y-m-d H:i:s', strtotime($post['createdAt'])), date('Y-m-d H:i:s', strtotime($post['createdAt'])) ]);
            $count += insert_disqus_posts($pdo, $posts, $post['post_id'], $pdo->lastInsertId());
            $count++;
        }
    }
    return $count;
}
// Function to insert wordpress comments into the database
function insert_wordpress_comments($pdo, $comments, $parent_id = -1, $insert_id = -1) {
    $count = 0;
    foreach ($comments as $comment) {
        if ($comment['parent_id'] == $parent_id) {
            $message = format_message($comment['content']);
            $stmt = $pdo->prepare('INSERT INTO comments (page_id, parent_id, display_name, content, submit_date, edited_date, approved) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([ $comment['unique_id'], $insert_id, $comment['author'], $message, date('Y-m-d H:i:s', strtotime($comment['date'])), date('Y-m-d H:i:s', strtotime($comment['date'])), $comment['approved'] ]);
            $count += insert_wordpress_comments($pdo, $comments, $comment['comment_id'], $pdo->lastInsertId());
            $count++;
        }
    }
    return $count;
}
if (isset($_FILES['file']) && !empty($_FILES['file']['tmp_name']) && isset($_POST['source']) && !empty($_POST['source'])) {
    // check type
    $type = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
    $data = [];
    if ($type == 'csv') {
        $file = fopen($_FILES['file']['tmp_name'], 'r');
        $header = fgetcsv($file);
        while ($row = fgetcsv($file)) {
            $data[] = array_combine($header, $row);
        }
        fclose($file);
    } elseif ($type == 'json') {
        $data = json_decode(file_get_contents($_FILES['file']['tmp_name']), true);
    } elseif ($type == 'xml') {
        if ($_POST['source'] == 'native') {
            $xml = simplexml_load_file($_FILES['file']['tmp_name']);
            $data = json_decode(json_encode($xml), true)['comment'];
        } elseif ($_POST['source'] == 'disqus') {
            $xml = simplexml_load_file($_FILES['file']['tmp_name'], 'SimpleXMLElement', LIBXML_NOCDATA);
            $json_comments = [];
            foreach ($xml->post as $comment) {
                $comment_json = json_decode(json_encode($comment), true);
                $comment_json['parent_id'] = isset($comment->parent) ? (string)$comment->parent->attributes('dsq', true)->id : -1;
                $comment_json['post_id'] = (string)$comment->attributes('dsq', true)->id;
                $comment_json['thread_id'] = isset($comment->thread) ? (string)$comment->thread->attributes('dsq', true)->id : -1;
                $comment_json['unique_id'] = 0;
                foreach ($xml->thread as $thread) {
                    if ((string)$thread->attributes('dsq', true)->id == $comment_json['thread_id']) {
                        $comment_json['unique_id'] = (string)$thread->id;
                        break;
                    }
                }
                $comment_json['children'] = [];
                $json_comments[] = $comment_json;
            }
            $count = insert_disqus_posts($pdo, $json_comments);
            header('Location: comments.php?success_msg=4&imported=' . $count);
            exit;
        } else if ($_POST['source'] == 'wordpress') {
            $xml = simplexml_load_file($_FILES['file']['tmp_name'], 'SimpleXMLElement', LIBXML_NOCDATA);
            $json_comments = [];
            foreach ($xml->channel->item as $item) {
                foreach ($item->children('wp', true)->comment as $c) {
                    $comment = [];
                    $comment['parent_id'] = (string)$c->children('wp', true)->comment_parent == 0 ? -1 : (string)$c->children('wp', true)->comment_parent;
                    $comment['comment_id'] = (string)$c->children('wp', true)->comment_id;
                    $comment['unique_id'] = (string)$item->children('wp', true)->post_id;
                    $comment['content'] = (string)$c->children('wp', true)->comment_content;
                    $comment['author'] = (string)$c->children('wp', true)->comment_author;
                    $comment['date'] = (string)$c->children('wp', true)->comment_date;
                    $comment['approved'] = (string)$c->children('wp', true)->comment_approved;
                    $comment['children'] = [];
                    $json_comments[] = $comment;
                }
            }
            $count = insert_wordpress_comments($pdo, $json_comments);
            header('Location: comments.php?success_msg=4&imported=' . $count);
            exit;
        }
    } elseif ($type == 'txt') {
        $file = fopen($_FILES['file']['tmp_name'], 'r');
        while ($row = fgetcsv($file)) {
            $data[] = $row;
        }
        fclose($file);
    }
    // insert into database
    if (isset($data) && !empty($data)) {    
        $i = 0;   
        foreach ($data as $k => $row) {
            // skip first row
            if ($k == 0) {
                continue;
            }
            // convert array to question marks for prepared statements
            $values = array_fill(0, count($row), '?');
            $values = implode(',', $values);
            // insert into database
            $stmt = $pdo->prepare('INSERT IGNORE INTO comments VALUES (' . $values . ')');
            $stmt->execute(array_values($row));
            $i++;
        }
        header('Location: comments.php?success_msg=4&imported=' . $i);
        exit;
    }
}
?>
<?=template_admin_header('Import Comments', 'comments', 'import')?>

<form action="" method="post" enctype="multipart/form-data">

    <div class="content-title responsive-flex-wrap responsive-pad-bot-3">
        <h2 class="responsive-width-100">Import Comments</h2>
        <a href="comments.php" class="btn alt mar-right-2">Cancel</a>
        <input type="submit" name="submit" value="Import" class="btn">
    </div>

    <div class="content-block">

        <div class="form responsive-width-100">

            <label for="source">Source</label>
            <select id="source" name="source">
                <option value="native">Native</option>
                <option value="disqus">Disqus</option>
                <option value="wordpress">WordPress</option>
            </select>

            <div class="source disqus hidden">
                <ul>
                    <li>
                        <strong>Login to your Disqus Admin Panel:</strong><br>
                        Log in to your Disqus account using your administrator credentials.
                    </li>
                    <li>
                        <strong>Access the Export Feature:</strong><br>
                        Inside the Disqus Admin panel, navigate to <em>Community</em> » <em>Tools</em> » <em>Export</em>.
                    </li>
                    <li>
                        <strong>Select "Export Comments":</strong><br>
                        In the Data Export section, click the <em>Export Comments</em> button.
                    </li>
                    <li>
                        <strong>Receive Export Link:</strong><br>
                        Once the export is complete, you'll receive an email containing a link to download the exported data.
                    </li>
                </ul>
            </div>

            <div class="source wordpress hidden">
                <ul>
                    <li>
                        <strong>Login to your WordPress Admin Panel:</strong><br>
                        Log in to your WordPress website's admin panel using your administrator credentials.
                    </li>
                    <li>
                        <strong>Navigate to the Export Tool:</strong><br>
                        In the admin dashboard, go to Tools » Export.
                    </li>
                    <li>
                        <strong>Select the "Posts" option:</strong><br>
                        On the Export page, you will see various content types available for export. Choose the "Posts" option.
                    </li>
                    <li>
                        <strong>Choose Specific Comments (Optional):</strong><br>
                        If you want to export specific comments, you can use the filtering options to select comments based on date, author, or other criteria.
                    </li>
                    <li>
                        <strong>Click "Download Export File":</strong><br>
                        Click the "Download Export File" button. WordPress will generate an XML file containing the selected comments.
                    </li>
                </ul>
            </div>

            <label for="file"><i class="required">*</i> File</label>
            <input type="file" name="file" id="file" accept=".csv,.json,.xml,.txt" required>

        </div>

    </div>

</form>

<script>
document.querySelector('#source').addEventListener('change', function(e) {
    document.querySelectorAll('.source').forEach(function(div) {
        div.classList.add('hidden');
    });
    document.querySelector('.' + this.value).classList.remove('hidden');
});
</script>

<?=template_admin_footer()?>