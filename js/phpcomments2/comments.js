class Comments {

    constructor(options) {
        let defaults = {
            page_id: 1,
            container: document.querySelector('.comments'),
            php_file_url: 'comments.php'
        };
        this.options = Object.assign(defaults, options);
        this.fetchComments();
    }

    fetchComments() {
        let url = `${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}`;
        url += 'comments_to_show' in this.options ? `&comments_to_show=${this.commentsToShow}` : '';
        url += 'sort_by' in this.options ? `&sort_by=${this.sortBy}` : '';
        fetch(url, { cache: 'no-store' }).then(response => response.text()).then(data => {
            this.container.innerHTML = data;
            this._eventHandlers();
            if (location.hash && this.container.querySelector(location.hash)) {
                location.href = location.hash;
            }
        });
    }

    get commentsToShow() {
        return this.options.comments_to_show;
    }

    set commentsToShow(value) {
        this.options.comments_to_show = value;
    }

    get pageId() {
        return this.options.page_id;
    }

    set pageId(value) {
        this.options.page_id = value;
    }

    get phpFileUrl() {
        return this.options.php_file_url;
    }

    set phpFileUrl(value) {
        this.options.php_file_url = value;
    }

    get container() {
        return this.options.container;
    }

    set container(value) {
        this.options.container = value;
    }

    get sortBy() {
        return this.options.sort_by;
    }

    set sortBy(value) {
        this.options.sort_by = value;
    }

    _toggleWriteCommentForm(commentId, closeCallback) {
        if (localStorage.getItem('name')) {
            if (this.container.querySelector('div[data-comment-id="' + commentId + '"] input[name="name"]')) {
                this.container.querySelector('div[data-comment-id="' + commentId + '"] input[name="name"]').value = localStorage.getItem('name');
            }
            if (this.container.querySelector('div[data-comment-id="' + commentId + '"] input[name="img_url"]')) {
                this.container.querySelector('div[data-comment-id="' + commentId + '"] input[name="img_url"]').value = localStorage.getItem('img_url');
            }
        }
        this.container.querySelector('div[data-comment-id="' + commentId + '"]').classList.toggle('hidden');
        if (this.container.querySelector('div[data-comment-id="' + commentId + '"] input[name="name"]')) {
            this.container.querySelector('div[data-comment-id="' + commentId + '"] input[name="name"]').focus();
        } else {
            this.container.querySelector('div[data-comment-id="' + commentId + '"] textarea').focus();
        }
        this.container.querySelectorAll('div[data-comment-id="' + commentId + '"] .format-btn').forEach(element => element.onclick = () => {
            let textarea = this.container.querySelector('div[data-comment-id="' + commentId + '"] textarea');
            let text = '<strong></strong>';
            text = element.classList.contains('fa-italic') ? '<i></i>' : text;
            text = element.classList.contains('fa-underline') ? '<u></u>' : text;
            text = element.classList.contains('fa-heading') ? '<h6></h6>' : text;
            text = element.classList.contains('fa-quote-left') ? '<blockquote></blockquote>' : text;
            text = element.classList.contains('fa-code') ? '<code></code>' : text;
            textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'select');
        });
        this.container.querySelector('div[data-comment-id="' + commentId + '"] .cancel_button').onclick = event => {
            event.preventDefault();
            this.container.querySelector('div[data-comment-id="' + commentId + '"]').classList.toggle('hidden');
            closeCallback();
        };       
    }

    _writeCommentFormEventHandler() {
        this.container.querySelectorAll('.comments .write_comment form').forEach(element => {
            element.onsubmit = event => {
                event.preventDefault();
                fetch(`${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}`, {
                    method: 'POST',
                    body: new FormData(element),
                    cache: 'no-store'
                }).then(response => response.text()).then(data => {
                    if (data.includes('Error')) {
                        element.querySelector('.msg').innerHTML = data;
                    } else {
                        if (element.querySelector('input[name="name"]')) {
                            localStorage.setItem('name', element.querySelector('input[name="name"]').value);
                        }
                        if (element.querySelector('input[name="img_url"]')) {
                            localStorage.setItem('img_url', element.querySelector('input[name="img_url"]').value);
                        }
                        if (element.parentElement.parentElement.className.includes('con')) {
                            element.parentElement.parentElement.querySelector('.replies').innerHTML = data + element.parentElement.parentElement.querySelector('.replies').innerHTML;
                            element.parentElement.style.display = 'none';
                        } else {
                            element.parentElement.parentElement.querySelector('.comments_wrapper').innerHTML = data + element.parentElement.parentElement.querySelector('.comments_wrapper').innerHTML;
                            element.parentElement.style.display = 'none';
                        }
                        if (this.container.querySelector('.no_comments')) {
                            this.container.querySelector('.no_comments').remove();
                        }
                    }
                    this._eventHandlers();
                });
            };
        });
    }

    _eventHandlers() {
        this._writeCommentFormEventHandler();
        this.container.querySelectorAll('.share_comment_btn').forEach(element => {
            let url = location.href.split('#')[0] + '#comment-' + element.getAttribute('data-comment-id');
            element.onclick = event => {
                event.preventDefault();
                navigator.clipboard.writeText(url);
                element.querySelector('span').innerHTML = 'Copied!';
            };
            element.querySelector('span').innerHTML = url;
        });
        this.container.querySelectorAll('.comments .reply_comment_btn').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                element.classList.toggle('selected');
                let writeForm = this.container.querySelector('.write_comment').cloneNode(true);
                writeForm.dataset.commentId = element.getAttribute('data-comment-id');
                writeForm.querySelector('input[name="parent_id"]').value = element.getAttribute('data-comment-id');
                this.container.querySelector('.comment[data-id="' + element.getAttribute('data-comment-id') + '"] .replies').insertAdjacentElement('beforebegin', writeForm);
                this._writeCommentFormEventHandler();
                this._toggleWriteCommentForm(element.getAttribute('data-comment-id'), () => {
                    element.classList.toggle('selected');
                });
            };
        });
        this.container.querySelector('.comment_placeholder_content').onfocus = event => {
            event.preventDefault();
            this.container.querySelector('.comment_placeholder_content').style.display = 'none';
            this._toggleWriteCommentForm(this.container.querySelector('.comment_placeholder_content').getAttribute('data-comment-id'), () => {
                this.container.querySelector('.comment_placeholder_content').style.display = 'block';
            });
        };
        
        this.container.querySelectorAll('.comments .vote').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                fetch(`${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}&vote=${element.getAttribute('data-vote')}&comment_id=${element.getAttribute('data-comment-id')}`, { cache: 'no-store' }).then(response => response.text()).then(data => {
                    element.parentElement.querySelector('.num').innerHTML = data;
                });
            };
        });
        this.container.querySelectorAll('.comments .sort_by .options a').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                this.sortBy = element.dataset.value;
                this.container.querySelector('.comments .sort_by').innerHTML = `<span class='loader'></span>`;
                this.fetchComments();
            };
        });
        this.container.querySelector('.comments .sort_by > a').onclick = event => {
            event.preventDefault();
            this.container.querySelector('.comments .options').style.display = 'flex';
        };
        if (this.container.querySelector('.comments .show_more_comments')) {
            this.container.querySelector('.comments .show_more_comments').onclick = event => {
                event.preventDefault();
                this.commentsToShow = this.commentsToShow + this.commentsToShow;
                this.fetchComments();
            };
        }
    }

}