/**
 * LWC-facing controller for the OVA handwritten note scanner. Exposes two AuraEnabled
 * entry points: transcribe a ContentDocument via the vision-capable Flex prompt template,
 * and write the resulting text as a Case Comment on the parent Case record.
 */
public with sharing class OVANoteScannerController {

    @AuraEnabled
    public static String transcribeNote(String contentDocumentId) {
        return OVAHandwrittenNoteAnalyzer.transcribe(contentDocumentId);
    }

    @AuraEnabled
    public static Id fileAsCaseComment(Id caseId, String transcription) {
        Task t = new Task(
            WhatId = caseId,
            Subject = 'In-Person Meeting - Field Visit Notes',
            Description = transcription,
            Type = 'Meeting',
            Status = 'Completed',
            Priority = 'Normal',
            ActivityDate = Date.today()
        );
        insert t;
        return t.Id;
    }
}