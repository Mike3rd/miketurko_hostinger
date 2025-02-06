<?php
include 'main.php';
// Delete comment
if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare('DELETE FROM comments WHERE id = ?');
    $stmt->execute([ $_GET['delete'] ]);
    header('Location: comments.php?success_msg=3');
    exit;
}
// Approve comment
if (isset($_GET['approve'])) {
    $stmt = $pdo->prepare('UPDATE comments SET approved = 1 WHERE id = ?');
    $stmt->execute([ $_GET['approve'] ]);
    header('Location: comments.php?success_msg=2');
    exit;
}
// Retrieve the GET request parameters (if specified)
$pagination_page = isset($_GET['pagination_page']) ? $_GET['pagination_page'] : 1;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$status = isset($_GET['status']) ? $_GET['status'] : 'all';
// Order by column
$order = isset($_GET['order']) && $_GET['order'] == 'DESC' ? 'DESC' : 'ASC';
// Add/remove columns to the whitelist array
$order_by_whitelist = ['id','page_id','display_name','content','submit_date','votes','approved','acc_id'];
$order_by = isset($_GET['order_by']) && in_array($_GET['order_by'], $order_by_whitelist) ? $_GET['order_by'] : 'id';
// Number of results per pagination page
$results_per_page = 10;
// Declare query param variables
$param1 = ($pagination_page - 1) * $results_per_page;
$param2 = $results_per_page;
$param3 = '%' . $search . '%';
// SQL where clause
$where = '';
$where .= $search ? 'WHERE (c.display_name LIKE :search OR c.content LIKE :search) ' : '';
if (isset($_GET['page_id']) && !empty($_GET['page_id'])) {
    $where .= $where ? ' AND c.page_id = :page_id ' : ' WHERE c.page_id = :page_id ';
} 
if (isset($_GET['acc_id']) && !empty($_GET['acc_id'])) {
    $where .= $where ? ' AND c.acc_id = :acc_id ' : ' WHERE c.acc_id = :acc_id ';
}
if ($status != 'all') {
    $where .= $where ? ' AND c.approved = :approved ' : ' WHERE c.approved = :approved ';
}
// Retrieve the total number of comments
$stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM comments c ' . $where);
if ($search) $stmt->bindParam('search', $param3, PDO::PARAM_STR);
if (isset($_GET['page_id']) && !empty($_GET['page_id'])) $stmt->bindParam('page_id', $_GET['page_id'], PDO::PARAM_INT);
if (isset($_GET['acc_id']) && !empty($_GET['acc_id'])) $stmt->bindParam('acc_id', $_GET['acc_id'], PDO::PARAM_INT);
if ($status != 'all') $stmt->bindParam('approved', $status, PDO::PARAM_INT);
$stmt->execute();
$comments_total = $stmt->fetchColumn();
// SQL query to get all comments from the "comments" table
$stmt = $pdo->prepare('SELECT c.*, a.email, p.url FROM comments c LEFT JOIN accounts a ON a.id = c.acc_id LEFT JOIN comment_page_details p ON p.page_id = c.page_id ' . $where . ' ORDER BY ' . $order_by . ' ' . $order . ' LIMIT :start_results,:num_results');
// Bind params
$stmt->bindParam('start_results', $param1, PDO::PARAM_INT);
$stmt->bindParam('num_results', $param2, PDO::PARAM_INT);
if ($search) $stmt->bindParam('search', $param3, PDO::PARAM_STR);
if (isset($_GET['page_id']) && !empty($_GET['page_id'])) $stmt->bindParam('page_id', $_GET['page_id'], PDO::PARAM_INT);
if (isset($_GET['acc_id']) && !empty($_GET['acc_id'])) $stmt->bindParam('acc_id', $_GET['acc_id'], PDO::PARAM_INT);
if ($status != 'all') $stmt->bindParam('approved', $status, PDO::PARAM_INT);
$stmt->execute();
// Retrieve query results
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
// Handle success messages
if (isset($_GET['success_msg'])) {
    if ($_GET['success_msg'] == 1) {
        $success_msg = 'Comment created successfully!';
    }
    if ($_GET['success_msg'] == 2) {
        $success_msg = 'Comment updated successfully!';
    }
    if ($_GET['success_msg'] == 3) {
        $success_msg = 'Comment deleted successfully!';
    }
    if ($_GET['success_msg'] == 4) {
        $success_msg = $_GET['imported'] . ' comment(s) imported successfully!';
    }
}
// Determine the URL
$url = 'comments.php?search=' . $search . (isset($_GET['page_id']) ? '&page_id=' . $_GET['page_id'] : '') . (isset($_GET['acc_id']) ? '&acc_id=' . $_GET['acc_id'] : '') . '&status=' . $status;
?>
<?=template_admin_header('Comments', 'comments', 'view')?>

