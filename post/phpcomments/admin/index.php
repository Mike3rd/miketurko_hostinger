<?php
include 'main.php';
$stmt = $pdo->prepare('SELECT c.*, a.email, p.url FROM comments c LEFT JOIN accounts a ON a.id = c.acc_id LEFT JOIN comment_page_details p ON p.page_id = c.page_id WHERE cast(c.submit_date as DATE) = ? ORDER BY c.submit_date DESC');
$stmt->execute([ date('Y-m-d') ]);
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
// Get the total number of comments
$stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM comments WHERE approved = 0');
$stmt->execute();
$awaiting_approval = $stmt->fetchColumn();
// Get the total number of comments
$stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM comments');
$stmt->execute();
$comments_total = $stmt->fetchColumn();
// Get the total number of comments
$stmt = $pdo->prepare('SELECT COUNT(page_id) AS total FROM comments GROUP BY page_id');
$stmt->execute();
$comments_page_total = $stmt->fetchAll(PDO::FETCH_ASSOC);
$comments_page_total = count($comments_page_total);
// Get the comments awaiting approval
$stmt = $pdo->prepare('SELECT c.*, a.email, p.url FROM comments c LEFT JOIN accounts a ON a.id = c.acc_id LEFT JOIN comment_page_details p ON p.page_id = c.page_id WHERE c.approved = 0 ORDER BY c.submit_date DESC');
$stmt->execute();
$comments_awaiting_approval = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<?=template_admin_header('Dashboard', 'dashboard')?>

<div class="content-title">
    <div class="title">
        <i class="fa-solid fa-gauge-high"></i>
        <div class="txt">
            <h2>Dashboard</h2>
            <p>View statistics, new comments, and more.</p>
        </div>
    </div>
</div>

<div class="dashboard">
    <div class="content-block stat">
        <div class="data">
            <h3>New Comments</h3>
            <p><?=number_format(count($comments))?></p>
        </div>
        <i class="fas fa-comments"></i>
        <div class="footer">
            <i class="fa-solid fa-rotate fa-xs"></i>Total comments for today
        </div>
    </div>

    <div class="content-block stat">
        <div class="data">
            <h3>Awaiting Approval</h3>
            <p><?=number_format($awaiting_approval)?></p>
        </div>
        <i class="fas fa-clock"></i>
        <div class="footer">
            <i class="fa-solid fa-rotate fa-xs"></i>Comments awaiting approval
        </div>
    </div>

    <div class="content-block stat">
        <div class="data">
            <h3>Total Comments</h3>
            <p><?=number_format($comments_total)?></p>
        </div>
        <i class="fas fa-comments"></i>
        <div class="footer">
            <i class="fa-solid fa-rotate fa-xs"></i>Total comments
        </div>
    </div>

    <div class="content-block stat">
        <div class="data">
            <h3>Total Pages</h3>
            <p><?=number_format($comments_page_total)?></p>
        </div>
        <i class="fas fa-file-alt"></i>
        <div class="footer">
            <i class="fa-solid fa-rotate fa-xs"></i>Total pages
        </div>
    </div>
</div>

<div class="content-title">
    <div class="title">
        <i class="fa-solid fa-comment-dots alt"></i>
        <div class="txt">
            <h2>New Comments</h2>
            <p>Comments submitted in the last &lt;1 day.</p>
        </div>
    </div>
</div>

<div class="content-block">
    <div class="table">
        <table>
            <thead>
                <tr>
                    <td colspan="2">Name</td>
                    <td class="responsive-hidden">Content</td>
                    <td class="responsive-hidden">Votes</td>
                    <td class="responsive-hidden">Page ID</td>
                    <td>Approved</td>
                    <td class="responsive-hidden">Date</td>
                    <td>Actions</td>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($comments)): ?>
                <tr>
                    <td colspan="10" class="no-results">There are no recent comments.</td>
                </tr>
                <?php else: ?>
                <?php foreach ($comments as $comment): ?>
                <tr>
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
                    <td class="responsive-hidden"><?=number_format($comment['votes'])?></td>
                    <td class="responsive-hidden"><?=$comment['url'] ? '<a href="' . htmlspecialchars($comment['url'], ENT_QUOTES) . '" target="_blank" class="link1">' . $comment['page_id'] . '</a>' : $comment['page_id']?></td>
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

<div class="content-title" style="margin-top:40px">
    <div class="title">
        <i class="fa-solid fa-comment-dots alt"></i>
        <div class="txt">
            <h2>Awaiting Approval</h2>
            <p>All comments awaiting approval.</p>
        </div>
    </div>
</div>

<div class="content-block">
    <div class="table">
        <table>
            <thead>
                <tr>
                    <td colspan="2">Name</td>
                    <td class="responsive-hidden">Content</td>
                    <td class="responsive-hidden">Votes</td>
                    <td class="responsive-hidden">Page ID</td>
                    <td>Approved</td>
                    <td class="responsive-hidden">Date</td>
                    <td>Actions</td>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($comments_awaiting_approval)): ?>
                <tr>
                    <td colspan="10" class="no-results">There are no comments awaiting approval.</td>
                </tr>
                <?php else: ?>
                <?php foreach ($comments_awaiting_approval as $comment): ?>
                <tr>
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
                    <td class="responsive-hidden"><?=number_format($comment['votes'])?></td>
                    <td class="responsive-hidden"><?=$comment['url'] ? '<a href="' . htmlspecialchars($comment['url'], ENT_QUOTES) . '" target="_blank" class="link1">' . $comment['page_id'] . '</a>' : $comment['page_id']?></td>
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

<?=template_admin_footer()?>