/**
 * Invokes the OVA_Transcribe_Handwritten_Note Flex prompt template against an uploaded
 * ContentDocument image and returns the transcribed text. Modeled on the Salesforce
 * reference pattern from the Business Card Scanner demo
 * (salesforce-pixel/businessCardScannerAI_Demo) which proves ContentDocument + a
 * vision-capable Einstein model produces reliable OCR/handwriting transcription.
 */
public without sharing class OVAHandwrittenNoteAnalyzer {

    public static String transcribe(String contentDocumentId) {
        try {
            ConnectApi.EinsteinPromptTemplateGenerationsInput promptInput =
                new ConnectApi.EinsteinPromptTemplateGenerationsInput();
            promptInput.isPreview = false;

            Map<String, String> idMap = new Map<String, String>();
            idMap.put('id', contentDocumentId);

            ConnectApi.WrappedValue wrapped = new ConnectApi.WrappedValue();
            wrapped.value = idMap;

            Map<String, ConnectApi.WrappedValue> inputValues =
                new Map<String, ConnectApi.WrappedValue>();
            inputValues.put('Input:Image', wrapped);

            promptInput.inputParams = inputValues;

            promptInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
            promptInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation result =
                ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
                    'OVA_Transcribe_Handwritten_Note',
                    promptInput
                );

            return result.generations[0].text;
        } catch (Exception e) {
            return 'Error transcribing note: ' + e.getMessage();
        }
    }
}