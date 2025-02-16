<?php
include 'main.php';
// Retrieve the GET request parameters (if specified)
$pagination_page = isset($_GET['pagination_page']) ? $_GET['pagination_page'] : 1;
$search = isset($_GET['search']) ? $_GET['search'] : '';
// Order by column
$order = isset($_GET['order']) && $_GET['order'] == 'DESC' ? 'DESC' : 'ASC';
// Add/remove columns to the whitelist array
$order_by_whitelist = ['page_id','title','description','url','num_comments'];
$order_by = isset($_GET['order_by']) && in_array($_GET['order_by'], $order_by_whitelist) ? $_GET['order_by'] : 'page_id';
// Number of results per pagination page
$results_per_page = 15;
// Declare query param variables
$param1 = ($pagination_page - 1) * $results_per_page;
$param2 = $results_per_page;
$param3 = '%' . $search . '%';
// SQL where clause
$where = '';
$where .= $search ? 'WHERE (c.page_id LIKE :search OR p.title LIKE :search OR p.description LIKE :search OR p.url LIKE :search) ' : '';
// Retrieve the total number of pages
$stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM comments c LEFT JOIN comment_page_details p ON p.page_id = c.page_id ' . $where . ' GROUP BY c.page_id');
if ($search) $stmt->bindParam('search', $param3, PDO::PARAM_STR);
$stmt->execute();
$pages_total = count($stmt->fetchAll(PDO::FETCH_ASSOC));
// SQL query to get all pages
$stmt = $pdo->prepare('SELECT COUNT(c.id) AS num_comments, c.page_id, p.title, p.description, p.url FROM comments c LEFT JOIN comment_page_details p ON p.page_id = c.page_id ' . $where . ' GROUP BY c.page_id ORDER BY ' . $order_by . ' ' . $order . ' LIMIT :start_results,:num_results');
// Bind params
$stmt->bindParam('start_results', $param1, PDO::PARAM_INT);
$stmt->bindParam('num_results', $param2, PDO::PARAM_INT);
if ($search) $stmt->bindParam('search', $param3, PDO::PARAM_STR);
$stmt->execute();
// Retrieve query results
$pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
// Handle success messages
if (isset($_GET['success_msg'])) {
    if ($_GET['success_msg'] == 1) {
        $success_msg = 'Page details updated successfully!';
    }
}
// Determine the URL
$url = 'comment_pages.php?search=' . $search;
?>
<?=template_admin_header('Pages', 'pages', 'view')?>

<div class="content-title">
    <div class="title">
        <i class="fa-solid fa-file-lines"></i>
        <div class="txt">
            <h2>Pages</h2>
            <p>Pages will automatically appear when new comments are posted.</p>
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
    <div></div>
    <form action="" method="get">
        <div class="search">
            <label for="search">
                <input id="search" type="text" name="search" placeholder="Search page..." value="<?=htmlspecialchars($search, ENT_QUOTES)?>" class="responsive-width-100">
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
                    <td><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=page_id'?>">Page ID<?php if ($order_by=='page_id'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=title'?>">Title<?php if ($order_by=='title'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=description'?>">Description<?php if ($order_by=='description'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td class="responsive-hidden"><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=url'?>">URL<?php if ($order_by=='url'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=num_comments'?>">Total Comments<?php if ($order_by=='num_comments'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td>Actions</td>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($pages)): ?>
                <tr>
                    <td colspan="8" class="no-results">There are no pages</td>
                </tr>
                <?php else: ?>
                <?php foreach ($pages as $page): ?>
                <tr>
                    <td><?=$page['page_id']?></td>
                    <td><?=htmlspecialchars($page['title'] ? $page['title'] : '--', ENT_QUOTES)?></td>
                    <td class="responsive-hidden"><?=htmlspecialchars($page['description'] ? $page['description'] : '--', ENT_QUOTES)?></td>
                    <td class="responsive-hidden"><?=$page['url'] ? '<a href="' . htmlspecialchars($page['url'], ENT_QUOTES) . '" class="link1" target="_blank">' . htmlspecialchars($page['url'], ENT_QUOTES) . '</a>' : '--'?></td>
                    <td><a href="comments.php?page_id=<?=$page['page_id']?>" class="link1"><?=number_format($page['num_comments'])?></a></td>
                    <td><a href="comment_page.php?id=<?=$page['page_id']?>" class="link1">Edit Details</a></td>
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
    <span>Page <?=$pagination_page?> of <?=ceil($pages_total / $results_per_page) == 0 ? 1 : ceil($pages_total / $results_per_page)?></span>
    <?php if ($pagination_page * $results_per_page < $pages_total): ?>
    <a href="<?=$url?>&pagination_page=<?=$pagination_page+1?>&order=<?=$order?>&order_by=<?=$order_by?>">Next</a>
    <?php endif; ?>
</div>

<?=template_admin_footer()?>