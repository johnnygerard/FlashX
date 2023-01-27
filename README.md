# FlashX
FlashX is a flashcard web application.

Users must create an account to get started.  
As indicated by the domain name, the website is hosted on [Microsoft Azure](https://azure.microsoft.com/en-us/).

## Architecture
FlashX is a [MEAN](https://www.mongodb.com/mean-stack) stack single-page application hosted with Azure [Web App for Containers](https://azure.microsoft.com/en-us/products/app-service/containers/#overview).  

### Front-end
HTML, CSS and TypeScript using the [Angular](https://angular.io/) web framework.

### Back-end
The back-end has two main components:  
* an [Express](https://expressjs.com) HTTP server
* a [MongoDB Atlas](https://www.mongodb.com/atlas) database (also uses the Azure cloud)

These two communicate together via a RESTful API.  

### Execution flow
At deployment time, a Linux VM starts a new Docker container which runs [Node.js](https://nodejs.dev/en/) (16 LTS).  
Node.js launches [PM2](https://pm2.keymetrics.io/) (a process manager) which in turn starts the Express server.

### Authentication
The authentication is provided by [Passport](https://www.passportjs.org/).  
Currently there is only one authentication strategy: username and password.  
More authentication strategies will be added later.

## Project version history

| version | description |
| --- | --- |
| 3.0.0 | TypeScript migration |
| 2.3.0 | Containerization |
| 2.2.0 | Schema validation |
| 2.1.0 | Responsive mobile design |
| 2.0.0 | Angular migration |
| 1.0.0 | First release using [EJS](https://ejs.co/) for the front-end |

## Copyright
© 2022 Johnny Gérard
