"use strict";

// ESTAMOS USANDO EL PATRON WORK QUEUE (colas de trabajo)
// https://www.rabbitmq.com/getstarted.html

const connectionPromise = require("../lib/connectAMQP");

const queueName = "tareas";

main().catch( err => { console.log("Hubo un error:", err) });


async function main() {

  // conectamos al servidor AMQP
  const conn = await connectionPromise;

  // conectar a un canal
  const channel = await conn.createChannel()  // con esto voy a hablar con las colas
  
  // asegurar que la cola existe
  await channel.assertQueue( queueName, {
    durable: true // la cola sobrevive a reinicios del broker
  });

  // cuantos mensajes quiero procesar en paralelo
  channel.prefetch(1);

  // me suscribo a una cola
  channel.consume(queueName, msg => {
    console.log(msg.content.toString());

    // hago el trabajo que corresponda a este worker(redimensionar una image, llamar a una api. etc...)
    setTimeout(()=>{

      channel.ack(msg); // ya he procesado el mensaje, le confirmo para que se borre de la cola
    }, 500)
  });
}