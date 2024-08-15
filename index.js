const awaitTimer = (condition, callback, iterator) => {
    let i = iterator || 0;

    if (condition()) {
        callback();
    } else if (i < 10) {
        i++;

        setTimeout(() => {
            awaitTimer(condition, callback, i);
        }, 1000);
    }
}

class JiraExtention {
    constructor() {
        this.addCommentBlock = document.querySelector('#addcomment');
        this.addCommenteditorContent = document.querySelector('#addcomment .mod-content');
        this.addCommenteditorForm = this.addCommenteditorContent.children[0];
        this.commentBlocks = document.querySelectorAll('.activity-comment');  
        
        this.loadMoreButton = document.querySelector('.show-more-comment-tabpanel');

        this.init();
    }

    init() {
        if (!this.addCommentBlock || !this.addCommenteditorContent || !this.addCommenteditorForm) {
            return false;
        }

        this.addStyles();
        this.citationInit();
        this.addAnswerButtons();
        this.addLoadMoreEvent();
    }

    addStyles() {
        const style = document.createElement('style');

        style.innerHTML = `
            .jira-extention__quote {
                display: flex;
                justify-content: center;
                width: 20px;
                height: 20px;
                background: #b6b6d5;
                color: #fff;
                font-size: 30px;
                line-height: 1;
                border-radius: 2px;
                cursor: pointer;
                position: absolute;
                z-index: 9999;
            }

            .activity-comment .image-wrap img {
                max-width: 100%;
                height: auto;
            }
        `;

        document.head.append(style);
    }

    addLoadMoreEvent() {
        if (!this.loadMoreButton) {
            return false;
        }

        this.loadMoreButton.addEventListener('click', () => {
            let i = 0;
            awaitTimer(
                () => {
                    return document.querySelectorAll('.activity-comment').length !== this.commentBlocks.length;
                },
                () => {
                    this.commentBlocks = document.querySelectorAll('.activity-comment');
                    this.addAnswerButtons();
                }
            );
        });
    }

    addAnswerButtons() {
        this.commentBlocks.forEach(comment => {
            if (comment.classList.contains('answer-button-added')) {
                return false;
            }

            const actionBlock = comment.querySelector('.action-links');
            const authorBlock = comment.querySelector('.user-avatar');
            const authorName = authorBlock ? authorBlock.textContent.trim() : '';
            const authorRel = authorBlock ? authorBlock.getAttribute('rel') : '';
            const authorHref = authorBlock ? authorBlock.getAttribute('href') : '';

            if (!actionBlock) {
                return false;
            }

            const divider = document.createElement('span');
            divider.className = 'action-links__divider';
            
            const button = document.createElement('a');
            button.href = 'javascript:void(0)';
            button.textContent = 'Ответить';

            button.addEventListener('click', () => {
                if (authorName && authorHref && authorRel) {
                    const content = `${this.createAutohorLink(authorHref, authorRel, authorName)}`;
                    this.setComment(content);
                }
            });

            actionBlock.prepend(divider);
            actionBlock.prepend(button);

            comment.classList.add('answer-button-added');
        });
    }

    createAutohorLink(href, rel, name) {
        return `<span><a class="user-hover" title="Перейти по ссылке" contenteditable="false" href="${href}" rel="${rel}" data-mce-href="${href}" data-mce-tabindex="-1" tabindex="-1" data-mce-selected="inline-boundary">${name}</a>&nbsp;</span>`;
    }

    citationInit() {
        let selectionText = null;
        let currentQuote = null;
    
        const createButton = (x, y) => {
            const div = document.createElement('div');
            div.className = 'jira-extention__quote';
            div.innerHTML = '&#8221;'
    
            div.style.top = `${y}px`;
            div.style.left = `${x + 20}px`;
            
            div.addEventListener('click', () => {
                div.remove();
                this.setComment(selectionText);
            });
    
            currentQuote = div;
            document.body.append(div);
            document.removeEventListener('mouseup', getMouseCords);
        }
    
        const getMouseCords = e => {
            createButton(e.clientX, e.clientY);
            document.addEventListener('mousedown', removeQuote);
        }
    
        const removeQuote = e => {
            document.removeEventListener('mousedown', removeQuote);
    
            if (!e.target.classList.contains('jira-extention__quote') && currentQuote) {
                currentQuote.remove();
            }
        }
    
        document.addEventListener('selectionchange', () => {
            const selection = document.getSelection();
            const selectionParent = selection.focusNode ? selection.focusNode.parentElement : null;
            const selectionString = selection.toString();
            const details = selectionParent ? this.commentDetails(selectionParent) : null;
            
            if (
                selectionString && 
                selectionParent && 
                (
                    selectionParent.closest('.activity-comment') || 
                    selectionParent.closest('#description-val')
                )
            ) {
                document.addEventListener('mouseup', getMouseCords);
                selectionText = `<blockquote><p>${details}${selectionString}</p></blockquote>`;
            }
        });
    }

    createCitationHead(block) {
        const name = block.querySelector('.user-avatar');
        const date = block.querySelector('.comment-created-date-link');

        return `<span>${name.textContent}, <a href="${date.href}">написал(a)</a>:</span>`
    }

    commentDetails(element) {
        const commentBlock = element.closest('.activity-comment');

        if (commentBlock) {
            return `${this.createCitationHead(commentBlock)} <br>`;
        } 

        return '<b>Описание задачи:</b> <br>';
    }

    openEditor() {  
        if (!this.addCommenteditorContent.children.length) {
            this.addCommenteditorContent.append(this.addCommenteditorForm);
        }
    
        this.addCommentBlock.classList.add('active');
    }

    setComment(content) {
        let i = 0;
        
        if (!this.addCommentBlock.classList.contains('active')) {
            this.openEditor();
        }
        
        const addCommenteditorCuttentForm = this.addCommenteditorContent.children[0];

        const innerComment = iframe => {
            const iframeDoc = iframe.contentDocument;
            const iframeBody = iframeDoc.body;

            if (iframeBody.innerHTML === '<p><br data-mce-bogus="1"></p>') {
                iframeBody.innerHTML = '';
            }

            iframeBody.innerHTML += content;

            const range = iframeDoc.createRange();
            const sel = iframeDoc.getSelection();
            range.selectNodeContents(iframeBody);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        
        const iframe = addCommenteditorCuttentForm.querySelector('iframe');
        
        if (iframe) {
            innerComment(iframe);
        } else {
            awaitTimer(
                () => {
                    return addCommenteditorCuttentForm.querySelector('iframe');
                }, 
                () => {
                    innerComment(addCommenteditorCuttentForm.querySelector('iframe'));
                }
            );
        }
    }
}

awaitTimer(
    () => {
        return document.readyState === 'complete';
    }, 
    () => {
        new JiraExtention();
    }
);
