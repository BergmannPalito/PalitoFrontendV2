// src/features/patents/services/mockSearch.js

// Import the JSON data directly. Bundlers like Vite/Webpack handle this.
import mockPatentData from '@/assets/mock_EP1626661B1.json'; // Assuming file is in src/assets/

export function mockSearch(pubNumber) {
    console.log(`[mockSearch] Simulating search for: ${pubNumber}`);
    // Simulate network delay
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Check if the requested number matches the patent number in the imported JSON
            if (pubNumber === mockPatentData.patentNr) {
                console.log(`[mockSearch] Found matching data for ${pubNumber}. Returning imported JSON.`);
                // Resolve with the entire imported JSON object
                // Ensure the 'name' field is consistent for tab display if needed
                resolve({
                    ...mockPatentData,
                    id: mockPatentData.patentNr, // Ensure 'id' field matches patentNr for consistency
                    name: mockPatentData.patentNr, // Use patentNr for the tab name
                });
            } else {
                // If the number doesn't match the one in our mock file, reject.
                console.log(`[mockSearch] No matching data found for ${pubNumber} in mock file. Rejecting.`);
                reject(new Error(`Mock data only available for ${mockPatentData.patentNr}. Patent ${pubNumber} not found.`));
            }
        }, 5000); // Adjusted delay slightly
    });
}