<div class="content-title">
    <div class="title">
        <i class="fa-solid fa-comment-dots"></i>
        <div class="txt">
            <h2>Comments</h2>
            <p>View, manage, and search comments.</p>
        </div>
    </div>
</div>

<?php if (isset($success_msg)): ?>
<div class="msg success">
    <i class="fas fa-check-circle"></i>
    <p><?=$success_msg?></p>
    <i class="fas fa-times"></i>
</div>
<?php endif; ?>


<div class="content-header responsive-flex-column pad-top-5">
    <div class="btns">
        <a href="comment.php" class="btn">Create Comment</a>
        <a href="comments_import.php" class="btn mar-left-1">Import</a>
        <a href="comments_export.php" class="btn mar-left-1">Export</a>
    </div>
    <form action="" method="get">
        <input type="hidden" name="page" value="comments">
        <div class="filters">
            <a href="#"><i class="fas fa-sliders-h"></i> Filters</a>
            <div class="list">
                <label>
                    Status
                    <select name="status">
                        <option value="all"<?=$status=='all'?' selected':''?>>All</option>
                        <option value="0"<?=$status==0?' selected':''?>>Pending</option>
                        <option value="1"<?=$status==1?' selected':''?>>Approved</option>
                    </select>
                </label>
                <label>Account ID<input type="text" name="acc_id" value="<?=isset($_GET['acc_id']) ? htmlspecialchars($_GET['acc_id'], ENT_QUOTES) : ''?>" placeholder="Account ID"></label>
                <label>Page ID<input type="text" name="page_id" value="<?=isset($_GET['page_id']) ? htmlspecialchars($_GET['page_id'], ENT_QUOTES) : ''?>" placeholder="Page ID"></label>
                <button type="submit">Apply</button>
            </div>
        </div>
        <div class="search">
            <label for="search">
                <input id="search" type="text" name="search" placeholder="Search comment..." value="<?=htmlspecialchars($search, ENT_QUOTES)?>" class="responsive-width-100">
                <i class="fas fa-search"></i>
            </label>
        </div>
    </form>
</div>

<div class="filter-list">
    <?php if (isset($_GET['page_id']) && !empty($_GET['page_id'])): ?>
    <div class="filter"><a href="<?=str_replace('&page_id=' . $_GET['page_id'], '', $url)?>"><i class="fa-solid fa-xmark"></i></a> Page ID : <?=htmlspecialchars($_GET['page_id'], ENT_QUOTES)?></div>
    <?php endif; ?>
    <?php if (isset($_GET['acc_id']) && !empty($_GET['acc_id'])): ?>
    <div class="filter"><a href="<?=str_replace('&acc_id=' . $_GET['acc_id'], '', $url)?>"><i class="fa-solid fa-xmark"></i></a> Account ID : <?=htmlspecialchars($_GET['acc_id'], ENT_QUOTES)?></div>
    <?php endif; ?>
    <?php if ($status != 'all'): ?>
    <div class="filter"><a href="<?=str_replace('&status=' . $status, '', $url)?>"><i class="fa-solid fa-xmark"></i></a> Status : <?=$status==0?'Pending':'Approved'?></div>
    <?php endif; ?>
