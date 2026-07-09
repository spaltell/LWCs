# Handwritten Note Scanner for Salesforce

A Lightning Web Component (LWC) that uses Einstein AI to transcribe handwritten notes from photos and automatically log them as Case activities.

Originally built for the Massachusetts Office of the Veteran Advocate (OVA) to help liaisons digitize field visit notes.

## Features

- 📸 Upload photos of handwritten notes (JPG, JPEG, PNG)
- 🤖 Einstein AI transcribes handwriting using vision-capable GPT models
- ✏️ Review and edit transcription before saving
- 📝 Automatically creates a Task/Activity record on the Case
- 🎯 Works on Case record pages in Lightning Experience

## Components

### Lightning Web Component
- **ovaNoteScanner** - Main UI component for uploading and transcribing notes

### Apex Classes
- **OVANoteScannerController** - Exposes @AuraEnabled methods for LWC
- **OVAHandwrittenNoteAnalyzer** - Handles Einstein Prompt Template invocation

### Prompt Template
- **OVA_Transcribe_Handwritten_Note** - GenAI Prompt Template configured for OCR/handwriting recognition
  - Uses vision-capable model (GPT-5 Mini)
  - Accepts ContentDocument (uploaded file) as input
  - Returns clean transcribed text

## Prerequisites

1. **Salesforce Org Requirements:**
   - Einstein AI enabled
   - Prompt Builder access
   - API version 66.0 or higher

2. **Permissions Required:**
   - Create and edit GenAI Prompt Templates
   - Deploy Lightning Web Components
   - Create/edit Apex classes
   - Access to Case objects

## Installation

### Option 1: Deploy from Source

```bash
# Clone this repository
git clone https://github.com/spaltell/LWCs.git
cd LWCs

# Authenticate to your org
sf org login web --alias my-org

# Deploy all metadata
sf project deploy start --target-org my-org

# Assign permission sets if needed
# (Grant access to Einstein Prompt Templates)
```

### Option 2: Manual Metadata Deployment

1. Deploy the Apex classes:
   - `OVAHandwrittenNoteAnalyzer.cls`
   - `OVANoteScannerController.cls`

2. Deploy the GenAI Prompt Template:
   - `OVA_Transcribe_Handwritten_Note.genAiPromptTemplate-meta.xml`
   - Activate the prompt template in Setup → Prompt Builder

3. Deploy the Lightning Web Component:
   - `ovaNoteScanner` bundle (HTML, JS, JS-meta.xml)

4. Add the component to Case page layouts:
   - Edit Case Lightning Record Page
   - Drag "OVA Note Scanner" component onto the page
   - Save and activate

## Usage

1. Navigate to a Case record in Lightning Experience
2. Locate the "Handwritten Note Scanner" card
3. Click "Upload handwritten note" and select a photo
4. Click "Transcribe with Einstein"
5. Review the transcribed text (edit if needed)
6. Click "Log as In-Person Meeting" to save as a Task

The transcription will be saved as a Completed Task with:
- Subject: "In-Person Meeting - Field Visit Notes"
- Type: Meeting
- Status: Completed
- Description: Your transcribed note

## Customization Guide

### For Different Objects

To use this component on objects other than Case:

1. **Update the LWC metadata** (`ovaNoteScanner.js-meta.xml`):
```xml
<targetConfigs>
    <targetConfig targets="lightning__RecordPage">
        <objects>
            <object>Account</object>
            <!-- Add your object here -->
        </objects>
    </targetConfig>
</targetConfigs>
```

2. **Update the Apex controller** (`OVANoteScannerController.cls`):
   - Modify `fileAsCaseComment` to accept your object's Id
   - Update the Task's `WhatId` field mapping if needed
   - Consider renaming the method to be object-agnostic

### Customize the Prompt Template

Edit the prompt in `OVA_Transcribe_Handwritten_Note.genAiPromptTemplate-meta.xml`:

```xml
<content>
You are an OCR assistant for [YOUR ORGANIZATION].
[Customize instructions here...]

Rules:
- [Add your specific rules]
- [Customize output format]
</content>
```

Key areas to customize:
- **Organization name** - Replace "Massachusetts Office of the Veteran Advocate"
- **Use case context** - Describe your specific scenario
- **Output format** - Specify structure (bullets, paragraphs, etc.)
- **Handling illegible text** - Define how to mark unclear words
- **Model selection** - Change `primaryModel` if needed (GPT-4, Claude, etc.)

### Customize the Activity/Task Fields

In `OVANoteScannerController.cls`, modify the Task fields:

```apex
Task t = new Task(
    WhatId = caseId,
    Subject = 'Custom Subject Here',        // Change this
    Description = transcription,
    Type = 'Phone Call',                     // Or 'Email', 'Other'
    Status = 'Completed',
    Priority = 'High',                       // Or 'Low', 'Normal'
    ActivityDate = Date.today()
);
```

### Customize the UI Labels

In `ovaNoteScanner.html`:
- Line 2: Card title
- Line 6-7: Upload instructions
- Line 23: Transcribe button label
- Line 50: Transcription header
- Line 60: File button label and text

In `ovaNoteScanner.js`:
- Line 52: Processing message
- Line 58: Success message
- Line 77: Logging message
- Line 85: Success message

### Change Accepted File Formats

In `ovaNoteScanner.js`:
```javascript
acceptedFormats = ['.jpg', '.jpeg', '.png', '.pdf', '.tiff'];
```

## Architecture

```
User uploads photo
    ↓
LWC (ovaNoteScanner)
    ↓
Apex Controller (OVANoteScannerController)
    ↓
Analyzer (OVAHandwrittenNoteAnalyzer)
    ↓
Einstein Prompt Template (OVA_Transcribe_Handwritten_Note)
    ↓
Vision Model (GPT-5 Mini)
    ↓
Transcribed text returned
    ↓
Saved as Task on Case
```

## Troubleshooting

### "Einstein is not responding"
- Verify Einstein AI is enabled in your org
- Check that the prompt template is Published
- Ensure the model (sfdc_ai__DefaultGPT5Mini) is available

### "No handwritten content detected"
- Image quality may be too low
- Try a clearer photo with better lighting
- Ensure the file format is supported

### "Insufficient permissions"
- User needs access to Einstein Prompt Builder
- Verify Create Task permissions on Case
- Check ContentDocument/ContentVersion access

## Credits

Original implementation by Mahathi Devulapalli for the Massachusetts Office of the Veteran Advocate.

Based on Salesforce reference patterns from the [Business Card Scanner AI Demo](https://github.com/salesforce-pixel/businessCardScannerAI_Demo).

## License

This project is provided as-is for educational and demonstration purposes.

## Contributing

To customize for your use case:
1. Fork this repository
2. Modify the prompt template and component labels
3. Test in a sandbox org
4. Deploy to production

For questions or issues, please open a GitHub issue.
