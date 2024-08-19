import { JiraExtention } from './JiraExtention.js'; 
import { awaitTimer } from '../modules/awaitTimer.js'; 

export class JiraExtentionOIPPMF extends JiraExtention {
    constructor() {
        super({
            linkToComment: '.comment-created-date-link',
        });
    }

    getEditorElements() {
        this.editorContent = this.addCommentBlock.querySelector('.mod-content');
        this.editorForm = this.editorContent ? this.editorContent.children[0] : null;
    }

    openEditor() { 
        if (!this.editorContent.children.length) {
            this.editorContent.append(this.editorForm);
        }

        this.addCommentBlock.classList.add('active');
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