</div>

<div class="content-block">
    <div class="table">
        <table>
            <thead>
                <tr>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=id'?>">#<?php if ($order_by=='id'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td colspan="2"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=display_name'?>">Name<?php if ($order_by=='display_name'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=content'?>">Content<?php if ($order_by=='content'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=page_id'?>">Page ID<?php if ($order_by=='page_id'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=votes'?>">Votes<?php if ($order_by=='votes'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=approved'?>">Approved<?php if ($order_by=='approved'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=submit_date'?>">Date<?php if ($order_by=='submit_date'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td>Actions</td>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($comments)): ?>
                <tr>
                    <td colspan="10" class="no-results">There are no comments.</td>
                </tr>
                <?php else: ?>
                <?php foreach ($comments as $comment): ?>
                <tr>
                    <td class="responsive-hidden"><?=$comment['id']?></td>
                    <td class="img">
                        <span style="background-color:<?=color_from_string($comment['display_name'])?>"><?=strtoupper(substr($comment['display_name'], 0, 1))?></span>
                    </td>
                    <td class="user">
                        <?=htmlspecialchars($comment['display_name'], ENT_QUOTES)?>
                        <?php if ($comment['email']): ?>
                        <span><?=$comment['email']?></span>
                        <?php endif; ?>
                    </td>
                    <td class="responsive-hidden truncated-txt">
                        <div>
                            <span class="short"><?=nl2br(htmlspecialchars(mb_strimwidth($comment['content'], 0, 50, "..."), ENT_QUOTES))?></span>
                            <span class="full"><?=nl2br(htmlspecialchars($comment['content'], ENT_QUOTES))?></span>
                            <?php if (strlen($comment['content']) > 50): ?>
                            <a href="#" class="read-more">Read More</a>
                            <?php endif; ?>
                        </div>
                    </td>
                    <td class="responsive-hidden"><?=$comment['url'] ? '<a href="' . htmlspecialchars($comment['url'], ENT_QUOTES) . '" target="_blank" class="link1">' . $comment['page_id'] . '</a>' : $comment['page_id']?></td>
                    <td class="responsive-hidden"><?=number_format($comment['votes'])?></td>
                    <td><span class="<?=$comment['approved']==1?'green':'grey'?>"><?=$comment['approved']==1?'Approved':'Pending'?></span></td>
                    <td class="responsive-hidden"><?=date('F j, Y H:ia', strtotime($comment['submit_date']))?></td>
                    <td>
                        <a href="comment.php?id=<?=$comment['id']?>" class="link1">Edit</a>
                        <a href="comments.php?delete=<?=$comment['id']?>" class="link1" onclick="return confirm('Are you sure you want to delete this comment?')">Delete</a>
                        <?php if ($comment['approved'] != 1): ?>
                        <a href="comments.php?approve=<?=$comment['id']?>" class="link1" onclick="return confirm('Are you sure you want to approve this comment?')">Approve</a>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<div class="pagination">
    <?php if ($pagination_page > 1): ?>
    <a href="<?=$url?>&pagination_page=<?=$pagination_page-1?>&order=<?=$order?>&order_by=<?=$order_by?>">Prev</a>
    <?php endif; ?>
    <span>Page <?=$pagination_page?> of <?=ceil($comments_total / $results_per_page) == 0 ? 1 : ceil($comments_total / $results_per_page)?></span>
    <?php if ($pagination_page * $results_per_page < $comments_total): ?>
    <a href="<?=$url?>&pagination_page=<?=$pagination_page+1?>&order=<?=$order?>&order_by=<?=$order_by?>">Next</a>
    <?php endif; ?>
</div>

<?=template_admin_footer()?>