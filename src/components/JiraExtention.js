import { awaitTimer } from '../modules/awaitTimer.js'; 
import { messages } from '../data.js'; 

export class JiraExtention {
    constructor(selectors) {
        this.addCommentBlock = document.querySelector('#addcomment');
        this.selectors = selectors;

        this.editorMode = null; // wysiwyg - html || source - текст 
        this.editorContent = null
        this.editorForm = null;
        this.commentBlocks = null;

        this.init();
    }

    openEditor() {}
    setComment() {}
    getEditorElements() {}

    init() {
        if (!this.addCommentBlock || !this.selectors) {
            return false;
        }

        this.initEdiorOpenObserver();
        this.getEditorElements();
        this.citationInit();
        this.addCommentsTools();
        this.addLoadMoreEvent();
    }

    addCommentsTools() {
        this.commentBlocks = document.querySelectorAll('.activity-comment');

        this.addCopyLinkButtons();
        this.addAnswerButtons();
        this.addCommentEditEvent();
    }

    addCommentEditEvent() {
        const self = this;

        this.commentBlocks.forEach(comment => {
            if (comment.classList.contains('edit-button-event-added')) {
                return false;
            }

            const button = comment.querySelector('.edit-comment');

            button?.addEventListener('click', () => {
                const observerEvent = (mutationsList, observer) => {
                    for (let mutation of mutationsList) {
                        if (
                            mutation.addedNodes[0] && 
                            (
                                mutation.addedNodes[0].id === 'edit-comment' || 
                                mutation.addedNodes[0].classList.contains('js-cannedresponses-context')
                            )
                        ) {
                            const observerComments = new MutationObserver((_, observer) => {
                                observer.disconnect();
                                self.addCommentsTools();
                            });
                
                            const firstCommentReaction = document.querySelector('jira-comment-reactions');
                            observerComments.observe(firstCommentReaction, { childList: true });

                            observer.disconnect();
                            break;
                        }
                    }
                };
    
                const observer = new MutationObserver(observerEvent);
                observer.observe(document.body, { childList: true });
            });

            comment.classList.add('edit-button-event-added');
        })
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

    initCommentContainerObserver() {
        const target = document.querySelector('#issue_actions_container');

        if (!target) {
            return false
        }

        const self = this;
        
        const observerEvent = (_, observer) => {
            observer.disconnect();
            self.addCommentsTools();
        };
        
        const observer = new MutationObserver(observerEvent);
        observer.observe(target, { childList: true });

        return observer;
    }

    initEdiorOpenObserver() {
        const self = this;
        let commentContainerObserver = null;

        const observerEvent = mutationsList => {
            for (let mutation of mutationsList) {
                if (mutation.target.classList.contains('active')) {
                    commentContainerObserver = self.initCommentContainerObserver();
                } else {
                    if (commentContainerObserver) {
                        commentContainerObserver.disconnect();
                    }
                }
            }
        };
        
        const observer = new MutationObserver(observerEvent);
        observer.observe(this.addCommentBlock, { attributeFilter: ['class'] });
    }

    addCopyLinkButtons() {
        this.commentBlocks.forEach(comment => {
            if (comment.classList.contains('copy-button-added')) {
                return false;
            }

            const actionBlock = comment.querySelector('.action-links');
            const link = comment.querySelector(this.selectors.linkToComment);

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

            comment.classList.add('copy-button-added');
        });
    }

    addLoadMoreEvent() {
        document.addEventListener('click', e => {
            if (e.target.closest('.show-more-comment-tabpanel')) {
                this.initCommentContainerObserver();
            }
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

            this.addCommentButton(actionBlock, messages.toAnswer, () => {
                if (authorName && authorHref && authorRel) {
                    this.setComment({
                        html: `${this.createAutohorLinkHtml(authorHref, authorRel, authorName)}`,
                        text: `[~${authorRel}]`
                    });
                }
            });

            comment.classList.add('answer-button-added');
        });
    }

    createAutohorLinkHtml(href, rel, name) {
        return `<span><a class="user-hover" title="${messages.goToUrl}" contenteditable="false" href="${href}" rel="${rel}" data-mce-href="${href}" data-mce-tabindex="-1" tabindex="-1" data-mce-selected="inline-boundary">${name}</a>&nbsp;</span>`;
    }

    citationInit() {
        const pageContent = document.querySelector('.issue-view');
        
        if (!pageContent) {
            return false;
        }
        
        let selectionText = null;
        let currentQuote = null;

        const createButton = (x, y) => {
            const main = document.querySelector('#main');
            const div = document.createElement('div');
            div.className = 'jira-extention__quote';
            div.innerHTML = '&#8221;'
    
            div.style.top = `${y + pageContent.scrollTop - (document.body.clientHeight - main.clientHeight) }px`;
            div.style.left = `${x + pageContent.scrollLeft - (document.body.clientWidth - main.clientWidth) + 20}px`;
            
            div.addEventListener('click', () => {
                div.remove();
                this.setComment(selectionText);
            });
    
            currentQuote = div;
            pageContent.append(div);
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
        const link = block.querySelector(this.selectors.linkToComment);

        return {
            html: `<span>${name.textContent}, <a href="${link.href}">${messages.wrotes}</a>:</span><br>`,
            text: `${name.textContent} [${messages.wrotes}|${link.href}]: \n`
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

    removeLoader() {
        const loader = this.addCommentBlock.querySelector('.richeditor-loading');

        if (loader) {
            loader.remove();
        }
    }
}