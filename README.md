
# NodePop
  
[Demo](/anuncios) of the methods (this link works only if you run the project)

Api for the iOS/Android apps.

## Deploy

### Install dependencies
    
    npm install

### Configure  

Review lib/connectMongoose.js to set database configuration

### Init database

    npm run installDB

## Start

To start a single instance:
    
    npm start

To start in development mode:

    npm run dev (including nodemon & debug log)


## Internationalization  
You can go to [Demo](/anuncios) and check the **EN** and **ES** links to change language.

## JWT API
  **Authentication:** Send a POST request to `http://localhost:3000/apiv1/authenticate`
  
  ```json
  {
    "success": true,
    "token": "HEADER.PAYLOAD.SIGNATURE"
  }
  ```

  **Verify authentication:** Send a GET request to `http://localhost:3000/apiv1/anuncios`

  - Send in the body of the request **key:** token **value:** HEADER.PAYLOAD.SIGNATURE(jwt)


## RabbitMQ  

  The implementation of **rabbitmq** was made using **docker**
      
      docker run -d --hostname=mq --name mq -p 8080:15672 -p 5672:5672 rabbitmq:3-management

After running docker image of rabbitmq you can go to **http://localhost:8080/**

You can send **POST** requests to http://localhost:3000/apiv1/anuncios after being authenticated to post a new advert and start the queue to resize the image sent in the request. This resquest subscribes to a queue.

To consume the task is required to run in the terminal

    nodemon queue/consumer.js

## Test

    npm test (pending to create, the client specified not to do now)

## JSHint & JSCS

    npm run hints

## API v1 info


### Base Path

The API can be used with the path:
[API V1](/apiv1/anuncios)

### Error example

    {
      "ok": false,
      "error": {
        "code": 401,
        "message": "This is the error message."
      }
    }

### GET /anuncios

**Input Query**:

start: {int} skip records
limit: {int} limit to records
sort: {string} field name to sort by
includeTotal: {bool} whether to include the count of total records without filters
tag: {string} tag name to filter
venta: {bool} filter by venta or not
precio: {range} filter by price range, examples 10-90, -90, 10-
nombre: {string} filter names beginning with the string

Input query example: ?start=0&limit=2&sort=precio&includeTotal=true&tag=mobile&venta=true&precio=-90&nombre=bi

**Result:** 

    {
      "ok": true,
      "result": {
        "rows": [
          {
            "_id": "55fd9abda8cd1d9a240c8230",
            "nombre": "iPhone 3GS",
            "venta": false,
            "precio": 50,
            "foto": "/images/anuncios/iphone.png",
            "__v": 0,
            "tags": [
              "lifestyle",
              "mobile"
            ]
          }
        ],
        "total": 1
      }
    }


### GET /anuncios/tags

Return the list of available tags for the resource anuncios.

**Result:** 

    {
      "ok": true,
      "allowed_tags": [
        "work",
        "lifestyle",
        "motor",
        "mobile"
      ]
    }
