<?php
include 'main.php';
// Default comment product values
$comment = [
    'page_id' => '',
    'parent_id' => -1,
    'display_name' => '',
    'content' => '',
    'submit_date' => date('Y-m-d H:i:s'),
    'votes' => '',
    'approved' => 1,
    'acc_id' => -1,
    'featured' => 0,
];
// Retrieve accounts from the database
$stmt = $pdo->prepare('SELECT * FROM accounts');
$stmt->execute();
$accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (isset($_GET['id'])) {
    // Retrieve the comment from the database
    $stmt = $pdo->prepare('SELECT * FROM comments WHERE id = ?');
    $stmt->execute([ $_GET['id'] ]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);
    // ID param exists, edit an existing comment
    $page = 'Edit';
    if (isset($_POST['submit'])) {
        // Update the comment
        $stmt = $pdo->prepare('UPDATE comments SET page_id = ?, parent_id = ?, display_name = ?, content = ?, submit_date = ?, votes = ?, approved = ?, acc_id = ?, featured = ? WHERE id = ?');
        $stmt->execute([ $_POST['page_id'], $_POST['parent_id'], $_POST['display_name'], $_POST['content'], date('Y-m-d H:i:s', strtotime($_POST['submit_date'])), $_POST['votes'], $_POST['approved'], $_POST['acc_id'], $_POST['featured'], $_GET['id'] ]);
        header('Location: comments.php?success_msg=2');
        exit;
    }
    if (isset($_POST['delete'])) {
        // Delete the comment
        $stmt = $pdo->prepare('DELETE FROM comments WHERE id = ?');
        $stmt->execute([ $_GET['id'] ]);
        header('Location: comments.php?success_msg=3');
        exit;
    }
} else {
    // Create a new comment
    $page = 'Create';
    if (isset($_POST['submit'])) {
        $stmt = $pdo->prepare('INSERT INTO comments (page_id,parent_id,display_name,content,submit_date,votes,approved,acc_id,featured) VALUES (?,?,?,?,?,?,?,?,?)');
        $stmt->execute([ $_POST['page_id'], $_POST['parent_id'], $_POST['display_name'], $_POST['content'], date('Y-m-d H:i:s', strtotime($_POST['submit_date'])), $_POST['votes'], $_POST['approved'], $_POST['acc_id'], $_POST['featured'] ]);
        header('Location: comments.php?success_msg=1');
        exit;
    }
}
?>
<?=template_admin_header($page . ' Comment', 'comments', 'manage')?>

<form action="" method="post">

    <div class="content-title responsive-flex-wrap responsive-pad-bot-3">
        <h2 class="responsive-width-100"><?=$page?> Comment</h2>
        <a href="comments.php" class="btn alt mar-right-2">Cancel</a>
        <?php if ($page == 'Edit'): ?>
        <input type="submit" name="delete" value="Delete" class="btn red mar-right-2" onclick="return confirm('Are you sure you want to delete this comment?')">
        <?php endif; ?>
        <input type="submit" name="submit" value="Save" class="btn">
    </div>

    <div class="content-block">

        <div class="form responsive-width-100">

            <label for="page_id"><i class="required">*</i> Page ID</label>
            <input id="page_id" type="text" name="page_id" placeholder="Page ID" value="<?=htmlspecialchars($comment['page_id'], ENT_QUOTES)?>" required>

            <label for="parent_id"><i class="required">*</i> Parent ID</label>
            <input id="parent_id" type="number" name="parent_id" placeholder="Parent ID" value="<?=htmlspecialchars($comment['parent_id'], ENT_QUOTES)?>" required>

            <label for="display_name"><i class="required">*</i> Display Name</label>
            <input id="display_name" type="text" name="display_name" placeholder="Display Name" value="<?=htmlspecialchars($comment['display_name'], ENT_QUOTES)?>" required>

            <label for="content"><i class="required">*</i> Content</label>
            <textarea id="content" name="content" placeholder="Write your comment..." required><?=htmlspecialchars($comment['content'], ENT_QUOTES)?></textarea>

            <label for="submit_date"><i class="required">*</i> Date Submitted</label>
            <input id="submit_date" type="datetime-local" name="submit_date" placeholder="Date" value="<?=date('Y-m-d\TH:i', strtotime($comment['submit_date']))?>" required>

            <label for="votes"><i class="required">*</i> Votes</label>
            <input id="votes" type="number" name="votes" placeholder="Votes" value="<?=$comment['votes']?>" required>

            <label for="approved"><i class="required">*</i> Approved</label>
            <select id="approved" name="approved" required>
                <option value="0"<?=$comment['approved']==0?' selected':''?>>No</option>
                <option value="1"<?=$comment['approved']==1?' selected':''?>>Yes</option>
            </select>

            <label for="featured"><i class="required">*</i> Featured</label>
            <select id="featured" name="featured" required>
                <option value="0"<?=$comment['featured']==0?' selected':''?>>No</option>
                <option value="1"<?=$comment['featured']==1?' selected':''?>>Yes</option>
            </select>

            <label for="acc_id">Account</label>
            <select id="acc_id" name="acc_id" required>
                <option value="-1">(none)</option>
                <?php foreach ($accounts as $account): ?>
                <option value="<?=$account['id']?>"<?=$account['id']==$comment['acc_id']?' selected':''?>><?=$account['id']?> - <?=$account['email']?></option>
                <?php endforeach; ?>
            </select>

        </div>

    </div>

</form>

<?=template_admin_footer()?>