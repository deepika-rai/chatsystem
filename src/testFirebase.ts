import db from "./config/firebase";

async function testFirebase() {
    try {
        const result = await db.collection("test").add({
            message: "Hello Firebase",
            createdAt: new Date()
        });

        console.log("Firebase Connected Successfully!");
        console.log("Document ID:", result.id);

    } catch (error) {
        console.error(error);
    }
}

testFirebase();