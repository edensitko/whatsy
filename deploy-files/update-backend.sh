#!/bin/bash
set -e

echo "Updating WhatsApp Backend with Interactive Features"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running or not installed"
  exit 1
fi

# Create directories for the new files
mkdir -p ~/backend-update/src/services

# Copy the new service files
cp whatsappListService.ts ~/backend-update/src/services/
cp whatsappInteractiveHandler.ts ~/backend-update/src/services/

# Update the whatsapp.ts file to handle interactive responses
cat > ~/backend-update/update-whatsapp.sh << 'UPDATE_EOL'
#!/bin/bash

# Get the container ID
CONTAINER_ID=$(docker ps -qf "name=whatsy-backend")

if [ -z "$CONTAINER_ID" ]; then
  echo "Error: whatsy-backend container is not running"
  exit 1
fi

# Copy the new service files into the container
docker cp ~/backend-update/src/services/whatsappListService.ts $CONTAINER_ID:/app/src/services/
docker cp ~/backend-update/src/services/whatsappInteractiveHandler.ts $CONTAINER_ID:/app/src/services/

# Update the imports in the whatsapp.ts file
docker exec $CONTAINER_ID bash -c '
cat > /tmp/update-imports.js << EOF
const fs = require("fs");
const path = "/app/src/routes/whatsapp.ts";

let content = fs.readFileSync(path, "utf8");

// Add the new imports if they don't exist
if (!content.includes("whatsappListService")) {
  const importSection = \`import express from "express";
import { 
  processWhatsAppMessage, 
  sendWhatsAppMessage, 
  getUserSession, 
  storeUserSession, 
  addMessageToSession,
  sendTypingIndicator,
  sendWhatsAppInteractiveMessage,
  restartTwilioClient
} from "../services/whatsappService";
import {
  sendWhatsAppListMessage,
  sendEnhancedButtonMessage,
  sendTemplateMessage
} from "../services/whatsappListService";
import {
  processInteractiveResponse,
  handleInteractiveResponse,
  sendWelcomeMessage,
  sendAppointmentConfirmation
} from "../services/whatsappInteractiveHandler";\`;

  content = content.replace(/import express from "express";[\\s\\S]*?from "\\.\\.\\/services\\/whatsappService";/, importSection);
}

// Add the interactive response handling code if it doesn't exist
if (!content.includes("processInteractiveResponse")) {
  const targetSection = "// Mark this message as processed\\n      global.processedMessages.set(messageSid, Date.now());";
  const replacementSection = \`// Mark this message as processed
      global.processedMessages.set(messageSid, Date.now());
      
      // Check if this is an interactive message response (button or list selection)
      const interactiveResponse = processInteractiveResponse(req.body);
      if (interactiveResponse) {
        console.log("Processing interactive response:", JSON.stringify(interactiveResponse));
        // Handle the interactive response
        await handleInteractiveResponse(interactiveResponse);
        return;
      }\`;

  content = content.replace(targetSection, replacementSection);
}

fs.writeFileSync(path, content);
console.log("WhatsApp router updated successfully!");
EOF

node /tmp/update-imports.js
'

# Restart the container to apply changes
echo "Restarting the backend container..."
docker restart $CONTAINER_ID

echo "Backend updated successfully with WhatsApp interactive features!"
echo "Check the logs with: docker logs whatsy-backend"
UPDATE_EOL

# Make the update script executable
chmod +x ~/backend-update/update-whatsapp.sh

# Run the update script
~/backend-update/update-whatsapp.sh

echo "WhatsApp interactive features have been added to your backend!"
echo "You can now use button messages, list messages, and template messages."
