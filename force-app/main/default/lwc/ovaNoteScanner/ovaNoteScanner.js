import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import transcribeNote from '@salesforce/apex/OVANoteScannerController.transcribeNote';
import fileAsCaseComment from '@salesforce/apex/OVANoteScannerController.fileAsCaseComment';

export default class OvaNoteScanner extends LightningElement {
    @api recordId;

    acceptedFormats = ['.jpg', '.jpeg', '.png'];

    @track uploadedFileName;
    @track contentDocumentId;
    @track transcription;
    @track isProcessing = false;
    @track statusMessage;
    @track statusVariant = 'info';

    get showUploader() {
        return !this.uploadedFileName;
    }

    get isTerminalMessage() {
        return !this.isProcessing && this.statusMessage;
    }

    get statusClass() {
        return `slds-m-top_medium slds-box slds-theme_${this.statusVariant}`;
    }

    handleUploadFinished(event) {
        const files = event.detail.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        this.uploadedFileName = file.name;
        this.contentDocumentId = file.documentId;
        this.statusMessage = null;
        this.transcription = null;
    }

    handleClear() {
        this.uploadedFileName = null;
        this.contentDocumentId = null;
        this.transcription = null;
        this.statusMessage = null;
        this.statusVariant = 'info';
    }

    handleTranscribe() {
        if (!this.contentDocumentId) return;
        this.isProcessing = true;
        this.statusVariant = 'info';
        this.statusMessage = 'Einstein is reading the image...';

        transcribeNote({ contentDocumentId: this.contentDocumentId })
            .then((text) => {
                this.transcription = text;
                this.statusVariant = 'success';
                this.statusMessage = 'Transcription ready. Review and log as In-Person Meeting below.';
            })
            .catch((error) => {
                this.statusVariant = 'error';
                this.statusMessage = this.extractError(error);
            })
            .finally(() => {
                this.isProcessing = false;
            });
    }

    handleEdit(event) {
        this.transcription = event.target.value;
    }

    handleFileComment() {
        if (!this.transcription) return;
        this.isProcessing = true;
        this.statusVariant = 'info';
        this.statusMessage = 'Logging as In-Person Meeting...';

        fileAsCaseComment({
            caseId: this.recordId,
            transcription: this.transcription
        })
            .then(() => {
                this.statusVariant = 'success';
                this.statusMessage = 'In-Person Meeting logged. Refresh the Case feed to see it.';
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Meeting logged',
                        message: 'Transcription saved as an In-Person Meeting activity.',
                        variant: 'success'
                    })
                );
                this.transcription = null;
                this.uploadedFileName = null;
                this.contentDocumentId = null;
            })
            .catch((error) => {
                this.statusVariant = 'error';
                this.statusMessage = this.extractError(error);
            })
            .finally(() => {
                this.isProcessing = false;
            });
    }

    extractError(error) {
        if (error && error.body && error.body.message) return error.body.message;
        if (error && error.message) return error.message;
        return 'Unexpected error.';
    }
}