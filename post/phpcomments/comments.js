class Comments {

    constructor(options) {
        let defaults = {
            page_id: 1,
            container: document.querySelector('.comments'),
            php_file_url: 'https://easyhrcomms.com/post/phpcomments/comments.php'
        };
        this.options = Object.assign(defaults, options);
        this.fetchComments();
    }

    fetchComments() {
        let url = `${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}`;
        url += 'comments_to_show' in this.options ? `&comments_to_show=${this.commentsToShow}` : '';
        url += 'sort_by' in this.options ? `&sort_by=${this.sortBy}` : '';
        url += location.hash && location.hash.includes('comment') ? `&highlight_comment=${location.hash.replace('#','').replace('comment-','')}` : '';
        fetch(url, { cache: 'no-store' }).then(response => response.text()).then(data => {
            this.container.innerHTML = data;
            this._eventHandlers();
            if (location.hash && this.container.querySelector(location.hash)) {
                location.href = location.hash;
            }
        });
    }

    _toggleWriteCommentForm(commentId, closeCallback) {
        if (localStorage.getItem('name')) {
            if (this.container.querySelector('div[data-comment-id="' + commentId + '"] input[name="name"]')) {
                this.container.querySelector('div[data-comment-id="' + commentId + '"] input[name="name"]').value = localStorage.getItem('name');
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
            let pos = 9;
            [text, pos] = element.classList.contains('fa-italic') ? ['<i></i>', 4] : [text, pos];
            [text, pos] = element.classList.contains('fa-underline') ? ['<u></u>', 4] : [text, pos];
            [text, pos] = element.classList.contains('fa-heading') ? ['<h6></h6>', 5] : [text, pos];
            [text, pos] = element.classList.contains('fa-quote-left') ? ['<blockquote></blockquote>', 13] : [text, pos];
            [text, pos] = element.classList.contains('fa-code') ? ['<pre><code></code></pre>', 13] : [text, pos];
            textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
            textarea.focus();
            textarea.setSelectionRange(textarea.selectionStart-pos, textarea.selectionStart-pos);
        });
        this.container.querySelector('div[data-comment-id="' + commentId + '"] .cancel-button').onclick = event => {
            event.preventDefault();
            this.container.querySelector('div[data-comment-id="' + commentId + '"]').classList.toggle('hidden');
            closeCallback();
        };       
    }

    _writeCommentFormEventHandler() {
        this.container.querySelectorAll('.comments .write-comment form').forEach(element => {
            element.onsubmit = event => {
                event.preventDefault();
                element.querySelector('.post-button').disabled = true;
                element.querySelector('.loader').classList.remove('hidden');
                fetch(`${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}`, {
                    method: 'POST',
                    body: new FormData(element),
                    cache: 'no-store'
                }).then(response => response.text()).then(data => {
                    if (data.includes('Error')) {
                        element.querySelector('.msg').innerHTML = `<span class="error">* ${data.replace('Error: ', '')}</span>`;
                    } else {
                        if (element.querySelector('input[name="name"]')) {
                            localStorage.setItem('name', element.querySelector('input[name="name"]').value);
                        }
                        element.querySelector('.msg').innerHTML = '';
                        element.querySelector('textarea').value = '';
                        if (element.querySelector('input[name="comment_id"]').value != -1) {
                            let doc = (new DOMParser()).parseFromString(data, 'text/html');
                            element.parentElement.parentElement.querySelector('.comment-content').innerHTML = doc.querySelector('.comment-content').innerHTML;
                        } else {
                            if (element.parentElement.parentElement.className.includes('con')) {
                                element.parentElement.parentElement.querySelector('.replies').innerHTML = data + element.parentElement.parentElement.querySelector('.replies').innerHTML;
                            } else {
                                element.parentElement.parentElement.querySelector('.comments-wrapper').innerHTML = data + element.parentElement.parentElement.querySelector('.comments-wrapper').innerHTML;
                            }
                        }
                        element.parentElement.classList.toggle('hidden');
                        if (this.container.querySelector('.reply-comment-btn[data-comment-id="' + element.parentElement.getAttribute('data-comment-id') + '"]')) {
                            this.container.querySelector('.reply-comment-btn[data-comment-id="' + element.parentElement.getAttribute('data-comment-id') + '"]').classList.remove('selected');
                        }
                        if (this.container.querySelector('.edit-comment-btn[data-comment-id="' + element.parentElement.getAttribute('data-comment-id') + '"]')) {
                            this.container.querySelector('.edit-comment-btn[data-comment-id="' + element.parentElement.getAttribute('data-comment-id') + '"]').classList.remove('selected');
                        }
                        if (this.container.querySelector('.no-comments')) {
                            this.container.querySelector('.no-comments').remove();
                        }
                    }
                    element.querySelector('.post-button').disabled = false;
                    element.querySelector('.loader').classList.add('hidden');
                    this._eventHandlers();
                });
            };
        });
    }

    _eventHandlers() {
        this._writeCommentFormEventHandler();
        this.container.querySelectorAll('.share-comment-btn').forEach(element => element.onclick = event => {
            event.preventDefault();
            navigator.clipboard.writeText(location.href.split('#')[0] + '#comment-' + element.getAttribute('data-comment-id'));
            element.innerHTML = '<i class="fa-solid fa-link fa-sm"></i> Copied!';
        });
        this.container.querySelectorAll('.comments .reply-comment-btn').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                if (element.parentElement.querySelector('.edit-comment-btn.selected')) {
                    element.parentElement.querySelector('.edit-comment-btn').click();
                }
                element.classList.toggle('selected');
                let writeForm;
                if (this.container.querySelector('.write-comment[data-comment-id="' + element.getAttribute('data-comment-id') + '"]')) {
                    writeForm = this.container.querySelector('.write-comment[data-comment-id="' + element.getAttribute('data-comment-id') + '"]');
                } else {
                    writeForm = this.container.querySelector('.write-comment').cloneNode(true);
                    writeForm.classList.add('hidden');
                    this.container.querySelector('.comment[data-id="' + element.getAttribute('data-comment-id') + '"] .replies').insertAdjacentElement('beforebegin', writeForm);
                }
                writeForm.dataset.commentId = element.getAttribute('data-comment-id');
                writeForm.querySelector('input[name="parent_id"]').value = element.getAttribute('data-comment-id');
                writeForm.querySelector('input[name="comment_id"]').value = '-1';
                writeForm.querySelector('textarea').value = '';
                this._writeCommentFormEventHandler();
                this._toggleWriteCommentForm(element.getAttribute('data-comment-id'), () => {
                    element.classList.toggle('selected');
                });
            };
        });
        this.container.querySelectorAll('.comments .edit-comment-btn').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                if (element.parentElement.querySelector('.reply-comment-btn.selected')) {
                    element.parentElement.querySelector('.reply-comment-btn').click();
                }
                element.classList.toggle('selected');
                let writeForm;
                if (this.container.querySelector('.write-comment[data-comment-id="' + element.getAttribute('data-comment-id') + '"]')) {
                    writeForm = this.container.querySelector('.write-comment[data-comment-id="' + element.getAttribute('data-comment-id') + '"]');
                } else {
                    writeForm = this.container.querySelector('.write-comment').cloneNode(true);
                    writeForm.classList.add('hidden');
                    this.container.querySelector('.comment[data-id="' + element.getAttribute('data-comment-id') + '"] .replies').insertAdjacentElement('beforebegin', writeForm);
                }
                writeForm.dataset.commentId = element.getAttribute('data-comment-id');
                writeForm.querySelector('input[name="comment_id"]').value = element.getAttribute('data-comment-id');
                writeForm.querySelector('textarea').value = element.parentElement.parentElement.querySelector('.comment-content').innerHTML.replace(/<br><br>/g, '\n').replace(/<br>/g, '\n').replace(/<p>/g, '').replace(/<\/p>/g, '');
                this._writeCommentFormEventHandler();
                this._toggleWriteCommentForm(element.getAttribute('data-comment-id'), () => {
                    element.classList.toggle('selected');
                });
            };
        });
        this.container.querySelectorAll('.comments .delete-comment-btn').forEach(element => element.onclick = event => {
            event.preventDefault();
            if (confirm('Are you sure you want to delete this comment?')) {
                fetch(`${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}&delete_comment=${element.getAttribute('data-comment-id')}`, { cache: 'no-store' }).then(response => response.text()).then(data => {
                    if (data.includes('success')) {
                        element.parentElement.parentElement.parentElement.remove();
                    }
                });
            }
        });
        if (this.container.querySelector('.comment-placeholder-content')) {
            this.container.querySelector('.comment-placeholder-content').onfocus = event => {
                event.preventDefault();
                this.container.querySelector('.comment-placeholder-content').style.display = 'none';
                this._toggleWriteCommentForm(this.container.querySelector('.comment-placeholder-content').getAttribute('data-comment-id'), () => {
                    this.container.querySelector('.comment-placeholder-content').style.display = 'block';
                });
            };
        }
        this.container.querySelectorAll('.toggle-comment').forEach(element => {
            element.onclick = event => {             
                event.preventDefault();
                if (element.querySelector('i.fa-minus')) {
                    element.parentElement.parentElement.querySelector('.comment-content').style.display = 'none';
                    element.parentElement.parentElement.querySelector('.replies').style.display = 'none';
                    element.innerHTML = '<i class="fa-solid fa-plus"></i>';
                }
                else {
                    element.parentElement.parentElement.querySelector('.comment-content').style.display = null;
                    element.parentElement.parentElement.querySelector('.replies').style.display = null;
                    element.innerHTML = '<i class="fa-solid fa-minus"></i>';
                }
            }
        });
        this.container.querySelectorAll('.comments .vote').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                fetch(`${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}&vote=${element.getAttribute('data-vote')}&comment_id=${element.getAttribute('data-comment-id')}`, { cache: 'no-store' }).then(response => response.text()).then(data => {
                    element.parentElement.querySelector('.num').innerHTML = data;
                });
            };
        });
        this.container.querySelectorAll('.comments .sort-by .options a').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                this.sortBy = element.dataset.value;
                this.container.querySelector('.comments .sort-by').innerHTML = `<span class='loader'></span>`;
                this.fetchComments();
            };
        });
        this.container.querySelector('.comments .sort-by > a').onclick = event => {
            event.preventDefault();
            this.container.querySelector('.comments .options').style.display = 'flex';
        };
        if (this.container.querySelector('.comments .show-more-comments')) {
            this.container.querySelector('.comments .show-more-comments').onclick = event => {
                event.preventDefault();
                this.commentsToShow = this.commentsToShow + this.commentsToShow;
                this.fetchComments();
            };
        }
        if (this.container.querySelector('.login-btn')) {
            this.container.querySelector('.login-btn').onclick = event => {
                event.preventDefault();
                this.container.querySelector('.comment-auth-forms').classList.toggle('hidden');
                this.container.querySelector('.comment-login-form input[name="email"]').focus();
                this.container.querySelector('.comment-auth-forms').scrollIntoView({ behavior: 'smooth' });
            };
            this.container.querySelector('.comment-login-form').onsubmit = event => {
                event.preventDefault();
                let btnElement = this.container.querySelector('.comment-login-form button');
                let btnRect = this.container.querySelector('.comment-login-form button').getBoundingClientRect();
                btnElement.style.width = btnRect.width + 'px';
                btnElement.style.height = btnRect.height + 'px';
                btnElement.innerHTML = '<span class="loader"></span>';
                fetch(`${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}&method=login`, {
                    method: 'POST',
                    body: new FormData(this.container.querySelector('.comment-login-form')),
                    cache: 'no-store'
                }).then(response => response.text()).then(data => {
                    btnElement.innerHTML = 'Login';
                    if (data.includes('success')) {
                        this.fetchComments();
                    } else {
                        this.container.querySelector('.comment-login-form .msg').innerHTML = `<span class="error">* ${data}</span>`;
                    }
                });
            };
            this.container.querySelector('.comment-register-form').onsubmit = event => {
                event.preventDefault();
                let btnElement = this.container.querySelector('.comment-register-form button');
                let btnRect = this.container.querySelector('.comment-register-form button').getBoundingClientRect();
                btnElement.style.width = btnRect.width + 'px';
                btnElement.style.height = btnRect.height + 'px';
                btnElement.innerHTML = '<span class="loader"></span>';
                fetch(`${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}&method=register`, {
                    method: 'POST',
                    body: new FormData(this.container.querySelector('.comment-register-form')),
                    cache: 'no-store'
                }).then(response => response.text()).then(data => {
                    btnElement.innerHTML = 'Register';
                    if (data.includes('success')) {
                        this.fetchComments();
                    } else {
                        this.container.querySelector('.comment-register-form .msg').innerHTML = `<span class="error">* ${data}</span>`;
                    }
                });
            };
        }
        if (this.container.querySelector('.search-btn')) {
            this.container.querySelector('.search-btn').onclick = event => {
                event.preventDefault();
                if (this.container.querySelector('.comment-placeholder-content')) {
                    this.container.querySelector('.comment-placeholder-content').style.display = 'none';
                }
                this.container.querySelector('.comment-search').style.display = 'block';
                this.container.querySelector('.comment-search input').focus();
            };
            this.container.querySelector('.comment-search input').onkeyup = event => {
                if (this.container.querySelector('.search-btn').classList.contains('search-local')) {
                    this.container.querySelectorAll('.comments-wrapper .comment').forEach(comment => {
                        comment.style.display = comment.querySelector('.comment-content').innerHTML.toLowerCase().includes(event.target.value.toLowerCase()) ? null : 'none';
                    });
                } else {
                    fetch(`${this.phpFileUrl}${this.phpFileUrl.includes('?') ? '&' : '?'}page_id=${this.pageId}&method=search&query=${encodeURIComponent(event.target.value)}`).then(response => response.text()).then(data => {
                        this.container.querySelector('.comments-wrapper').innerHTML = data;
                    });
                }
            };
        }
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

}