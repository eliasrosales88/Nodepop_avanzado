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


  let sendAgain = true;
  setInterval(async ()=>{

    try {
      // mandar un mensaje
      const message = {
        texto: " esta es la tarea creada el " + Date.now()
      };

      // antes de mandar el siguiente mensaje verifico si debo hacerlo
      if (!sendAgain) {
        console.log("Esperando a");
        
        await new Promise(resolve => channel.on("drain", () => { resolve }))
        
      }

      sendAgain = channel.sendToQueue( queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true // el mensaje sobrevive a reinicios del broker (rabbitmq es el broker).
      });

      console.log(`publicado ${message.texto} con resultado ${sendAgain}`);


    } catch (error) {
      console.log(error);
      process.exit(1);
    }
   
  }, 500)


  


}