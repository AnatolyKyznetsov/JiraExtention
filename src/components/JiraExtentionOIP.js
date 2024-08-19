import { JiraExtention } from './JiraExtention.js'; 

export class JiraExtentionOIP extends JiraExtention {
    constructor() {
        super({
            linkToComment: '.sd-comment-permalink',
        });

        this.commentFormSubmited = false;
    }

    initAddCommentObserver() {
        const self = this;
        
        const observerEvent = (mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (
                    !self.commentFormSubmited &&
                    mutation.target.localName === 'button' &&
                    mutation.target.classList.contains('aui-button') &&
                    mutation.target.classList.contains('sd-internal-submit')
                ) {
                    self.commentFormSubmited = true;
                }

                if (mutation.target.classList.contains('activity-comment')) {
                    self.commentFormSubmited = false;
                    self.addCommentsTools();
                    observer.disconnect();
                    break;
                }
            }
        };
        
        const observer = new MutationObserver(observerEvent);
        observer.observe(document.body, { childList: true, subtree: true });

        return observer;
    }

    initEdiorOpenObserver() {
        const self = this;
        let commentContainerObserver = null;

        const observerEvent = mutationsList => {
            for (let mutation of mutationsList) {
                if (mutation.target.classList.contains('active')) {
                    commentContainerObserver = self.initAddCommentObserver();
                } else {
                    if (commentContainerObserver && !self.commentFormSubmited) {
                        commentContainerObserver.disconnect();
                    }
                }
            }
        };
        
        const observer = new MutationObserver(observerEvent);
        observer.observe(this.addCommentBlock, { attributeFilter: ['class'] });
    }

    openEditor() {
        const initialTextarea = this.addCommentBlock.querySelector('#sd-comment-collapsed-textarea')

        if (!initialTextarea) {
            return false;
        }
        
        initialTextarea.dispatchEvent(new Event('focus'));
    }

    setComment(content) {
        if (!this.addCommentBlock.classList.contains('active')) {
            this.openEditor();
        }
        
        this.getEdiorMode(() => {
            if (this.editorMode === 'wysiwyg') {
                const iframe = this.addCommentBlock.querySelector('iframe');
        
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