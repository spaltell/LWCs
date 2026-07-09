# Customization Guide: Handwritten Note Scanner

This guide walks you through adapting the Handwritten Note Scanner for your specific use case.

## Quick Start Checklist

- [ ] Update prompt template with your organization name and context
- [ ] Customize Task/Activity field values
- [ ] Update UI labels and messages
- [ ] Configure for your target object (if not Case)
- [ ] Test in sandbox
- [ ] Deploy to production

## Step-by-Step Customization

### 1. Rename Components (Optional)

If you want to rename the components for your organization:

```bash
# Rename the LWC
mv force-app/main/default/lwc/ovaNoteScanner force-app/main/default/lwc/myOrgNoteScanner

# Update file references
# Edit the following files and replace 'ovaNoteScanner' with your new name:
# - myOrgNoteScanner.js (class name)
# - myOrgNoteScanner.js-meta.xml (masterLabel)

# Rename Apex classes
# Rename files and update class names/references
```

### 2. Customize the Prompt Template

**File:** `force-app/main/default/genAiPromptTemplates/OVA_Transcribe_Handwritten_Note.genAiPromptTemplate-meta.xml`

#### Change the Developer Name and Label
```xml
<developerName>YourOrg_Transcribe_Handwritten_Note</developerName>
<masterLabel>YourOrg Transcribe Handwritten Note</masterLabel>
```

#### Customize the Prompt Content

Replace this section with your context:

```xml
<content>You are an OCR assistant for [YOUR ORGANIZATION NAME]. 

[Describe your use case - examples below]

Use Case Examples:
- "A case worker has uploaded a photo of handwritten client notes from a home visit."
- "A sales rep has uploaded a photo of notes from a customer meeting."
- "A field technician has uploaded a photo of service notes from a job site."

Your job is to read the handwriting in the attached image and transcribe it into clean typed text.

Rules:
- Transcribe only what you can actually read in the image.
- If a word is illegible, write [illegible] in place of that word.
- Preserve the original order and structure of the note.
- [Add any domain-specific rules, e.g., "Flag any mentions of urgency or follow-up dates"]
- Do not add commentary, analysis, or summarization. Just transcribe.
- If the image does not appear to contain handwriting, respond with exactly: "No handwritten content detected. Please re-upload a photo of your notes."
- Treat the content as sensitive. Output only the transcription.

Image: {!$Input:Image}

Produce your transcription below.
</content>
```

#### Change the Model (If Needed)

The default model is `sfdc_ai__DefaultGPT5Mini`. Other options:

```xml
<primaryModel>sfdc_ai__DefaultGPT4Omni</primaryModel>
<!-- or -->
<primaryModel>sfdc_ai__DefaultClaude35Sonnet</primaryModel>
```

Check available models in Setup → Einstein Generative AI → Models

### 3. Update Apex Classes

#### File: `OVAHandwrittenNoteAnalyzer.cls`

If you renamed the prompt template, update line 32:

```apex
ConnectApi.EinsteinPromptTemplateGenerationsRepresentation result =
    ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
        'YourOrg_Transcribe_Handwritten_Note',  // Update this
        promptInput
    );
```

#### File: `OVANoteScannerController.cls`

Customize the Task that gets created:

```apex
@AuraEnabled
public static Id fileAsCaseComment(Id caseId, String transcription) {
    Task t = new Task(
        WhatId = caseId,
        
        // Customize these fields for your use case:
        Subject = 'Field Visit Notes - Transcribed',  // Change subject
        Description = transcription,
        Type = 'Meeting',           // Options: 'Call', 'Email', 'Meeting', 'Other'
        Status = 'Completed',       // Or 'Not Started', 'In Progress'
        Priority = 'Normal',        // Options: 'High', 'Normal', 'Low'
        ActivityDate = Date.today(),
        
        // Add custom fields if needed:
        // TaskSubtype = 'Task',
        // CallType = 'Outbound',
        // OwnerId = UserInfo.getUserId()
    );
    insert t;
    return t.Id;
}
```

