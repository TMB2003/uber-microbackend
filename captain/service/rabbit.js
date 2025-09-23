const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBIT_URL;

let connection , channel ;

const connect = async () => {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('RabbitMQ connected');
    } catch (error) {
        console.error('RabbitMQ connection error:', error);
    }
};
    
const subscribeToRabbitMQ = async (queueName, callback) => {
    try {
        await connect();
        await channel.assertQueue(queueName);
        channel.consume(queueName, (message) => {
            const ride = JSON.parse(message.content.toString());
            console.log('Ride received:', ride);
            callback(ride);
        });
    } catch (error) {
        console.error('RabbitMQ subscription error:', error);
    }
};

const publishToRabbitMQ = async (queueName, message) => {
    try {
        await connect();
        await channel.assertQueue(queueName);
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
    } catch (error) {
        console.error('RabbitMQ publish error:', error);
    }
};

module.exports = {
    connect,
    subscribeToRabbitMQ,
    publishToRabbitMQ
};
