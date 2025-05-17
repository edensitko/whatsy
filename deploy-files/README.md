# WhatsApp Interactive Features Update

This package contains files to update your backend with WhatsApp interactive features.

## Files Included:

1. `whatsappListService.ts` - Service for sending list messages, enhanced button messages, and template messages
2. `whatsappInteractiveHandler.ts` - Handler for processing interactive responses
3. `update-backend.sh` - Script to update your backend with the new features

## How to Use:

1. Run the update script:
   ```
   ./update-backend.sh
   ```

2. This will:
   - Copy the new service files to your backend
   - Update the WhatsApp router to handle interactive responses
   - Restart your backend container

3. After updating, you can use the new interactive features:
   - Button messages
   - List messages
   - Template messages
   - Interactive response handling

## Testing the Features:

Send a test message to your WhatsApp number to verify the integration.

## Documentation:

For more information, see the WhatsApp API documentation:
https://www.twilio.com/docs/whatsapp/api
