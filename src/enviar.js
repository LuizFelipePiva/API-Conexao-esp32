import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import mqtt from "mqtt";
import fs from "fs";

// 🔥 carregar credenciais
const serviceAccount = JSON.parse(
    fs.readFileSync("./dinc-c1e06-firebase-adminsdk-fbsvc-6f86edeadd.json", "utf-8")
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// 👇 AGORA SIM (sem parâmetros)
const db = getFirestore();

// 🔥 força REST (resolve seu erro de certificado)
db.settings({
    preferRest: true,
});

// 📡 conectar MQTT
const client = mqtt.connect("mqtt:broker.hivemq.com");
//test.mosquitto.org

const EMAIL = "dinc@dinc.com";

client.on("connect", async () => {
    console.log("Conectado ao MQTT");

    try {
        // 🔍 buscar medicines pelo email
        const medicinesSnapshot = await db
            .collection("medicines")
            .where("email", "==", EMAIL)
            .get();

        const result = [];

        // 🔁 para cada medicine, buscar seus schedules
        for (const doc of medicinesSnapshot.docs) {
            const med = doc.data();

            const medicineRef = db.collection("medicines").doc(doc.id);

            const schedulesSnapshot = await db
                .collection("schedules")
                .where("medicine_ref", "==", medicineRef)
                .get();

            const horarios = [];

            schedulesSnapshot.forEach((scheduleDoc) => {
                const data = scheduleDoc.data();

                if (data.time) {
                    const date = data.time.toDate();

                    // 🔥 FORMATO CORRETO PRO ESP32 (HHMM)
                    const horario = date.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    });
                    horarios.push(horario);
                }
            });



            // 🔥 ordenar horários (opcional, mas recomendado)
            horarios.sort((a, b) => {
                const [h1, m1] = a.split(":").map(Number);
                const [h2, m2] = b.split(":").map(Number);
                return h1 * 60 + m1 - (h2 * 60 + m2);
            });

            result.push({
                "id": parseInt(med.compartment),
                "nome": med.name,
                "horario": horarios[0],
                "dose": med.dosage,
                "dias": [true, true, true, true, true, true, true]
            });
/*
    "id": 0,
    "nome": "Paracetamol",
    "dose": "500mg",
    "horario": "08:00",
    "dias": [true, true, true, true, true, true, true] 
*/
        }

        console.log("Resultado final:", result);

        // 📤 enviar pro MQTT
        client.publish("dinc/config/remedios", JSON.stringify(result));

    } catch (error) {
        console.error("Erro:", error);
    }
});