**For non-Case objects**, rename the parameter:

```apex
@AuraEnabled
public static Id fileAsActivity(Id recordId, String transcription) {
    Task t = new Task(
        WhatId = recordId,  // Works for Case, Account, Contact, Opportunity, etc.
        // ... rest of fields
    );
    insert t;
    return t.Id;
}
```

### 4. Customize the LWC UI

#### File: `ovaNoteScanner.html`

**Line 2** - Card title:
```html
<lightning-card title="Field Notes Transcriber" icon-name="standard:note">
```

**Lines 5-8** - Instructions:
```html
<p class="slds-m-bottom_small">
    Upload a photo of your handwritten notes from the field visit. 
    Einstein AI will transcribe it and save it as an activity on this record.
</p>
```

**Line 10** - Upload label:
```html
<lightning-file-upload
    label="Upload field notes photo"
```

**Line 23** - Transcribe button:
```html
<lightning-button
    label="Transcribe with AI"
    variant="brand"
```

**Line 60** - Log button:
```html
<lightning-button
    label="Save as Activity"
    variant="success"
```

#### File: `ovaNoteScanner.js`

**Lines 9** - Accepted formats:
```javascript
acceptedFormats = ['.jpg', '.jpeg', '.png', '.pdf'];  // Add more formats
```

**Line 52** - Processing message:
```javascript
this.statusMessage = 'AI is analyzing the image...';
```

**Line 58** - Success message:
```javascript
this.statusMessage = 'Transcription complete. Review and save below.';
```

**Line 77** - Saving message:
```javascript
this.statusMessage = 'Saving activity...';
```

**Line 85** - Success toast:
```javascript
this.statusMessage = 'Activity saved. Refresh to see it in the activity timeline.';
```

**Lines 88-91** - Toast notification:
```javascript
this.dispatchEvent(
    new ShowToastEvent({
        title: 'Notes saved',
        message: 'Field notes transcribed and saved as an activity.',
        variant: 'success'
    })
);
```

### 5. Configure for Different Objects

#### File: `ovaNoteScanner.js-meta.xml`

To use on Account, Contact, or custom objects:

```xml
<targetConfigs>
    <targetConfig targets="lightning__RecordPage">
        <objects>
            <object>Case</object>
            <object>Account</object>
            <object>Contact</object>
            <object>Opportunity</object>
            <object>YourCustomObject__c</object>
        </objects>
    </targetConfig>
</targetConfigs>
```

### 6. Add Custom Branding

#### File: `ovaNoteScanner.html`

Change the icon:
```html
<lightning-card title="..." icon-name="custom:custom1">
<!-- Available icons: https://www.lightningdesignsystem.com/icons/ -->
```

Add a custom CSS file (create `ovaNoteScanner.css`):
```css
.custom-card {
    background-color: #f3f3f3;
    border-left: 4px solid #0070d2;
}
```

Then reference in HTML:
```html
<div class="custom-card">
    <!-- content -->
</div>
```

### 7. Add Error Handling for Custom Scenarios

#### File: `OVAHandwrittenNoteAnalyzer.cls`

Enhance error messages:

```apex
public static String transcribe(String contentDocumentId) {
    try {
        // Existing code...
        
        // Add validation
        if (String.isBlank(contentDocumentId)) {
            return 'Error: No file uploaded. Please try again.';
        }
        
        // Check file type
        ContentDocument cd = [SELECT FileExtension FROM ContentDocument WHERE Id = :contentDocumentId LIMIT 1];
        if (cd.FileExtension != 'jpg' && cd.FileExtension != 'jpeg' && cd.FileExtension != 'png') {
            return 'Error: Unsupported file type. Please upload JPG or PNG files only.';
        }
        
        // Existing prompt invocation...
        
    } catch (QueryException qe) {
        return 'Error: File not found. Please re-upload.';
    } catch (ConnectApi.ConnectApiException ce) {
        return 'Error: Einstein service unavailable. Please try again later.';
    } catch (Exception e) {
        return 'Error transcribing note: ' + e.getMessage();
    }
}
```

