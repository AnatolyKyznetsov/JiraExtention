import { awaitTimer } from '../modules/awaitTimer.js'; 
import { messages } from '../data.js'; 

export class JiraExtention {
    constructor() {
        this.addCommentBlock = document.querySelector('#addcomment');

        this.editorContent = null
        this.editorForm = null;
        this.editorMode = null; // wysiwyg - html || source - текст 
        
        this.commentBlocks = document.querySelectorAll('.activity-comment');  
        this.loadMoreButton = document.querySelector('.show-more-comment-tabpanel');

        this.init();
    }

    init() {
        if (!this.addCommentBlock) {
            return false;
        }

        this.getEditorElements();
        this.citationInit();
        this.addCopyLinkButtons();
        this.addAnswerButtons();
        this.addLoadMoreEvent();
    }

    getEditorElements() {
        this.editorContent = this.addCommentBlock.querySelector('.mod-content');
        this.editorForm = this.editorContent ? this.editorContent.children[0] : null;
    }

    getEdiorMode(callback) {
        awaitTimer(
            () => {
                return this.addCommentBlock.querySelectorAll('.aui-nav li').length;
            },
            () => {
                const modeButtons = this.addCommentBlock.querySelectorAll('.aui-nav li');
                modeButtons.forEach(item => {
                    const button = item.children[0];

                    if (item.classList.contains('aui-nav-selected')) {
                        this.editorMode = item.dataset.mode;
                        callback()
                    }

                    if (!button || button.classList.contains('custom-event-added')) {
                        return false;
                    }

                    button.addEventListener('click', () => {
                        this.editorMode = item.dataset.mode;
                    });

                    button.classList.add('custom-event-added');
                });
            }
        );
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

            this.addCommentButton(actionBlock, messages.copyLink, button => {
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

            this.addCommentButton(actionBlock, messages.toAnswer, () => {
                if (authorName && authorHref && authorRel) {
                    this.setComment({
                        html: `${this.createAutohorLinkHtml(authorHref, authorRel, authorName)}`,
                        text: `[~${authorRel}]`
                    });
                }
            });

            comment.classList.add('comment-button-added');
        });
    }

    createAutohorLinkHtml(href, rel, name) {
        return `<span><a class="user-hover" title="${messages.goToUrl}" contenteditable="false" href="${href}" rel="${rel}" data-mce-href="${href}" data-mce-tabindex="-1" tabindex="-1" data-mce-selected="inline-boundary">${name}</a>&nbsp;</span>`;
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
                selectionText = {
                    html: `<blockquote><p>${details.html}${selectionString}</p></blockquote>`,
                    text: `{quote}${details.text}${selectionString}{quote}`
                };
            }
        });
    }

    createCitationHeadHtml(block) {
        const name = block.querySelector('.user-avatar');
        const date = block.querySelector('.comment-created-date-link');

        return {
            html: `<span>${name.textContent}, <a href="${date.href}">${messages.wrotes}</a>:</span><br>`,
            text: `${name.textContent} [${messages.wrotes}|${date.href}]: \n`
        }
    }

    commentDetails(element) {
        const commentBlock = element.closest('.activity-comment');

        if (commentBlock) {
            return this.createCitationHeadHtml(commentBlock);
        }

        return {
            text: `*${messages.taskDescription}* \n`,
            html: `<b>${messages.taskDescription}</b> <br>`,
        }
    }

    openEditor() {  
        if (!this.editorContent.children.length) {
            this.editorContent.append(this.editorForm);
        }

        this.addCommentBlock.classList.add('active');
    }

    removeLoader() {
        const loader = this.addCommentBlock.querySelector('.richeditor-loading');

        if (loader) {
            loader.remove();
        }
    }

    setComment(content) {
        if (!this.addCommentBlock.classList.contains('active')) {
            this.openEditor();
        }
        
        const editorCuttentForm = this.editorContent.children[0];

        const innerCommentFrame = iframe => {
            const iframeDoc = iframe.contentDocument;
            const iframeBody = iframeDoc.body;

            if (iframeBody.innerHTML === '<p><br data-mce-bogus="1"></p>') {
                iframeBody.innerHTML = '';
            }

            iframeBody.innerHTML += content.html;
            const range = iframeDoc.createRange();
            const sel = iframeDoc.getSelection();
            range.selectNodeContents(iframeBody);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            this.removeLoader();
        }

        this.getEdiorMode(() => {
            if (this.editorMode === 'wysiwyg') {
                const iframe = editorCuttentForm.querySelector('iframe');
        
                if (iframe) {
                    innerCommentFrame(iframe);
                } else {
                    awaitTimer(
                        () => {
                            return editorCuttentForm.querySelector('iframe');
                        }, 
                        () => {
                            innerCommentFrame(editorCuttentForm.querySelector('iframe'));
                        }
                    );
                }
            } else if (this.editorMode === 'source') {
                const textarea = this.addCommentBlock.querySelector('textarea#comment');
                textarea.value += content.text;
                textarea.focus();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                this.removeLoader();
            }
        });
    }
}