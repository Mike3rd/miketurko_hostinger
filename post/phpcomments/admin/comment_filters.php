<?php
include 'main.php';
// Delete filter
if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare('DELETE FROM comment_filters WHERE id = ?');
    $stmt->execute([ $_GET['delete'] ]);
    header('Location: comment_filters.php?success_msg=3');
    exit;
}
// Retrieve the GET request parameters (if specified)
$pagination_page = isset($_GET['pagination_page']) ? $_GET['pagination_page'] : 1;
$search = isset($_GET['search']) ? $_GET['search'] : '';
// Order by column
$order = isset($_GET['order']) && $_GET['order'] == 'DESC' ? 'DESC' : 'ASC';
// Add/remove columns to the whitelist array
$order_by_whitelist = ['id','word','replacement'];
$order_by = isset($_GET['order_by']) && in_array($_GET['order_by'], $order_by_whitelist) ? $_GET['order_by'] : 'id';
// Number of results per pagination page
$results_per_page = 20;
// Declare query param variables
$param1 = ($pagination_page - 1) * $results_per_page;
$param2 = $results_per_page;
$param3 = '%' . $search . '%';
// SQL where clause
$where = '';
$where .= $search ? 'WHERE (word LIKE :search OR replacement LIKE :search) ' : '';
// Retrieve the total number of filters
$stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM comment_filters ' . $where);
if ($search) $stmt->bindParam('search', $param3, PDO::PARAM_STR);
$stmt->execute();
$filters_total = $stmt->fetchColumn();
// SQL query to get all filters from the "filters" table
$stmt = $pdo->prepare('SELECT * FROM comment_filters ' . $where . ' ORDER BY ' . $order_by . ' ' . $order . ' LIMIT :start_results,:num_results');
// Bind params
$stmt->bindParam('start_results', $param1, PDO::PARAM_INT);
$stmt->bindParam('num_results', $param2, PDO::PARAM_INT);
if ($search) $stmt->bindParam('search', $param3, PDO::PARAM_STR);
$stmt->execute();
// Retrieve query results
$filters = $stmt->fetchAll(PDO::FETCH_ASSOC);
// Handle success messages
if (isset($_GET['success_msg'])) {
    if ($_GET['success_msg'] == 1) {
        $success_msg = 'Filter created successfully!';
    }
    if ($_GET['success_msg'] == 2) {
        $success_msg = 'Filter updated successfully!';
    }
    if ($_GET['success_msg'] == 3) {
        $success_msg = 'Filter deleted successfully!';
    }
}
// Determine the URL
$url = 'comment_filters.php?search=' . $search;
?>
<?=template_admin_header('Filters', 'comment_filters', 'view')?>

<div class="content-title">
    <div class="title">
        <i class="fa-solid fa-filter"></i>
        <div class="txt">
            <h2>Filters</h2>
            <p>View, manage, and search filters.</p>
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
        <a href="comment_filter.php" class="btn">Create Filter</a>
        <a href="comment_filter_bulk.php" class="btn mar-left-1">Bulk Create</a>
    </div>
    <form action="" method="get">
        <input type="hidden" name="page" value="filters">
        <div class="search">
            <label for="search">
                <input id="search" type="text" name="search" placeholder="Search filter..." value="<?=htmlspecialchars($search, ENT_QUOTES)?>" class="responsive-width-100">
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
                    <td><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=word'?>">Word<?php if ($order_by=='word'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td><a href="<?=$url . '&order=' . ($order=='ASC'?'DESC':'ASC') . '&order_by=replacement'?>">Replacement<?php if ($order_by=='replacement'): ?><i class="fas fa-level-<?=str_replace(['ASC', 'DESC'], ['up','down'], $order)?>-alt fa-xs"></i><?php endif; ?></a></td>
                    <td>Actions</td>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($filters)): ?>
                <tr>
                    <td colspan="10" class="no-results">There are no filters.</td>
                </tr>
                <?php else: ?>
                <?php foreach ($filters as $filter): ?>
                <tr>
                    <td class="responsive-hidden"><?=$filter['id']?></td>
                    <td><?=htmlspecialchars($filter['word'], ENT_QUOTES)?></td>
                    <td><?=htmlspecialchars($filter['replacement'], ENT_QUOTES)?></td>
                    <td><a href="comment_filter.php?id=<?=$filter['id']?>" class="link1">Edit</a> <a href="comment_filters.php?delete=<?=$filter['id']?>" class="link1" onclick="return confirm('Are you sure you want to delete this filter?')">Delete</a></td>
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
    <span>Page <?=$pagination_page?> of <?=ceil($filters_total / $results_per_page) == 0 ? 1 : ceil($filters_total / $results_per_page)?></span>
    <?php if ($pagination_page * $results_per_page < $filters_total): ?>
    <a href="<?=$url?>&pagination_page=<?=$pagination_page+1?>&order=<?=$order?>&order_by=<?=$order_by?>">Next</a>
    <?php endif; ?>
</div>

<?=template_admin_footer()?>