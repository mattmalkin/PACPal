const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// Initialize the admin environment (this gives it god-mode access to your database)
admin.initializeApp();

// Create a function that watches the 'medications' folder for ANY changes
exports.generateMedsJSON = functions.firestore
    .document('medications/{medId}')
    .onWrite(async (change, context) => {
        const db = admin.firestore();
        // Uses the default storage bucket linked to your project
        const bucket = admin.storage().bucket(); 

        try {
            console.log("Database change detected! Generating new JSON file...");

            // 1. Fetch all 800+ medications and sort them alphabetically
            const snapshot = await db.collection('medications').orderBy('name').get();
            const medsArray = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 2. Convert that massive array into a single text string (JSON format)
            const jsonString = JSON.stringify(medsArray);

            // 3. Define where to save the file in your Firebase Cloud Storage
            const file = bucket.file('public/medications.json');

            // 4. Save the file and set the content type so browsers know what it is
            await file.save(jsonString, {
                metadata: {
                    contentType: 'application/json',
                    // This tells the browser to cache this file for 12 hours (43200 seconds)
                    cacheControl: 'public, max-age=43200' 
                }
            });

            console.log(`Success! medications.json updated with ${medsArray.length} items.`);
            return null;
            
        } catch (error) {
            console.error("Critical Error generating JSON:", error);
            return null;
        }
    });