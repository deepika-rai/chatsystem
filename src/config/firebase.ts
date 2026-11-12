
import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const serviceAccount: ServiceAccount =
    require("./serviceAccountKey.json");

const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount)
    });

const db = getFirestore(app);

export default db;
