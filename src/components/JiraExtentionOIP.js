import { JiraExtention } from './JiraExtention.js'; 

export class JiraExtentionOIP extends JiraExtention {
    constructor() {
        super('.sd-comment-permalink');
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