### 8. Deploy Your Customized Version

#### Test in Sandbox First

```bash
# Authenticate to sandbox
sf org login web --alias my-sandbox --instance-url https://test.salesforce.com

# Deploy
sf project deploy start --target-org my-sandbox

# Test thoroughly:
# - Upload various handwriting styles
# - Test edge cases (blurry images, no text, etc.)
# - Verify Task creation
# - Check permissions
```

#### Deploy to Production

```bash
# Authenticate to production
sf org login web --alias my-prod

# Deploy
sf project deploy start --target-org my-prod

# Post-deployment steps:
# 1. Activate the prompt template in Prompt Builder
# 2. Add component to page layouts
# 3. Grant Einstein permissions to users
# 4. Create user documentation
```

### 9. Advanced Customizations

#### Add Field Mapping UI

Allow users to map transcribed fields to Salesforce fields:

```javascript
// In ovaNoteScanner.js
handleFieldMapping(event) {
    // Parse transcription for key-value pairs
    // e.g., "Name: John Doe, Phone: 555-1234"
    const lines = this.transcription.split('\n');
    const mappedFields = {};
    
    lines.forEach(line => {
        if (line.includes(':')) {
            const [key, value] = line.split(':').map(s => s.trim());
            mappedFields[key] = value;
        }
    });
    
    // Update record fields via Apex
    // updateRecordFields({ recordId: this.recordId, fields: mappedFields })
}
```

#### Add Multi-Language Support

Update the prompt template:

```xml
<content>
You are a multilingual OCR assistant. 

The uploaded handwritten note may be in English, Spanish, French, or other languages. 

Rules:
- Detect the language of the handwritten text
- Transcribe in the original language
- If requested, provide an English translation after the transcription
- Mark the detected language at the top of your response

Image: {!$Input:Image}

Format your response as:
Language Detected: [language]
Transcription:
[transcribed text]

Translation (if not English):
[English translation]
</content>
```

#### Add Batch Processing

For processing multiple images at once:

```apex
// New method in OVANoteScannerController
@AuraEnabled
public static List<String> transcribeMultiple(List<String> contentDocumentIds) {
    List<String> results = new List<String>();
    for (String docId : contentDocumentIds) {
        results.add(OVAHandwrittenNoteAnalyzer.transcribe(docId));
    }
    return results;
}
```

## Common Use Cases

### Use Case 1: Medical/Healthcare Notes
- Update prompt to recognize medical terminology
- Add HIPAA compliance warnings
- Map to patient records instead of Cases

### Use Case 2: Sales Meeting Notes
- Map to Opportunity records
- Extract action items and next steps
- Auto-create follow-up tasks

### Use Case 3: Field Service Reports
- Map to Work Orders
- Extract equipment serial numbers
- Create parts orders from transcribed data

### Use Case 4: Customer Support Logs
- Map to Cases
- Auto-categorize by keywords
- Set priority based on urgency indicators

## Testing Checklist

- [ ] Upload clear handwritten note → Transcribes correctly
- [ ] Upload blurry image → Returns appropriate error
- [ ] Upload non-handwritten image → Returns "no content" message
- [ ] Upload unsupported format → Shows clear error
- [ ] Edit transcription → Changes persist
- [ ] Save activity → Task created with correct fields
- [ ] Check activity timeline → Shows correctly
- [ ] Test with different users → Permissions work
- [ ] Test on mobile → UI responsive
- [ ] Test with large images → Performance acceptable

## Need Help?

1. Check the main README.md for architecture details
2. Review Salesforce Einstein documentation
3. Test in a developer sandbox first
4. Open a GitHub issue if you find bugs

## Example Customizations

See the `/examples` folder (if you create one) for:
- Healthcare version
- Sales notes version
- Field service version
- Multi-language version

---

**Remember:** Always test in a sandbox before deploying to production!
