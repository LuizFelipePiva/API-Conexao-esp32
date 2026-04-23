import mqtt from "mqtt";

const client = mqtt.connect("mqtt://broker.hivemq.com");

client.on("connect", () => {
  console.log("Conectado ao MQTT (teste)");

  const data = {
    temperatura: 25.8,
    umidade: 60,
    botao: false
  };

  client.publish("esp32/dados", JSON.stringify(data));

  console.log("Mensagem enviada:", data);

  client.end();
});