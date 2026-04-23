import mqtt from "mqtt";
import admin from "firebase-admin";
import fs from "fs";

// chave do Firebase (service account)
const serviceAccount = JSON.parse(
    fs.readFileSync("./dinc-c1e06-firebase-adminsdk-fbsvc-6f86edeadd.json", "utf-8")
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// conecta no broker MQTT
const client = mqtt.connect("mqtt:broker.hivemq.com");

client.on("connect", () => {
    console.log("Conectado ao MQTT");
    client.subscribe("dinc/paciente/status");
    // dinc/paciente/status
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Recebido:", data);
    await db.collection("esp32").add(data);
    console.log("Salvo no Firestore");

  } catch (error) {
    console.error("Erro:", error);
  }
});