import { awaitTimer } from '../modules/awaitTimer.js'; 

export class JiraExtention {
    constructor() {
        this.addCommentBlock = document.querySelector('#addcomment');
        this.addCommenteditorContent = document.querySelector('#addcomment .mod-content');
        this.addCommenteditorForm = this.addCommenteditorContent ? this.addCommenteditorContent.children[0] : null;
        
        this.commentBlocks = document.querySelectorAll('.activity-comment');  
        this.loadMoreButton = document.querySelector('.show-more-comment-tabpanel');

        this.init();
    }

    init() {
        if (!this.addCommentBlock || !this.addCommenteditorContent || !this.addCommenteditorForm) {
            return false;
        }

        this.citationInit();
        this.addCopyLinkButtons();
        this.addAnswerButtons();
        this.addLoadMoreEvent();
    }

    addCopyLinkButtons() {
        this.commentBlocks.forEach(comment => {
            if (comment.classList.contains('comment-buttons-added')) {
                return false;
            }

            const actionBlock = comment.querySelector('.action-links');
            const link = comment.querySelector('.comment-created-date-link');

            if (!actionBlock) {
                return false
            }

            this.addCommentButton(actionBlock, 'Cкопировать ссылку', button => {
                navigator.clipboard.writeText(link.href)
                .then(() => {
                    button.style.setProperty('color', 'green', 'important');

                    setTimeout(() => {
                        button.style.color = '';
                    }, 600);
                });
            });

            comment.classList.add('comment-button-added');
        });
    }

    addLoadMoreEvent() {
        if (!this.loadMoreButton) {
            return false;
        }

        this.loadMoreButton.addEventListener('click', () => {
            awaitTimer(
                () => {
                    return document.querySelectorAll('.activity-comment').length !== this.commentBlocks.length;
                },
                () => {
                    this.commentBlocks = document.querySelectorAll('.activity-comment');
                    this.addCopyLinkButtons();
                    this.addAnswerButtons();
                }
            );
        });
    }

    addCommentButton(block, name, callback) {
        const divider = document.createElement('span');
        divider.className = 'action-links__divider';
        
        const button = document.createElement('a');
        button.href = 'javascript:void(0)';
        button.textContent = name;

        button.addEventListener('click', () => {
            callback(button);
        });

        block.prepend(divider);
        block.prepend(button);
    }

    addAnswerButtons() {
        this.commentBlocks.forEach(comment => {
            if (comment.classList.contains('comment-buttons-added')) {
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

            this.addCommentButton(actionBlock, 'Ответить', () => {
                if (authorName && authorHref && authorRel) {
                    const content = `${this.createAutohorLink(authorHref, authorRel, authorName)}`;
                    this.setComment(content);
                }
            });

            comment.classList.add('comment-button-added');
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