# --- Solution Domain ---
http://manjaro.stream.stud-srv.sdu.dk/service01

# --- Local Execution ---
### To run the DB:
From folder: /database/

$ docker build -t db .

$ docker run -p 3306:3306 db

#### To Access the docker mysql terminal:
docker exec -it [container id] bash

mysql

### To run the server:
From folder: /server/

$ npm install

$ node javascript/server.js

Visit http://localhost:8080

# --- Local Access to Live Services ---

### Live logs
$ kubectl logs [server pod name] server

### Port forward live database for local use on http://localhost:3306/
$ kubectl port-forward deployment/mysql-deployment 3306:3306

$ mysql --host=127.0.0.1 --port=3306 -u root -p

### Port forward live AWS bucket for local use on http://localhost:9000/minio/
$ kubectl port-forward deployment/minio 9000:9000

### AWS Keys:
accessKey: i04lyk6zckw9ezwhaotevhsac1puly2s

secretKey: b8107i820gnaetd9hh3eszbqssq1n2bk

# --- Manual Deploy of Solution to Kubernetes ---
From folder: /

### Build Server Image
docker build -t gitlab.sdu.dk:5050/semester-project-e2020/team-09-media-acquisition/template:develop-server ./server

docker push gitlab.sdu.dk:5050/semester-project-e2020/team-09-media-acquisition/template:develop-server

### Build Database Image
docker build -t gitlab.sdu.dk:5050/semester-project-e2020/team-09-media-acquisition/template:develop-database ./database

docker push gitlab.sdu.dk:5050/semester-project-e2020/team-09-media-acquisition/template:develop-database

### Deploy Images to Kubernetes
kubectl delete -f ./deploy.yml

kubectl apply -f ./deploy.yml

