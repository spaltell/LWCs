# Deployment Instructions

## Quick Deploy to Any Org

### Step 1: Clone the Repository
```bash
git clone https://github.com/spaltell/LWCs.git
cd LWCs
```

### Step 2: Authenticate to Your Salesforce Org
```bash
# For sandbox
sf org login web --alias my-sandbox --instance-url https://test.salesforce.com

# For production
sf org login web --alias my-prod
```

### Step 3: Deploy All Components
```bash
sf project deploy start --target-org my-sandbox
```

Expected output:
```
Status: Succeeded
Deployed Source
├── OVAHandwrittenNoteAnalyzer (ApexClass)
├── OVANoteScannerController (ApexClass)
├── OVA_Transcribe_Handwritten_Note (GenAiPromptTemplate)
└── ovaNoteScanner (LightningComponentBundle)
```

### Step 4: Activate the Prompt Template
1. Go to Setup → Prompt Builder
2. Find "OVA Transcribe Handwritten Note"
3. Click "Activate"
4. Verify the status shows "Published"

### Step 5: Add to Case Page Layout
1. Go to Setup → Object Manager → Case
2. Click "Lightning Record Pages"
3. Edit your Case record page (or create a new one)
4. Drag "OVA Note Scanner" component from the left panel onto the page
5. Save and activate the page

### Step 6: Grant User Permissions
Users need:
- **Einstein Generative AI User** permission set
- **Create** permission on Tasks
- **Read/Write** access to Cases
- **ContentDocument** access for file uploads

Assign permissions:
```bash
# Via CLI
sf org assign permset --name Einstein_Generative_AI_User --target-org my-sandbox

# Or manually in Setup → Users → Permission Sets
```

## Deploy Individual Components

### Just the Prompt Template
```bash
sf project deploy start --metadata "GenAiPromptTemplate:OVA_Transcribe_Handwritten_Note" --target-org my-sandbox
```

### Just the LWC
```bash
sf project deploy start --metadata "LightningComponentBundle:ovaNoteScanner" --target-org my-sandbox
```

### Just the Apex Classes
```bash
sf project deploy start --metadata "ApexClass:OVAHandwrittenNoteAnalyzer,ApexClass:OVANoteScannerController" --target-org my-sandbox
```

## Validate Before Deploying
```bash
sf project deploy validate --target-org my-prod
```

## Deploy to Multiple Orgs

### Create a deployment script
```bash
#!/bin/bash
# deploy-to-all.sh

ORGS=("org1" "org2" "org3")

for org in "${ORGS[@]}"
do
    echo "Deploying to $org..."
    sf project deploy start --target-org "$org"
done
```

## Troubleshooting Deployment Issues

### Error: "GenAiPromptTemplate metadata type not found"
**Solution:** Your org needs Einstein AI enabled. Contact Salesforce support to enable it.

### Error: "Insufficient permissions"
**Solution:** 
1. Run as an admin user
2. Ensure Einstein features are enabled in Setup → Einstein Setup

### Error: "Component not found in App Builder"
**Solution:**
1. Refresh the Lightning App Builder page
2. Check that deployment succeeded with no errors
3. Verify API version compatibility (should be 66.0+)

### Error: "Prompt template won't activate"
**Solution:**
1. Check that the model `sfdc_ai__DefaultGPT5Mini` is available
2. Try a different model in the prompt template metadata
3. Verify Einstein Trust Layer is configured

## Post-Deployment Checklist

- [ ] Prompt template deployed and activated
- [ ] LWC component deployed
- [ ] Apex classes deployed
- [ ] Component added to Case page layout
- [ ] Users granted Einstein permissions
- [ ] Tested upload and transcription flow
- [ ] Verified Task creation
- [ ] Checked error handling

## Rollback

If you need to remove the components:

```bash
sf project delete source --metadata "GenAiPromptTemplate:OVA_Transcribe_Handwritten_Note" --target-org my-sandbox
sf project delete source --metadata "LightningComponentBundle:ovaNoteScanner" --target-org my-sandbox
sf project delete source --metadata "ApexClass:OVAHandwrittenNoteAnalyzer,ApexClass:OVANoteScannerController" --target-org my-sandbox
```

Or manually:
1. Deactivate prompt template in Prompt Builder
2. Remove component from page layouts
3. Delete components in Setup → Apex Classes, Lightning Components

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Salesforce

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Salesforce CLI
        run: npm install -g @salesforce/cli
      - name: Authenticate
        run: sf org login jwt --client-id ${{ secrets.SF_CLIENT_ID }} --jwt-key-file server.key --username ${{ secrets.SF_USERNAME }}
      - name: Deploy
        run: sf project deploy start --target-org my-org
```

## Support

For deployment issues:
1. Check the Salesforce CLI logs: `sf --help`
2. Review the [Salesforce CLI documentation](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/)
3. Open a GitHub issue with deployment error details
