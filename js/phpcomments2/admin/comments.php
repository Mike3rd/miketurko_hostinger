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
// Order by column
$order = isset($_GET['order']) && $_GET['order'] == 'DESC' ? 'DESC' : 'ASC';
// Add/remove columns to the whitelist array
$order_by_whitelist = ['id','page_id','display_name','content','submit_date','votes','approved','acc_id'];
$order_by = isset($_GET['order_by']) && in_array($_GET['order_by'], $order_by_whitelist) ? $_GET['order_by'] : 'id';
// Number of results per pagination page
$results_per_page = 20;
// Declare query param variables
$param1 = ($pagination_page - 1) * $results_per_page;
$param2 = $results_per_page;
$param3 = '%' . $search . '%';
// SQL where clause
$where = '';
$where .= $search ? 'WHERE (display_name LIKE :search OR content LIKE :search) ' : '';
if (isset($_GET['page_id'])) {
    $where .= $where ? ' AND page_id = :page_id ' : ' WHERE page_id = :page_id ';
} 
// Retrieve the total number of comments
$stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM comments ' . $where);
if ($search) $stmt->bindParam('search', $param3, PDO::PARAM_STR);
if (isset($_GET['page_id'])) $stmt->bindParam('page_id', $_GET['page_id'], PDO::PARAM_INT);
$stmt->execute();
$comments_total = $stmt->fetchColumn();
// SQL query to get all comments from the "comments" table
$stmt = $pdo->prepare('SELECT * FROM comments ' . $where . ' ORDER BY ' . $order_by . ' ' . $order . ' LIMIT :start_results,:num_results');
// Bind params
$stmt->bindParam('start_results', $param1, PDO::PARAM_INT);
$stmt->bindParam('num_results', $param2, PDO::PARAM_INT);
if ($search) $stmt->bindParam('search', $param3, PDO::PARAM_STR);
if (isset($_GET['page_id'])) $stmt->bindParam('page_id', $_GET['page_id'], PDO::PARAM_INT);
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
}
// Determine the URL
$url = 'comments.php?search=' . $search . (isset($_GET['page_id']) ? '&page_id=' . $_GET['page_id'] : '');
?>
<?=template_admin_header('Comments', 'comments', 'view')?>

<div class="content-title">
    <h2>Comments</h2>
</div>

<?php if (isset($success_msg)): ?>
<div class="msg success">
    <i class="fas fa-check-circle"></i>
    <p><?=$success_msg?></p>
    <i class="fas fa-times"></i>
</div>
<?php endif; ?>


<div class="content-header responsive-flex-column pad-top-5">
    <a href="comment.php" class="btn">Create comment</a>
    <form action="" method="get">
        <input type="hidden" name="page" value="comments">
        <div class="search">
            <label for="search">
                <input id="search" type="text" name="search" placeholder="Search comment..." value="<?=htmlspecialchars($search, ENT_QUOTES)?>" class="responsive-width-100">
                <i class="fas fa-search"></i>
            </label>
        </div>
    </form>
</div>

<div class="content-block">
    <div class="table">
        <table>
            <thead>
                <tr>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=id'?>">#<?php if ($order_by=='id'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td colspan="2"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=display_name'?>">Name<?php if ($order_by=='display_name'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=content'?>">Content<?php if ($order_by=='content'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=page_id'?>">Page ID<?php if ($order_by=='page_id'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=acc_id'?>">Account ID<?php if ($order_by=='acc_id'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=votes'?>">Votes<?php if ($order_by=='votes'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=approved'?>">Approved<?php if ($order_by=='approved'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=submit_date'?>">Date<?php if ($order_by=='submit_date'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td>Actions</td>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($comments)): ?>
                <tr>
                    <td colspan="8" style="text-align:center;">There are no recent comments</td>
                </tr>
                <?php else: ?>
                <?php foreach ($comments as $comment): ?>
                <tr>
                    <td class="responsive-hidden"><?=$comment['id']?></td>
                    <td class="img">
                        <?=!empty($comment['img']) ? '<img src="' . htmlspecialchars($comment['img'], ENT_QUOTES) . '" alt="' . htmlspecialchars($comment['display_name'], ENT_QUOTES) . '\'s Profile Image">' : '<span style="background-color:' . color_from_string($comment['display_name']) . '">' . strtoupper(substr($comment['display_name'], 0, 1)) . '</span>';?>
                    </td>
                    <td><?=htmlspecialchars($comment['display_name'], ENT_QUOTES)?></td>
                    <td><?=nl2br(htmlspecialchars($comment['content'], ENT_QUOTES))?></td>
                    <td class="responsive-hidden"><a class="link1" href="comments.php?page_id=<?=htmlspecialchars($comment['page_id'], ENT_QUOTES)?>"><?=htmlspecialchars($comment['page_id'], ENT_QUOTES)?></a></td>
                    <td class="responsive-hidden"><?=$comment['acc_id'] != -1 ? '<a class="link1" href="account.php?id=' . htmlspecialchars($comment['acc_id'], ENT_QUOTES) . '">' . htmlspecialchars($comment['acc_id'], ENT_QUOTES) . '</a></td>' : '--'; ?></td>
                    <td class="responsive-hidden"><?=number_format($comment['votes'])?></td>
                    <td style="font-weight:500;color:<?=$comment['approved']?'green':'red'?>"><?=$comment['approved']?'Yes':'No'?></td>
                    <td class="responsive-hidden"><?=date('F j, Y H:ia', strtotime($comment['submit_date']))?></td>
                    <td>
                        <a href="comment.php?id=<?=$comment['id']?>" class="link1">Edit</a>
                        <a href="comments.php?delete=<?=$comment['id']?>" class="link1" onclick="return confirm('Are you sure you want to delete this comment?')">Delete</a>
                        <?php if (!$comment['approved']): ?>
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