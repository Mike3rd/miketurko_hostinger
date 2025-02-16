<?php
include 'main.php';
// Form submit
if (isset($_POST['submit'])) {
    // Get the words from the textarea
    $words = explode("\n", $_POST['words']);
    // Loop through each word
    foreach ($words as $word) {
        // Trim the word
        $word = trim($word);
        // Check if the word is empty
        if (empty($word)) {
            continue;
        }
        // Set replacement character same length as word
        $replacement = str_repeat($_POST['replacement'], strlen($word));
        // Insert the word into the database
        $stmt = $pdo->prepare('INSERT INTO comment_filters (word,replacement) VALUES (?,?)');
        $stmt->execute([ $word, $replacement ]);
    }
    header('Location: comment_filters.php?success_msg=1');
    exit;
}
?>
<?=template_admin_header('Create Filter Bulk', 'comment_filters', 'manage_bulk')?>

<form action="" method="post">

    <div class="content-title responsive-flex-wrap responsive-pad-bot-3">
        <h2 class="responsive-width-100">Create Filter Bulk</h2>
        <a href="comment_filters.php" class="btn alt mar-right-2">Cancel</a>
        <input type="submit" name="submit" value="Save" class="btn">
    </div>

    <div class="content-block">

        <div class="form responsive-width-100">

            <label for="words"><i class="required">*</i> Words</label>
            <textarea id="words" type="text" name="words" placeholder="Word 1&#10;Word 2&#10;Word 3&#10;..." required></textarea>

            <label for="replacement"><i class="required">*</i> Character Replacement</label>
            <input id="replacement" type="text" name="replacement" placeholder="Character Replacement" required>

        </div>

    </div>

</form>

<?=template_admin_footer()?>